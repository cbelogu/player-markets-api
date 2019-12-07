const { pick } = require('lodash');

class NbaMatch {
  constructor(args) {
    Object.assign(this, pick(args,
      'id',
      'name',
      'startTime',
      'bettingStatus'));
    this.startTimeLocal = new Date(args.startTime * 1000).toLocaleString();
    this.displayName = `${this.name} - ${this.startTimeLocal}`
  }
}

module.exports = {
  NbaMatch
}
