const got = require('got');

async function getEventId(eventName) {
  try {
    const ncid = + new Date();
    const url = `https://o1-api.aws.kambicdn.com/offering/v2018/ubau/listView/basketball/nba.json?lang=en_AU&market=AU&client_id=2&channel_id=1&ncid=${ncid}&useCombined=true`
    const response = await got(url);
    const { events } = (JSON.parse(response.body));
    if (events && events.length === 0) return null;

    const namesArray = eventName.split(' At ');
    const awayTeamName = namesArray[0];
    const homeTeamName = namesArray[1];

    const event = events.find(e => e.event.homeName === homeTeamName && e.event.awayName === awayTeamName);
    if (!event) return null;

    return event.event.id;
  } catch (error) {
    console.log(`UNIBET - Error getting eventid ${error}`);
    return Promise.resolve(null);
  }
}

function getMarketParams(marketType) {
  switch (marketType) {
    case 1:
      return 'Points scored by the player - Including Overtime';
    case 2:
      return 'Rebounds by the player - Including Overtime';
    case 3:
      return 'Assists by the player - Including Overtime';
    case 4:
      return 'Points, rebounds & assists by the player - Including Overtime';
    default:
      throw new Error(`marketType should be 1 or 2 or 3. Invalid value passed: ${marketType}`);
  }
}

async function getOffers(eventId, marketType) {
  try {
    const ncid = + new Date();
    const url = `https://o1-api.aws.kambicdn.com/offering/v2018/ubau/betoffer/event/${eventId}.json?lang=en_AU&market=AU&client_id=2&channel_id=1&ncid=${ncid}&includeParticipants=true`;
    const response = await got(url);
    const { betOffers } = JSON.parse(response.body);
    if (betOffers && betOffers.length === 0) return Promise.resolve([]);

    const marketParam = getMarketParams(marketType);
    const offers = betOffers.filter((betOffer) => betOffer.criterion.englishLabel === marketParam);
    if (offers.length === 0) return Promise.resolve([]);

    return offers;
  } catch (error) {
    console.log(`UNIBET - Error getting offers for ${eventId} and type ${marketType}: ${error}`);
    return Promise.resolve([]);
  }
}

function getOdds(offers) {
  try {
    const playerMarkets = offers.map(offer => {
      const { outcomes } = offer;
  
      if (outcomes.length !== 2) return;
      
      const participantNames = outcomes[0].participant.split(',');
      if (participantNames.length !== 2) return;
          
      return {
        playerName: participantNames[1].trim() + ' ' + participantNames[0].trim(),
        handiCap: outcomes[0].englishLabel.substring(5),
        overPrice: (outcomes[0].odds / 1000).toFixed(2),
        underPrice: (outcomes[1].odds / 1000).toFixed(2)
      }
    });
    return playerMarkets; 
  } catch (error) {
    console.log(`UNIBET - Error extracting odds ${error}`);
    return Promise.resolve([]);
  }
}

async function getPlayerMarkets(eventName, marketType) {
  const eventId = await getEventId(eventName);
  if (!eventId) return Promise.resolve([]);
  const offers = await getOffers(eventId, marketType);
  if (offers.length === 0) return Promise.resolve([]);
  const playerMarkets = getOdds(offers);
  return playerMarkets;
}

module.exports = { getPlayerMarkets };
