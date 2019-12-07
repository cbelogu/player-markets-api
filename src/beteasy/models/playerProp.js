const { pick } = require('lodash');

class PlayerProp {
    constructor(args) {
        Object.assign(this, pick(args,
            'EventName'
        ));
        this.playerName = this.EventName.replace(' Points Over/Under', '');
        this.selections = [];
        this.selections.push(
            this.extractPlayerOffer(args.Outcomes[0], this.playerName),
            this.extractPlayerOffer(args.Outcomes[1], this.playerName),
        )
    }

    extractPlayerOffer(args, playerName) {
        const marketName = args.OutcomeName.replace(playerName, '').trim();
        return Object.assign({}, { marketName }, pick(args, 'OutcomeName', 'BetTypes[0].Price'));
    }
}

module.exports ={
    PlayerProp
}