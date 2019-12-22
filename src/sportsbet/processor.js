const { get } = require('../client/httpClient');
const { config } = require('../config');
const { NbaMatch } = require('./models/nbaMatch');

function getMatches() {
  return get(`${config.SPORTSBET.BASE_URL}/Competitions/${config.SPORTSBET.NBA_COMPETITION_ID}`)
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

const getSportsBetMarketUrlAndPropName = (eventId, marketType) => {
  let marketId = 0;
  let propName = '';
  switch (marketType) {
    case 1:
      marketId = config.SPORTSBET.PLAYER_MARKET_ID;
      propName = '- Points';
      break;
    case 2:
      marketId = config.SPORTSBET.REBOUNDS_MARKET_ID;
      propName = '- Rebounds';
      break;
    case 3:
      marketId = config.SPORTSBET.ASSISTS_MARKET_ID;
      propName = '- Assists';
      break;
    default:
      throw new Error('Invalid Market Type, Should be 1 or 2 or 3. Passed in value is ' + marketType);
  }

  return {
    sportsBetUrl: `${config.SPORTSBET.BASE_URL}/Events/${eventId}/MarketGroupings/${marketId}/Markets`,
    marketName: propName,
  };
}

module.exports = {
  getMatches,
  getSportsBetMarketUrlAndPropName,
}