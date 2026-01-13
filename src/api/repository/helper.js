'use strict'

const CONFIG = require('../../config/configuration.js');

const {
    repositoryDomain,
    repositoryItemThumbnailEndpoint,

} = CONFIG;

exports.getRepositoryThumbnailUri = (repositoryItemId) => {
    return `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", repositoryItemId);
}