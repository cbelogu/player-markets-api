const express = require('express');
const dataService = require('./src/data');
const app = express();
// export NODE_OPTIONS=--http-parser=legacy
const PORT = 3001;

app.get('/', (req, res) => {
  res.send('all is well');
});

app.get('/events', (req, res) => {
  dataService.getAvailableMatches()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(JSON.stringify(err));
    });
});

app.get('/event/:id/:name', (req, res) => {
  const id = req.params.id;
  const eventName = req.params.name;
  dataService.getPlayerMarketsForEvent(id, eventName)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(JSON.stringify(err));
    });
});

/* eslint-disable no-console */
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
