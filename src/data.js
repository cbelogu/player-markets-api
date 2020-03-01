const { get } = require('./client/httpClient');
const { getMatches, getSportsBetMarketUrlAndPropName } = require('./sportsbet/processor.js');
const { PlayerMarket } = require('./sportsbet/models/playerMarket');
const { getPlayerProps } = require('./beteasy/processor');
const { getPlayerMarkets } = require('./ladbrokes/processor');
const { pointsBetMarkets } = require('./pointsBet/processor');
const bet365 = require('./bet365/processor');
const _ = require('lodash');
const { closeBrowser } = require('./client/browser');
const _cache = require('./client/cacheManager').cacheManager;

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
    const responseArray = [];
    return get(sportsBetUrl)
        .then((response) => {
            responseArray.push(response);
            return getPlayerMarkets(eventName, marketType);
        })
        .then((response) => {
            responseArray.push(response);
            return getPlayerProps(eventName, marketType);
        })
        .then((response) => {
            responseArray.push(response);
            return bet365.getPlayerMarkets(eventName, marketType);
        })
        .then((response) => {
            responseArray.push(response);
            return pointsBetMarkets(eventName, marketType);
        })
        .then((response) => {
            responseArray.push(response);
            return responseArray;
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
            // process ladbrokes response
            const ladbrokesResponse = response[1];
            for (let index = 0; index < ladbrokesResponse.length; index++) {
                const prop = ladbrokesResponse[index];
                let finalProp = _.find(markets, (market) => market.playerName.toLowerCase() === prop.playerName.toLowerCase());
                if (finalProp) {
                    finalProp.ladbrokesSelections = prop;
                }
            }

            // process bet easy response
            const betEasyProps = response[2];
            for (let index = 0; index < betEasyProps.length; index++) {
                const prop = betEasyProps[index];
                let finalProp = _.find(markets, (market) => market.playerName.toLowerCase() === prop.playerName.toLowerCase());
                if (finalProp) {
                    finalProp.betEasySelections = prop;
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

            // process pointsbet response
            const pointsBetResponse = response[4];
            for (let index = 0; index < pointsBetResponse.length; index++) {
                const prop = pointsBetResponse[index];
                let finalProp = _.find(markets, (market) => market.playerName.toLowerCase() === prop.playerName.toLowerCase());
                if (finalProp) {
                    finalProp.pointsBetSelections = prop;
                }
            }
            
            calculateValueProps(markets, marketType);
            // return final markets
            return markets;
        })
        .catch()
        .finally(() => {
            console.log('closing browser...');
            closeBrowser();
        });
}

function calculateValueProps(markets, marketType) {
    const gapValue = (marketType === 1 || marketType === 4) ? 1 : 0;
    try {
        if (markets && markets.length > 0) {
            for (let index = 0; index < markets.length; index++) {
                const market = markets[index];
                const handiCaps = [
                    market.sportsBetSelections ? Number(market.sportsBetSelections.handiCap) : 0,
                    market.betEasySelections ? Number(market.betEasySelections.handiCap) : 0,
                    market.ladbrokesSelections ? Number(market.ladbrokesSelections.handiCap) : 0,
                    market.bet365Selections ? Number(market.bet365Selections.handiCap) : 0,
                    market.pointsBetSelections ? Number(market.pointsBetSelections.handiCap) : 0,
                ];
                const unique = [... new Set(handiCaps.filter(n => n > 0).sort((a, b) => a - b))];
                console.log(`sorted unique handicaps.... ${unique}`);
                if (unique.length > 1 && ((unique[unique.length - 1] - unique[0]) > gapValue)) {
                    console.log(`setting value prop to true for ${market.playerName}`);
                    market.valueProp = true;
                    if ((unique[unique.length - 1] - unique[0]) > gapValue + 1) {
                        market.gapHuntersDream = true;
                    }
                }
            }
        }
    } catch (error) {
        return markets;
    }
}
async function cacheBet365Markets() {
    try {
        await bet365.getPlayerMarkets('na', 1);
        await bet365.getPlayerMarkets('na', 2);
        await bet365.getPlayerMarkets('na', 3);
        await closeBrowser();
    } catch (error) {
        console.log(error);
    }
    return Promise.resolve();
}

function flushCache() {
    try {
        console.log(`Before flush ... ${JSON.stringify(_cache.getStats())}`);
        _cache.flushAll();
        console.log(`After flush ... ${JSON.stringify(_cache.getStats())}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    getAvailableMatches,
    getPlayerMarketsForEvent,
    cacheBet365Markets,
    flushCache
}