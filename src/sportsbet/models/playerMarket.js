const { pick } = require('lodash');

class PlayerMarket {
    constructor(args) {
        Object.assign(this, pick(args,
            'id',
            'name'
        ));

        this.playerName = this.name.slice(0, this.name.length - 9);
        this.sportsbetSelections = [];
        this.sportsbetSelections.push(
            this.extractPlayerOffer(args.selections[0]),
            this.extractPlayerOffer(args.selections[1]));
    }

    extractPlayerOffer(args) {
        return Object.assign({}, pick(args, 'id', 'name', 'unformattedHandicap', 'price.winPrice'));
    }
}

module.exports = {
    PlayerMarket
}