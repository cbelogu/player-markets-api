const { get, all } = require('./client/httpClient');
const { getMatches, getSportsBetMarketUrlAndPropName } = require('./sportsbet/processor.js');
const { PlayerMarket } = require('./sportsbet/models/playerMarket');
const { getPlayerProps } = require('./beteasy/processor');
const { getPlayerMarkets } = require('./ladbrokes/processor');
const bet365 = require('./bet365/processor');
const _ = require('lodash');

function getAvailableMatches() {
    return getMatches()
        .then((data) => data)
        .catch((err) => console.log(err));
}

function getPlayerMarketsForEvent(eventId, eventName, marketType) {
    return getPlayerMarket(eventId, eventName, marketType)
        .then((data) => data)
        .catch((err) => console.log(err));
}

function getPlayerMarket(eventId, eventName, marketType) {
    // MarketType 1 = Player Points; 2 = Rebounds; 3 = Assists
    const { sportsBetUrl, marketName } = getSportsBetMarketUrlAndPropName(eventId, marketType);
    console.log(`sports bet markets url is : ${sportsBetUrl}`);
    const requestPool = [
      get(sportsBetUrl), // sportsbet API
      getPlayerProps(eventName, marketType), // bet easy API
      getPlayerMarkets(eventName, marketType) // ladbrokes BROWSER
    ];
    return all(requestPool)
      .then((response) => {
        return bet365.getPlayerMarkets(eventName, marketType)
          .then((data) => {
            response.push(data);
            return response;
          })
      })
      .then((response) => {
        const markets = [];
  
        // process sports bet response
        if (response[0].data && response[0].data.length > 0) {
          for (let index = 0; index < response[0].data.length; index++) {
            const event = response[0].data[index];
            if (event.name.endsWith(marketName)) {
              markets.push(new PlayerMarket(event, marketName));
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
        const bet365PlayersCount = (bet365Response && bet365Response.players) ? bet365Response.players.length : 0;
        for (let index = 0; index < bet365PlayersCount; index++) {
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
    getAvailableMatches,
    getPlayerMarketsForEvent
}