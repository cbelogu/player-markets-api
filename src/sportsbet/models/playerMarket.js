class PlayerMarket {
    constructor(args, marketName) {
        this.id = args.id;
        this.playerName = args.name.slice(0, args.name.length - marketName.length).trim();
        this.valueProp = false;
        this.sportsBetSelections = {
            playerName: this.playerName,
            handiCap: args.selections[0].unformattedHandicap,
            overPrice: Number(args.selections[0].price.winPrice).toFixed(2),
            underPrice: Number(args.selections[1].price.winPrice).toFixed(2)
        };
    }
}

module.exports = {
    PlayerMarket
}