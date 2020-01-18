const { get } = require('../client/httpClient');
const { config } = require('../config');
const _ = require('lodash');
const PlayerProp = require('./models/playerProp').PlayerProp;
const _cache = require('../client/cacheManager').cacheManager;

let _betEasyEventCacheKey = '';

function getEventIdFromName(matchName) {
    const cachedResponse = _cache.get(config.BETEASY.CACHEKEY_NBA_MATCHES_URL);
    if (cachedResponse) {
        console.log('betEasyMatchesUrls RETRIEVING FROM CACHE');
        return Promise.resolve(retrieveEventId(cachedResponse, matchName));
    }
    return get(config.BETEASY.NBA_MATCHES_URL)
        .then((response) => {
            // storing in cache
            console.log(`OUTPUTTING BET EASY RESP ${JSON.stringify(response.data)}`);
            const success = _cache.set(config.BETEASY.CACHEKEY_NBA_MATCHES_URL, { data: response.data });
            if (success) console.log('betEasyMatchesUrls saved successfully');
            return retrieveEventId(response, matchName);
        })
        .catch()
        .finally();
}

function retrieveEventId(response, matchName) {
    if (response.data && response.data.result && response.data.result.events && response.data.result.events.length > 0) {
        const expectedMatchName = matchName.replace(' At ', ' @ ');
        const match = _.find(response.data.result.events, (item) => item.name.toLowerCase() === expectedMatchName.toLowerCase());
        return match ? match.masterEventId : 0;
    }
    return new Error(`There are no events matching ${matchName} at the moment, please check back later`);
}

function retrievePlayerProps(response, marketType) {
    const propName = getMarketName(marketType);
    if (response.data && response.data.result
        && response.data.result['18']
        && response.data.result['18'].BettingType
        && response.data.result['18'].BettingType.length > 0) {
        const markets = [];
        for (let index = 0; index < response.data.result['18'].BettingType.length; index++) {
            const element = response.data.result['18'].BettingType[index];
            if (element.EventName.endsWith(propName)) {
                markets.push(new PlayerProp(element, propName));
            }
        }
        console.log('Bet easy response will be: ' + JSON.stringify(markets));
        return markets;
    }
    return [];
}

function getMarketName(marketType) {
    let propName = 0;
    switch (marketType) {
        case 1:
            propName = config.BETEASY.PLAYER_POINTS;
            break;
        case 2:
            propName = config.BETEASY.PLAYER_REBOUNDS;
            break;
        case 3:
            propName = config.BETEASY.PLAYER_ASSISTS;
            break;
        default:
            throw new Error(`Invalid Market Type, should be 1 or 2 or 3, passed in ${marketType}`);
    }
    return propName;
}

function getPlayerProps(matchName, marketType) {
    return getEventIdFromName(matchName)
        .then((response) => {
            if (response === 0) {
                return Promise.resolve([]);
            } else {
                _betEasyEventCacheKey = `${config.BETEASY.CACHEKEY_EVENT}${response}`; // response is event id
                const cachedData = _cache.get(_betEasyEventCacheKey);
                if (cachedData) {
                    console.log('BETEASY Match Data serving from cache');
                    return Promise.resolve(retrievePlayerProps(cachedData, marketType));
                }
                const uri = config.BETEASY.PLAYERPROP_URL.replace('{eventId}', response);
                console.log(`beteasy event prop url is : ${uri}`);
                return get(uri)
                    .then((response) => {
                        console.log('BET EASY MATCH DATA CACHING');
                        const cacheSuccess = _cache.set(_betEasyEventCacheKey, { data: response.data });
                        if (cacheSuccess) console.log('BET EASY MATCH DATA CACHED SUCCESSFULLY key - ' + _betEasyEventCacheKey);
                        return Promise.resolve(retrievePlayerProps(response, marketType));
                    })
                    .catch()
                    .finally();
            }
        })
        .catch((err) => {
            console.log(err);
        })
        .finally();
}

module.exports = {
    getPlayerProps
}