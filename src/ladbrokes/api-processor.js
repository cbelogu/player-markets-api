const got = require('got');
const _ = require('lodash');

async function getMatches() {
  const url = `https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=["3c34d075-dc14-436d-bfc4-9272a49c2b39"]&competition_id=2d20a25b-6b96-4651-a523-442834136e2d`;
  const encodedUri = encodeURI(url).replace(/["]/g, '%22');
  try {
    const response = await got(encodedUri);
    const data = JSON.parse(response.body);
    if (data && data.events) {
      const events = [];
      Object.keys(data.events).forEach(key => {
        events.push(_.pick(data.events[key], ['id', 'name']))
      });
      return events;
    }
    return Promise.resolve([]);
  } catch (error) {
    console.log(error);
    return Promise.resolve([]);
  }
}

async function getEventCard(eventId) {
  const url = `https://api.ladbrokes.com.au/v2/sport/event-card?id=${eventId}`;
  try {
    const response = await got(url);
    const data = JSON.parse(response.body);
    return data;
  } catch (error) {
    console.log(error);
    return Promise.resolve([]);
  }
}

function getMarketParams(marketType) {
  switch (marketType) {
      case 1:
          return { name: 'player point markets', propName: 'Player Points O/U', type: 'Points' };
      case 2:
          return { name: 'player rebounds markets', propName: 'Player Rebounds O/U', type: 'Rebounds' };
      case 3:
          return { name: 'player assists markets', propName: 'Player Assists O/U', type: 'Assists' };
      case 4:
          return { name: 'player performance markets', propName: 'Player Points, Rebounds & Assists O/U', type: 'PRA' };
      default:
          throw new Error(`marketType should be 1 or 2 or 3. Invalid value passed: ${marketType}`);
  }
}

async function getPlayerMarkets(eventName, marketType) {
  const matches = await getMatches();
  if (matches.length === 0) return Promise.resolve([]);

  const namesArray = eventName.split(' At ');
  const formattedName = String(namesArray[1] + ' vs ' + namesArray[0]);

  const event = matches.find(m => m.name === formattedName);
  if (!event) return Promise.resolve([]);

  const eventCard = await getEventCard(event.id);
  const marketGroupingName = getMarketParams(marketType);

  // markets
  const markets = [];
  Object.keys(eventCard.markets).forEach((key) => {
    if (eventCard.markets[key].name.includes(marketGroupingName.propName)) {
      markets.push(eventCard.markets[key]);
    }
  });

  if (markets.length === 0) return Promise.resolve([]);

  // get the entrants and prices and form the object
  const offers = [];
  markets.forEach((market) => {
    const entrant1 = eventCard.entrants[market.entrant_ids[0]];
    const isOverMarket = entrant1.name.includes('Over');
    const delimiter = isOverMarket ? 'Over' : 'Under';
    const overEntrantId = isOverMarket ? market.entrant_ids[0] : market.entrant_ids[1];
    const underEntrantId = isOverMarket ? market.entrant_ids[1] : market.entrant_ids[0];
    
    const playerName = entrant1.name.split(delimiter)[0].trim();
    const handiCap = entrant1.name.split(delimiter)[1].trim().replace(` ${marketGroupingName.type}`, '').trim();
    const overOdds = eventCard.prices[Object.keys(eventCard.prices).filter(key => key.startsWith(overEntrantId))].odds;
    const underOddss = eventCard.prices[Object.keys(eventCard.prices).filter(key => key.startsWith(underEntrantId))].odds;
    
    offers.push({
      playerName,
      handiCap,
      overPrice: (1 + overOdds.numerator / overOdds.denominator).toFixed(2),
      underPrice: (1 + underOddss.numerator / underOddss.denominator).toFixed(2)
    });
  });
  return offers;
}

module.exports = { getPlayerMarkets };
