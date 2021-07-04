import { S3Bucket } from "https://deno.land/x/s3@0.4.1/mod.ts";

const routers = {
  GET: [
    ['/store', handleStore],
    ['/', handleGet]
  ],
  POST: [
  	['/', handlePost]
	],
};
  
async function handleStore(request) {
  return new Response(`<p>hai store ${request.url}</p>`,
    { headers: { "content-type": "text/html; charset=UTF-8" } });
}

async function handlePost(request) {
	const bucket = new S3Bucket({
	  accessKeyID: Deno.env.get("amazon-id")!,
	  secretKey: Deno.env.get("amazon-key")!,
	  bucket: Deno.env.get("amazon-bucket")!,
	  region: Deno.env.get("amazon-region")!,
	  endpointURL: Deno.env.get("amazon-url")!,
	});
	
	const jsonData = await request.json();
	console.log(jsonData);
	
	const [e, a, v, assert] = jsonData;
	
	const t = new Date().getTime().toString(36) + '-' +
		Math.random().toString(36).substring(2, 15);
	
	const keys = [
	`eavt/${e}/${a}/${v}/${t}`,
	`aevt/${a}/${e}/${v}/${t}`,
	`avet/${a}/${v}/${e}/${t}`,
	`vaet/${v}/${a}/${e}/${t}`,
		];
	
	const encoder = new TextEncoder();
	
	await Promise.allSettled(keys.map(async key => {
		await bucket.putObject(key, encoder.encode(JSON.stringify(assert)), {
		  contentType: "text/plain",
		});
	}))
	
	// Retrieve an object form a bucket.
	const { body } = await bucket.getObject(keys[0]);
	const data = await new Response(body).text();
	console.log(keys[0] + " contains:", data);
	
	// List objects in the bucket.
	const list = bucket.listAllObjects({});
	for await (const obj of list) {
	  console.log("Item in bucket:", obj.key);
	}

	return new Response(data,
    { headers: { "content-type": "text/plain; charset=UTF-8" } });
}

async function handleGet(request) {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  });
}

async function handleRequest(request) {
  const routes = routers[request.method];
  if (!routes)
  return new Response(null, {
    status: 405,
    statusText: "Method Not Allowed",
  });
  
  const handler = routes.find(([prefix, _]) =>
    new URL(request.url).pathname.startsWith(prefix))[1];
  return handler(request);
}

const html = `<html>
<head>
  <title>editor</title>
</head>
<body>
  <script type="module"
    src="https://unpkg.com/ace-custom-element@latest/dist/index.min.js">
  </script>

  <ace-editor theme="ace/theme/solarized_dark"
              mode="ace/mode/typescript"
              value="console.log('hello world');"
              softTabs wrap>
  </ace-editor>
  
  <script>
    function copyToClipboard(message) {
        var textArea = document.createElement("textarea");
        textArea.value = message;
        textArea.style.opacity = "0"; 
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();


        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            alert('Copying text command was ' + msg);
        } catch (err) {
            alert('Unable to copy value , error : ' + err.message);
        }

        document.body.removeChild(textArea);
    }
    
    var editor = document.querySelector('ace-editor');
    fetch(
      'https://raw.githubusercontent.com/ca-d/deploy-editor/main/editor.ts'
    ).then(res => res.text().then(text => editor.setAttribute('value',text)));
    document.addEventListener('keydown',
      e => {
        if (e.ctrlKey && e.key === 's') {
          e.stopPropagation();
          e.preventDefault();
          const url = 'data:text/plain;base64,' + btoa(editor.value);
          copyToClipboard(url);
          fetch('https://kutt.it/api/v2/links',
          {
            body: JSON.stringify({
	            "domain": "kutt.it",
		    "description": "mod.ts",
	            "target": url,
            }),
	    mode: 'no-cors',
	    method: 'POST',
          	headers: {
		      'Content-Type': 'application/json',
		      'X-API-KEY': '${Deno.env.get('kuttit')}'
		    },
          }).then(res => res.text().then(text => console.log(text)));
        }
      }, true);
  </script>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;600&display=swap');
  body {
    margin: 0px;
  }
  ace-editor.ace_editor {
      width: 100vw;
      height: 100vh;
      font-size: 20px;
      font-family: 'Fira Code';
  }
  </style>
</body>
</html>`;

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
