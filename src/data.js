const { getMatches, getPlayerMarket } = require('./sportsbet/processor.js');

function getAvailableMatches() {
    return getMatches()
        .then((data) => data)
        .catch((err) => console.log(err));
}

function getPlayerMarketsForEvent(eventId, eventName) {
    return getPlayerMarket(eventId, eventName)
        .then((data) => data)
        .catch((err) => console.log(err));
}

module.exports = {
    getAvailableMatches,
    getPlayerMarketsForEvent
}