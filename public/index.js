function setInnerHTML(elm, html) {
    elm.innerHTML = html;
    
    Array.from(elm.querySelectorAll("script"))
      .forEach( oldScriptEl => {
        const newScriptEl = document.createElement("script");
        
        Array.from(oldScriptEl.attributes).forEach( attr => {
          newScriptEl.setAttribute(attr.name, attr.value) 
        });
        
        const scriptText = document.createTextNode(oldScriptEl.innerHTML);
        newScriptEl.appendChild(scriptText);
        
        oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
    });
  }

  const moduleNodes = document.querySelectorAll('[data-module]');
  moduleNodes.forEach(mN => {
    const moduleName = mN.getAttribute('data-module');
    fetch('/modules/' + moduleName + "/html").then(res => res.text()).then(text => {
      setInnerHTML(mN, text);
    });
  }); 

const socket = new WebSocket("ws://localhost:3000");

socket.addEventListener('open', () => {
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        PubSub.publish('MSG!' + message.target, message);
    });

    PubSub.subscribe("WS", (msg, data) => {
        socket.send(JSON.stringify(data));
    });
});

