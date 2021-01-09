const express = require('express');
const dataService = require('./src/data');
const cors = require('cors');
const app = express();
app.use(cors());
// export NODE_OPTIONS=--http-parser=legacy
const PORT = 1234;

app.get('/api/', (req, res) => {
  res.send('all is well');
});

app.get('/api/events', (req, res) => {
  dataService.getAvailableMatches()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(JSON.stringify(err));
    });
});

app.get('/api/event/:id/:name/:betType', (req, res) => {
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

app.get('/api/events/bet365', (req, res) => {
  dataService.cacheBet365Markets()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send(JSON.stringify(err));
    });
});

app.put('/api/events/flushCache', (req, res) => {
  dataService.flushCache();
  res.send();
});

app.put('/api/events/populateCache', (req, res) => {
  try {
    dataService.flushCache();
    dataService.getAvailableMatches()
      .then((data) => {
        const dataCallsArray = data.map(match => {
          dataService.getPlayerMarketsForEvent(match.id, match.name, 1)
            .then(console.log('data populated successfully'))
            .catch(console.log);
        });

        return dataCallsArray.reduce((p, c) => p.then(c));
      })
      .catch(console.log);
    res.send(200);
  } catch (error) {
    res.status(500).send(JSON.stringify(error));
  }
});
/* eslint-disable no-console */
app.listen(process.env.PORT || PORT, () => console.log(`listening on port ${PORT}`));
