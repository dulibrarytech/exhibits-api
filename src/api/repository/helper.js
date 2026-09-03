'use strict'

const CONFIG = require('../../config/configuration.js');

const {
    repositoryDomain,
    repositoryItemThumbnailEndpoint,
    repositoryItemResourceEndpoint,

} = CONFIG;

exports.getRepositoryThumbnailUri = (repositoryItemId) => {
    return `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", repositoryItemId);
}

exports.getRepositoryResourceUri = (repositoryItemId) => {
    return `${repositoryDomain}/${repositoryItemResourceEndpoint}`.replace("{item_id}", repositoryItemId);
}