function setInnerHTML(elm, html) {
    elm.innerHTML = html;

    Array.from(elm.querySelectorAll("script"))
        .forEach(oldScriptEl => {
            const newScriptEl = document.createElement("script");

            Array.from(oldScriptEl.attributes).forEach(attr => {
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

const socket = new WebSocket("ws://" + window.location.host);

socket.addEventListener('open', () => {
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        PubSub.publish('MSG!' + message.target, message);
    });

    PubSub.subscribe("WS", (msg, data) => {
        socket.send(JSON.stringify(data));
    });
});

const hash = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

