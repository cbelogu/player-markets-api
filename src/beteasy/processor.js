const { get } = require('../client/httpClient');
const { config } = require('../config');
const _ = require('lodash');
const PlayerProp = require('./models/playerProp').PlayerProp;

function getEventIdFromName(matchName) {
    return get(config.BETEASY_NBA_MATCHES_URL)
        .then((response) => {
            if (response.data && response.data.result && response.data.result.events && response.data.result.events.length > 0) {
                const expectedMatchName = matchName.replace(' At ', ' @ ');
                const match = _.find(response.data.result.events, (item) => item.name.toLowerCase() === expectedMatchName.toLowerCase());
                if (match) {
                    return match.masterEventId;
                } else {
                    return 0;
                }
            } else {
                return new Error(`There are no events matching ${matchName} at the moment, please check back later`);
            }
        })
        .catch()
        .finally();
}

function getPlayerProps(matchName) {
    return getEventIdFromName(matchName)
        .then((response) => {
            if (response === 0) {
                return new Promise.resolve([]);
            } else {
                const uri = config.BETEASY_PLAYERPROP_URL.replace('{eventId}', response);
                return get(uri)
                    .then((response) => {
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
                        } else {
                            return [];
                        }
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