const defaults = {
	theme: 'solarized_dark',
	mode: 'typescript',
	url: 'https://raw.githubusercontent.com/ca-d/deploy-editor/main/ide.ts',
	format: 'data:text/javascript;base64,',
};

function env(key, def) {
	return Deno.env.get(key) ?? def ?? defaults[key] ?? '';
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
  
  <script>
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
      e => {
        if (e.ctrlKey && e.key.toLowerCase() === 's') {
          e.stopPropagation();
          e.preventDefault();
          const title = 'mod.ts';
          const format = '${env('format')}';
          const text = editor.value;
          const url = format + btoa(text);
          navigator.clipboard.writeText(url);
          alert('Copied deployable URL ' + url.substring(0,20) + '...')
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

addEventListener("fetch", (event) => {
  event.respondWith(new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  }));
});
