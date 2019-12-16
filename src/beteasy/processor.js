const { get } = require('../client/httpClient');
const { config } = require('../config');
const _ = require('lodash');
const PlayerProp = require('./models/playerProp').PlayerProp;
const _cache = require('../client/cacheManager').cacheManager;
const betEasyMatchesUrlKey = 'betEasyMatchesUrlKey';
const betEasyEventCacheKey = 'betEasy_EventID_';

function getEventIdFromName(matchName) {
    const cachedResponse = _cache.get(betEasyMatchesUrlKey);
    if (cachedResponse) {
        console.log('betEasyMatchesUrls RETRIEVING FROM CACHE');
        return Promise.resolve(retrieveEventId(cachedResponse, matchName));
    }
    return get(config.BETEASY_NBA_MATCHES_URL)
        .then((response) => {
            // storing in cache
            console.log(`OUTPUTTING BET EASY RESP ${JSON.stringify(response.data)}`);
            const success = _cache.set(betEasyMatchesUrlKey, { data: response.data });
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

function retrievePlayerProps(response) {
    if (response.data && response.data.result
        && response.data.result['18']
        && response.data.result['18'].BettingType
        && response.data.result['18'].BettingType.length > 0) {
        const propName = ' Points Over/Under';
        const markets = [];
        for (let index = 0; index < response.data.result['18'].BettingType.length; index++) {
            const element = response.data.result['18'].BettingType[index];
            if (element.EventName.endsWith(propName)) {
                markets.push(new PlayerProp(element));
            }
        }
        return markets;
    }
    return [];
}

function getPlayerProps(matchName) {
    return getEventIdFromName(matchName)
        .then((response) => {
            if (response === 0) {
                return Promise.resolve([]);
            } else {
                const cacheKey = `${betEasyEventCacheKey}${response}`;
                const cachedData = _cache.get(cacheKey);
                if (cachedData) {
                    console.log('BETEASY Match Data serving from cache');
                    return Promise.resolve(retrievePlayerProps(cachedData));
                }
                const uri = config.BETEASY_PLAYERPROP_URL.replace('{eventId}', response);
                return get(uri)
                    .then((response) => {
                        console.log('BET EASY MATCH DATA CACHING');
                        const cacheSuccess = _cache.set(cacheKey, { data: response.data });
                        if (cacheSuccess) console.log('BET EASY MATCH DATA CACHED SUCCESSFULLY key - ' + cacheKey);
                        return Promise.resolve(retrievePlayerProps(response));
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