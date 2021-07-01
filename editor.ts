import { escapeHtml } from "https://deno.land/x/escape/mod.ts";

async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  
  let url = '';
  let data = { value: 'console.info("Hello, Deno Deploy!")' };

  if (pathname.startsWith("/store")) {
    let path = pathname.substring(6);
    const opts = { headers: { "content-type": "text/html; charset=UTF-8", }, };
    
    const formData = await request.formData();
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    url = `data:text/plain;base64,${btoa(data['value'])}`;
    console.warn(data);
    console.warn(url);
  }

  const html = `<html>
  <head>
  <title>editor</title>
  </head>
  <body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.12/ace.js" integrity="sha512-GZ1RIgZaSc8rnco/8CXfRdCpDxRCphenIiZ2ztLy3XQfCbQUSCuk8IudvNHxkRA3oUg6q0qejgN/qqyG1duv5Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  
  <div id="editor">function foo(items) {
    var x = "All this is syntax highlighted";
    return x;
}</div>

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
    
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");
    fetch('https://raw.githubusercontent.com/ca-d/deploy-editor/main/editor.ts').then(res => res.text().then(text => editor.session.setContent(text)));
    document.addEventListener('keydown',
      e => {
        if (e.ctrlKey && e.key === 's') {
          e.stopPropagation();
          e.preventDefault();
          const url = 'data:text/plain;base64,' + btoa(editor.getValue());
          copyToClipboard(url);
        }
      }, true);
</script>

<style>
#editor {
    width: 100vw;
    height: 100vh;
    position: absolute;
    top: 0;
    left: 0;
}
</style>
  </body>
    </html>`;

    return new Response(html, {
      headers: {
        // The interpretation of the body of the response by the client depends
        // on the 'content-type' header.
        // The "text/html" part implies to the client that the content is HTML
        // and the "charset=UTF-8" part implies to the client that the content
        // is encoded using UTF-8.
        "content-type": "text/html; charset=UTF-8",
      },
    });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
