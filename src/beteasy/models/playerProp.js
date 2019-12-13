
class PlayerProp {
    constructor(args) {
        this.playerName = args.EventName.replace(' Points Over/Under', '');
        this.handiCap = args.Outcomes[0].OutcomeName.replace(this.playerName + ' Over ', '').trim();
        this.overPrice = args.Outcomes[0].BetTypes[0].Price;
        this.underPrice = args.Outcomes[1].BetTypes[0].Price;
    }
}

module.exports = {
    PlayerProp
}