const { get } = require('../client/httpClient');
const { config } = require('../config');
const _cache = require('../client/cacheManager').cacheManager;

const getMatchUrls = async (matchName) => {
  matchName = matchName.replace(' At ', ' @ ');
  const cachedData = _cache.get(config.POINTSBET.NBA_MATCHES_URL);
  if (cachedData) {
    return cachedData.find(item => item.matchName === matchName);
  }
  return get(config.POINTSBET.NBA_MATCHES_URL)
    .then((response) => {
      try {
        if (response.data.events.length > 0) {
          const formattedResponse = response.data.events.map(event => {
            return {
              matchName: event.name,
              matchId: event.key
            };
          });
          const cacheOutcome = _cache.set(config.POINTSBET.NBA_MATCHES_URL, formattedResponse);
          if (cacheOutcome) {
            console.log(`Points bet urls saved successfully: ${JSON.stringify(formattedResponse)}`);
          }
          return Promise.resolve(formattedResponse.find(item => item.matchName === matchName));
        }
        return Promise.resolve(null);
      } catch (error) {
        return Promise.resolve(null);
      }
    })
    .catch((error) => {
      console.log(`An error occured while fetching points bet url... ${JSON.stringify(error)}`);
      return Promise.resolve(null);
    })
}

function getMarketName(marketType) {
  let propName = '';
  switch (marketType) {
    case 1:
      propName = config.POINTSBET.PLAYER_POINTS;
      break;
    case 2:
      propName = config.POINTSBET.PLAYER_REBOUNDS;
      break;
    case 3:
      propName = config.POINTSBET.PLAYER_ASSISTS;
      break;
    case 4:
      propName = config.POINTSBET.PLAYER_PRA;
      break;
    default:
      throw new Error(`Invalid Market Type, should be 1 or 2 or 3, passed in ${marketType}`);
  }
  return propName;
}

async function pointsBetMarkets(matchName, marketType) {
  const matchData = await getMatchUrls(matchName);
  if (!matchData) return Promise.resolve([]);

  // check cache and if data is there, compute
  const cachedData = _cache.get(`${config.POINTSBET.CACHEKEY_MATCH}_${matchData.matchId}`);
  if (cachedData) {
    return Promise.resolve(extractPointsBetMarkets(marketType, matchData, cachedData));
  } // compute and return

  // make the api call, cache the data, compute and return
  return get(`${config.POINTSBET.EVENTS_URL}`.replace('{eventId}', matchData.matchId))
    .then(response => {
      // console.log(`points bet data is ${JSON.stringify(response.data)}`);
      return extractPointsBetMarkets(marketType, matchData, response.data);
    })
    .catch((error) => {
      console.log(`An error occured while fetching points bet markets... ${JSON.stringify(error)}`);
    });
}

function extractPointsBetMarkets(marketType, matchData, data) {
  try {
    if (data && data.fixedOddsMarkets && data.fixedOddsMarkets.length > 0) {
      const regex = getMarketName(marketType);
      const markets = data.fixedOddsMarkets
        .filter(item => regex.test(item.name));
      if (markets && markets.length > 0) {
        const playerMarkets = [];
        for (let index = 0; index < markets.length; index++) {
          const nameAndHandiCap = markets[index].outcomes[0].name.split(' Over ');
          const playerMarket = {
            playerName: nameAndHandiCap[0],
            handiCap: nameAndHandiCap[1],
            overPrice: markets[index].outcomes[0].price,
            underPrice: markets[index].outcomes[1].price
          };
          playerMarkets.push(playerMarket);
        }
        const cacheData = _cache.set(`${config.POINTSBET.CACHEKEY_MATCH}_${matchData.matchId}`, data);
        if (cacheData)
          console.log(`points bet data cached successfully`);
        return playerMarkets;
      }
      return [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

module.exports = {
  pointsBetMarkets,
}