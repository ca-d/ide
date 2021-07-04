import { DeployClient } from 'https://crux.land/5KVm9w';

/** # Welcome to the Deno Deploy IDE
 * 
 * By default, you may press ctrl+s to copy the contents of this editor
 * to the clipboard in the form of a link you can post to your own Deno Deploy
 * project to run your very own custom version of this IDE.
 * 
 * This version of the source code was pushed to https://ide.deno.dev magically
 * by deno deploy from a commit to
 * https://github.com/ca-d/deploy-editor/edit/main/ide.ts .
 * If you feel adventurous, try deploying your own instance to Deno Deploy,
 * generate a deploy token, then try hitting ctrl+d on the running website and
 * entering your deploy name and deploy token.
 *
 * For example, https://deploy-editor.deno.dev was deployed by hitting ctrl+d on
 * the website itself and entering `deploy-editor` under "Deploy name" and my
 * secret deploy token under "Deploy token", which I'm not going to tell you ;-P .
 * 
 * If you want a boring old file version of the typescript source code from this
 * editor in order to upload it to github and deploy from there because you're
 * feeling reactionary or can't figure out how to get your own Deno Deploy token
 * (hint: https://dash.deno.com/account), go ahead and press ctrl+shift+s .
 * I dare you.
 */

const defaults = {
	theme: 'solarized_dark',
	mode: 'typescript',
	url: 'https://raw.githubusercontent.com/ca-d/deploy-editor/main/ide.ts',
	format: 'data:text/javascript;base64,',
};

function env(key, def) {
	return Deno.env.get(key) ?? def ?? defaults[key] ?? '';
}

async function handlePost(request) {
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

  if (contentType.includes("text/javascript")) {
    const text = await request.text();
    const deploy = new DeployClient(request.headers.get('X-Deploy-Token'));
    const url = env('format') + btoa(text);
          
		const projects = await deploy.fetchProjects();
		const project = projects.find(p => p.name === request.headers.get('X-Deploy-Name'));
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
        if (e.ctrlKey && (e.key.toLowerCase() === 's' || e.key === 'd')) {
          e.stopPropagation();
          e.preventDefault();
          const title = 'mod.ts';
          const format = '${env('format')}';
          const text = editor.value;
          const url = format + btoa(text);
          if (e.key === 'd') {
            const token = localStorage.getItem('deploy-token') ||
              window.prompt('Deploy token');
            const name = localStorage.getItem('deploy-name') ||
              window.prompt('Deploy name');
            localStorage.setItem('deploy-token', token);
            localStorage.setItem('deploy-name', name);
	          fetch('/',
	          {
	          	method: 'POST',
	          	body: editor.value,
	          	headers: {
	          		'Content-Type': 'text/javascript',
	          		'X-Deploy-Token': token,
	          		'X-Deploy-Name': name,
	          	}
	          }).then(res => res.text().then(alert));
          } else if (e.key === 'S') downloadString(text, 'text/javascript', title);
          else if (navigator.canShare?.()) navigator.share({url, text, title});
          navigator.clipboard.writeText(url);
        }
      },
      true
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

addEventListener("fetch", (event) => {
  event.respondWith(event.request.method === 'POST' ? handlePost(event.request) : new Response(html, {
    headers: {
    	"Access-Control-Allow-Origin": "*",
      "Content-Type": "text/html; charset=UTF-8",
    },
  }));
});
