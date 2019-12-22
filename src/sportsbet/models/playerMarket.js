class PlayerMarket {
    constructor(args, marketName) {
        this.id = args.id;
        this.playerName = args.name.slice(0, args.name.length - marketName.length).trim();
        this.sportsBetSelections = {
            playerName: this.playerName,
            handiCap: args.selections[0].unformattedHandicap,
            overPrice: args.selections[0].price.winPrice,
            underPrice: args.selections[1].price.winPrice
        };
    }
}

module.exports = {
    PlayerMarket
}