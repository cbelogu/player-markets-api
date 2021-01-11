const got = require('got');
const { reject } = require('lodash');

async function getMatchId(matchName) {
  try {
    const url = `https://fixture-03.palmerbet.online/fixtures/sports/1c2eeb3a-6bab-4ac2-b434-165cc350180f/matches?sportType=basketball&pageSize=25&channel=website`;
    const response = await got(url);
    const { matches } = JSON.parse(response.body)
    if (matches.length === 0) return Promise.resolve(null);

    const namesArray = matchName.split(' At ');
    const awayTeamName = namesArray[0];
    const homeTeamName = namesArray[1];

    const match = matches.find((match) => match.homeTeam.title === homeTeamName && match.awayTeam.title === awayTeamName);
    if (match) return Promise.resolve(match.eventId);
    return Promise.resolve(null);
  } catch (error) {
    console.log(`PALMER - Error getting eventid ${error}`);
    return Promise.resolve(null);
  }
}

function getMarketParams(marketType) {
  switch (marketType) {
      case 1:
          return ' - Points -';
      case 2:
          return ' - Rebounds -';
      case 3:
          return ' - Assists -';
      case 4:
          return ' - Pts + Reb + Ast -';
      default:
          throw new Error(`marketType should be 1 or 2 or 3. Invalid value passed: ${marketType}`);
  }
}

async function getOffers(eventId, marketType) {
  try {
    const url = `https://fixture-03.palmerbet.online/fixtures/sports/matches/${eventId}/markets?sportType=basketball&pageSize=1000&channel=website`;
    const response = await got(url);
    const { markets } = JSON.parse(response.body)
    if (markets.length === 0) return Promise.resolve([]);
  
    const marketName = getMarketParams(marketType);
    const offers = markets.filter((market) => market.tags.length === 0 && market.title.includes(marketName));
    return offers;
  } catch (error) {
    console.log(`PALMER - Error getting offers ${error}`);
    return Promise.resolve([]);
  }
}

async function getOdds(offers, marketType) {
  try {
    const marketName = getMarketParams(marketType);
    const response = await Promise.all(offers.map(offer => {
      return new Promise(async (resolve, reject) => {
        const url = `https://fixture-03.palmerbet.online/fixtures/sports/markets/${offer.id}?sportType=basketball&channel=website`;
        const result = await got(url);
        const { market } = JSON.parse(result.body);
        const info = market.title.split(marketName);
        const isOverFirst = market.outcomes[0].title.includes('Over');
        const overOutcome = isOverFirst ? market.outcomes[0] : market.outcomes[1];
        const underOutcome = isOverFirst ? market.outcomes[1] : market.outcomes[0];
        return resolve({
          playerName: info[0],
          handiCap: info[1],
          overPrice: overOutcome.prices[0].priceSnapshot.current,
          underPrice: underOutcome.prices[0].priceSnapshot.current
        })
      });
    }));
    return response;
  } catch (error) {
    console.log(`PALMER - Error extracting odds ${error}`);
    return Promise.resolve([]);
  }
}

async function getPlayerMarkets(eventName, marketType) {
  const eventId = await getMatchId(eventName);
  if (!eventId) return Promise.resolve([]);
  const offers = await getOffers(eventId, marketType);
  if (offers.length === 0) return Promise.resolve([]);
  const playerMarkets = await getOdds(offers, marketType);
  return playerMarkets;
}

module.exports = { getPlayerMarkets };
