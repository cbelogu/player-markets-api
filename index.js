const express = require('express');
const dataService = require('./src/data');
const cors = require('cors');
const app = express();
app.use(cors());
// export NODE_OPTIONS=--http-parser=legacy
const PORT = 1234;

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

app.get('/event/:id/:name/:betType', (req, res) => {
  const { id, name } = req.params;
  const marketType = parseInt(req.params.betType);
  dataService.getPlayerMarketsForEvent(id, name, marketType)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(JSON.stringify(err));
    });
});

/* eslint-disable no-console */
app.listen(process.env.PORT || PORT, () => console.log(`listening on port ${PORT}`));
