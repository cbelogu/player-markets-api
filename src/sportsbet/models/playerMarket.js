const { pick } = require('lodash');

class PlayerMarket {
    constructor(args) {
        // Object.assign(this, pick(args,
        //     'id',
        //     'name'
        // ));
        this.id = args.id;
        this.playerName = args.name.slice(0, args.name.length - 9);
        this.sportsBetSelections = {
            playerName: this.playerName,
            handiCap: args.selections[0].unformattedHandicap,
            overPrice: args.selections[0].price.winPrice,
            underPrice: args.selections[1].price.winPrice
        };

        
        // this.handiCap = args.selections[0].unformattedHandicap;
        // this.overPrice = args.selections[0].price.winPrice;
        // this.underPrice = args.selections[1].price.winPrice;
        // this.sportsbetSelections = [];
        // this.sportsbetSelections.push(
        //     this.extractPlayerOffer(args.selections[0]),
        //     this.extractPlayerOffer(args.selections[1]));
    }

    // extractPlayerOffer(args) {
    //     return Object.assign({}, pick(args, 'id', 'name', 'unformattedHandicap', 'price.winPrice'));
    // }
}

module.exports = {
    PlayerMarket
}