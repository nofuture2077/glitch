const express = require('express');
const app = express();

const modules = {
  quests: require('./modules/quests')({app: app}),
  level: require('./modules/level')({app: app}),
  chat: require('./modules/chat')({app: app})
}

const port = 3000;

app.use(express.static('public'));

app.get('/modules/:moduleName/html', (req, res) => {
  const moduleName = req.params.moduleName;
  const module = modules[moduleName] || {};
  res.send(module.html)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})