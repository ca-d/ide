const defaults = {
	theme: 'solarized_dark',
	mode: 'typescript',
	url: 'https://raw.githubusercontent.com/ca-d/deploy-editor/main/ide.ts',
	format: 'data:text/javascript;base64,',
};

function env(key, def) {
	return Deno.env.get(key) ?? def ?? defaults[key] ?? '';
}

function handlePost(request) {
	if (!request.headers.has("content-type")) {
    return new Response(
      JSON.stringify({ error: "please set 'content-type: text/javascript'" }),
      {
        status: 400,
        statusText: "Bad Request",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );
  }
  const contentType = request.headers.get("content-type");
  const responseInit = {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
    },
  };

	// Handle JS data.
  if (contentType.includes("text/javascript")) {
    const text = await request.text();
    const deploy = new DeployClient('DEPLOYTOKEN');
    const url = env('format') + btoa(text);
          
		const projects = await deploy.fetchProjects();
		project = projects.find(p => p.name === 'deploy-editor');
		console.log(await deploy.deploy(project.id, url));
    return new Response(text, responseInit);
  }
}

const html = `<html>
<head>
  <title>editor</title>
</head>
<body>
  <script type="module"
    src="https://unpkg.com/ace-custom-element@latest/dist/index.min.js">
  </script>

  <ace-editor theme="ace/theme/${env('theme')}"
              mode="ace/mode/${env('mode')}"
              value="/* ${env('url')} */"
              softTabs wrap>
  </ace-editor>
  
  <script type="module">
  
    function downloadString(text, fileType, fileName) {
      var blob = new Blob([text], { type: fileType });

      var a = document.createElement('a');
      a.download = fileName;
      a.href = URL.createObjectURL(blob);
      a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
    }
    
    var editor = document.querySelector('ace-editor');
    
    fetch('${env('url')}').then(
      res => res.text().then(
        text => {
          editor.setAttribute('value',text);
          navigator.clipboard.readText().then(
            clipText =>
              clipText?.startsWith('${env('format')}') ?
              editor.setAttribute('value', atob(clipText.substring(${env('format').length}))) : null
          )
        }
      )
    );
    
    document.addEventListener('keydown',
      async e => {
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.stopPropagation();
          e.preventDefault();
          const title = 'mod.ts';
          const format = '${env('format')}';
          const text = editor.value;
          const url = format + btoa(text);
          navigator.clipboard.writeText(url);
          Notification.requestPermission().then(result => {
					  result === 'granted' ?
					  	new Notification('copied', {body: url}) :
					    console.log('copied', url)
					});
          if (e.key === 'S') downloadString(text, 'text/javascript', title);
        }
      }
    );
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

addEventListener("fetch", ({request}) => {
  event.respondWith(request.method === 'POST' ? handlePost(request) : new Response(html, {
    headers: {
    	"Access-Control-Allow-Origin": "*",
      "Content-Type": "text/html; charset=UTF-8",
    },
  }));
});
