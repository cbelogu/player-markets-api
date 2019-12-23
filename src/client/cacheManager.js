const NodeCache = require('node-cache');
const _cache = new NodeCache( { stdTTL: 5400, checkperiod: 300, deleteOnExpire: true });

module.exports = {
    cacheManager: _cache
}
