const express = require('express');
const ws = require('ws');
const app = express();
const PubSub = require('pubsub-js');

const modules = {
  quests: require('./modules/quests')({app: app}),
  level: require('./modules/level')({app: app}),
  chat: require('./modules/chat')({app: app})
}

const port = 3000;

app.use(express.static('public'));

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {
  socket.on('message', message => {
    const msg = JSON.parse(message);
    PubSub.publish("WS!" + msg.module, msg);
  });

  PubSub.subscribe("WS", (msg, data) => {
    socket.send(JSON.stringify(data));
  });
});

app.get('/modules/:moduleName/html', (req, res) => {
  const moduleName = req.params.moduleName;
  const module = modules[moduleName] || {};
  res.send(module.html)
})

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});