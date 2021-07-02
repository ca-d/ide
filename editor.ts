const routers = {
  GET: [
    ['/store', handleStore],
    ['/', handleGet]
  ] };
  
async function handleStore(request) {
  return new Response('<p>hai store</p>',
    { headers: { "content-type": "text/html; charset=UTF-8" } });
}

async function handleGet(request) {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
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
          // copyToClipboard(url);
          fetch('https://api-ssl.bitly.com/v4/shorten',
          {
            body: JSON.stringify({
	            "domain": "bit.ly",  
	            "long_url": url,
            });
          	headers: {
				      'Content-Type': 'application/json',
				      'Authorization': 'Bearer ${Deno.env.get('bitly')}'
				    },
          }).then(res => res.text().then(text => copyToClipboard(text)));
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
