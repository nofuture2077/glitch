const express = require('express');
const ws = require('ws');
const app = express();
const PubSub = require('pubsub-js');

app.use(express.json());

const settings = require('./modules/settings')({app: app});

const modules = {
  settings: settings,
  test: require('./modules/test')({app: app, settings: settings}),
  events: require('./modules/events')({app: app, settings: settings}),
  clips: require('./modules/clips')({app: app, settings: settings}),
  quests: require('./modules/quests')({app: app, settings: settings}),
  level: require('./modules/level')({app: app, settings: settings}),
  notifications: require('./modules/notifications')({app: app, settings: settings}),
  chatbot: require('./modules/chatbot')({app: app, settings: settings}),
  activity: require('./modules/activity')({app: app, settings: settings}),
  wahoo: require('./modules/wahoo')({app: app, settings: settings}),
  heartrate: require('./modules/heartrate')({app: app, settings: settings}),
  chat: require('./modules/chat')({app: app, settings: settings})
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

app.get('/modules/:moduleName/:mode', (req, res) => {
  const moduleName = req.params.moduleName;
  const module = modules[moduleName] || {};
  res.send(module[req.params.mode])
})

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
