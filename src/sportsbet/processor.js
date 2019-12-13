const { get, all } = require('../client/httpClient');
const { config } = require('../config');
const { NbaMatch } = require('./models/nbaMatch');
const { PlayerMarket } = require('./models/playerMarket');
const { getPlayerProps } = require('../beteasy/processor');
const { getPlayerMarkets } = require('../ladbrokes/processor');
const bet365 = require('../bet365/processor');
const _ = require('lodash');

function getMatches() {
  return get(`${config.SPORTSBET_BASE_URL}/Competitions/${config.SPORTSBET_NBA_COMPETITION_ID}`)
    .then((response) => {
      const events = [];
      if (response.data && response.data.events.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < response.data.events.length; index++) {
          const event = response.data.events[index];
          if (event.bettingStatus === 'PRICED') {
            events.push(new NbaMatch(event));
          }
        }
        return events;
      }
      return new Error('There are no events available at the moment, please check back later');
    })
    .catch()
    .finally();
}

function getPlayerMarket(eventId, eventName) {
  const sportsBetCall = get(`${config.SPORTSBET_BASE_URL}/Events/${eventId}/MarketGroupings/567/Markets`);
  const betEasyCall = getPlayerProps(eventName);
  const ladbrokesCall = getPlayerMarkets(eventName);
  const bet365Call = bet365.getPlayerMarkets(eventName);
  return all([sportsBetCall, betEasyCall, ladbrokesCall, bet365Call])
    .then((response) => {
      const markets = [];

      // process sports bet response
      if (response[0].data && response[0].data.length > 0) {
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < response[0].data.length; index++) {
          const event = response[0].data[index];
          if (event.name.endsWith('- Points')) {
            markets.push(new PlayerMarket(event));
          }
        }
      }

      // process bet easy response
      const betEasyProps = response[1];
      for (let index = 0; index < betEasyProps.length; index++) {
        const prop = betEasyProps[index];
        let finalProp = _.find(markets, (market) => market.playerName.toLowerCase() === prop.playerName.toLowerCase());
        if (finalProp) {
          finalProp.betEasySelections = prop;
        }
      }

      // process ladbrokes response
      const ladbrokesResponse = response[2];
      for (let index = 0; index < ladbrokesResponse.length; index++) {
        const prop = ladbrokesResponse[index];
        let finalProp = _.find(markets, (market) => market.playerName.toLowerCase() === prop.playerName.toLowerCase());
        if (finalProp) {
          finalProp.ladbrokesSelections = prop;
        }
      }

      // process bet365 Response
      const bet365Response = response[3];
      for (let index = 0; index < bet365Response.players.length; index++) {
        const prop = bet365Response.players[index];
        let finalProp = _.find(markets, (market) => market.playerName.toLowerCase() === prop.playerName.toLowerCase());
        if (finalProp) {
          finalProp.bet365Selections = prop;
        }
      }

      // return final markets
      return markets;
    })
    .catch()
    .finally();
}

module.exports = {
  getMatches,
  getPlayerMarket
}