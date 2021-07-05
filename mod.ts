import { DeployClient } from "https://crux.land/5KVm9w";

/*******************************************************************************
 * # Welcome to the Deno Deploy IDE
 *
 * By default, you may press `ctrl+s` to copy the contents of this editor
 * to the clipboard in the form of a link you can post to your own Deno Deploy
 * project to run your very own custom version of this IDE.
 *
 * Please find all shortcuts under `defaults.shortcuts` below.
 *
 * This version of the source code was pushed to https://ide.deno.dev magically
 * by deno deploy from a commit to
 * https://github.com/ca-d/ide/edit/main/mod.ts .
 * If you feel adventurous, try deploying your own instance to Deno Deploy,
 * generate a deploy token, then try hitting `ctrl+d` on the running website and
 * entering your deploy name and deploy token.
 *
 * For example, https://deploy-editor.deno.dev was deployed by hitting `ctrl+d`
 * on that very website and entering `deploy-editor` under "Deploy name" and my
 * secret deploy token under "Deploy token", which I'm not going to tell you ;-P
 *
 * If you want a boring old file version of the typescript source code from this
 * editor in order to upload it to github and deploy from there because you're
 * feeling reactionary or can't figure out how to get your own Deno Deploy token
 * (hint: https://dash.deno.com/account), go ahead and press `ctrl+shift+s` .
 * I dare you.
 ******************************************************************************/

const defaults = {
  theme: "solarized_dark",
  mode: "typescript",
  url: "https://raw.githubusercontent.com/ca-d/ide/main/mod.ts",
  format: "data:text/javascript;base64,",
  shortcuts: `{
      r: reload,
      s: copy,
      S: download,
      o: open,
      d: deploy,
    }`,
};

function env(key) {
  return Deno.env.get(key) ?? defaults[key] ?? "";
}

async function handleSrc(request) {
  const deploy = new DeployClient(request.headers.get("X-Deploy-Token"));

  const projects = await deploy.fetchProjects();
  const project = await deploy.fetchProject(
    projects.find((p) => p.name === request.headers.get("X-Deploy-Name")).id
  );
  return new Response(project.productionDeployment.url, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
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
      }
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
    const url = env("format") + btoa(text);
    const deploy = new DeployClient(request.headers.get("X-Deploy-Token"));

    const projects = await deploy.fetchProjects();
    const project = projects.find(
      (p) => p.name === request.headers.get("X-Deploy-Name")
    );
    console.log(project);

    await deploy.deploy(project.id, url, true);
    return new Response(text, responseInit);
  }
}

const html = `<html>
<head>
  <title>ide.deno.dev</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons&display=block">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>
<body>

  <script type="module"
    src="https://unpkg.com/ace-custom-element@latest/dist/index.min.js">
  </script>

  <ace-editor theme="ace/theme/${env("theme")}"
              mode="ace/mode/${env("mode")}"
              value="/* ${env("url")} */"
              softTabs wrap>
  </ace-editor>
  
  <div class="fabs">
    <i class="fa down fa-cloud-download-alt"></i>
    <i class="fa copy fa-copy"></i>
    <i class="fa save fa-file-download"></i>
    <i class="fa open fa-external-link-alt"></i>
    <i class="fa up fa-cloud-upload-alt"></i>
  </div>
  
  <!--
  <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/js/all.min.js" integrity="sha512-RXf+QSDCUQs5uwRKaDoXt55jygZZm2V++WUZduaU/Ui/9EGp3f/2KZVahFZBKGH0s774sd3HmrhUy+SgOFQLVQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  -->
  
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
    
    async function loadURL(url) {
      const res = await fetch(url);
      const text = await res.text();
      if (text) {
        console.log('loading', url);
        editor.setAttribute('valu', text);
      }
    }
    
    async function reload() {
      const deployURLRes = await fetch('/src', {
              method: 'GET',
              headers: {
                'Content-Type': 'text/plain',
                'X-Deploy-Token': localStorage.getItem('deploy-token') || 'INVALID-TOKEN',
                'X-Deploy-Name': localStorage.getItem('deploy-name') || 'INVALID-NAME'
              }
            });
      const deployURL = await deployURLRes.text();
      const deployRes = await fetch(deployURL);
      const deployText = await deployRes.text();
      if (deployText) {
        console.log('deploy', deployURL);
        editor.setAttribute('value', deployText);
      }
    }
    
    async function initEditor() {
      await loadURL('${env("url")}');
      const clipURL = await navigator.clipboard.readText();
      await loadURL(clipURL);
      await reload();
    }

    initEditor();
    
    function deploy() {
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
    }
    
    function download() {
      downloadString(editor.value, 'text/javascript', window.location.hostname +
       '.ts');
    }
    
    function copy() {
      const title = window.location.hostname + '.ts';
      const text = editor.value;
      const url = '${env("format")}' + btoa(text);
      if (navigator.canShare?.()) {
        navigator.share({url, text, title});
      } else {
        navigator.clipboard.writeText(url);
        alert('Copied ' + url.substring(0,30) + '...');
      }
    }
    
    async function open() {
      const url = prompt('Load URL');
      if (!url) return;
      const res = await fetch(url);
      const text = await res.text();
      editor.setAttribute('value', text)
    }
    
    const saveUI = document.querySelector('.save');
    const shareUI = document.querySelector('.copy');
    const uploadUI = document.querySelector('.up');
    const downloadUI = document.querySelector('.down');
    const openUI = document.querySelector('.open');
    
    saveUI.addEventListener('click', download);
    shareUI.addEventListener('click', copy);
    uploadUI.addEventListener('click', deploy);
    downloadUI.addEventListener('click', reload);
    openUI.addEventListener('click', open);
    
    const shortcuts = ${env("shortcuts")};
    
    document.addEventListener('keydown',
      async e => {
        if (e.ctrlKey && shortcuts.hasOwnProperty(e.key)) {
          e.stopPropagation();
          e.preventDefault();
          shortcuts[e.key]();
        }
      },
      true
    );
  </script>

  <style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;600&display=swap');
  body {
    margin: 0px;
    scrollbar-width: thin;
  }
  
  ace-editor.ace_editor {
      width: 100vw;
      height: 100vh;
      font-size: 1.7vw;
      font-family: 'Fira Code';
  }
  
  div.fabs {
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 16px;
    right: 16px;
  }
  
  div.fabs > * {
    margin: auto;
    padding: 8px;
    font-size: 64px;
    animation: color_change 10s infinite alternate;
  }
  
  @keyframes color_change {
		from { color: #cba; }
		to { color: #abc; }
	}
  
  </style>
</body>
</html>`;

addEventListener("fetch", (event) => {
  event.respondWith(
    event.request.method === "POST"
      ? handlePost(event.request)
      : new URL(event.request.url).pathname.startsWith("/src")
      ? handleSrc(event.request)
      : new Response(html, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "text/html; charset=UTF-8",
          },
        })
  );
});
