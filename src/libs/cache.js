const CacheBase = require('cache-base');

exports.create = () => {
   return new CacheBase();
};