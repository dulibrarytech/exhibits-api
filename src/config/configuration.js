module.exports = {
    nodeEnv: process.env.NODE_ENV,
    appPort: process.env.PORT,
    elasticDomain: process.env.ELASTIC_DOMAIN,
    elasticIndex: process.env.ELASTIC_INDEX,
    repositoryDomain: process.env.REPOSITORY_DOMAIN,
    repositoryApiKey: process.env.REPOSITORY_API_KEY,
    repositoryItemSourceEndpoint: process.env.REPOSITORY_ITEM_SOURCE_ENDPOINT,
    repositoryItemThumbnailEndpoint: process.env.REPOSITORY_ITEM_THUMBNAIL_ENDPOINT,
    repositoryItemDataEndpoint: process.env.REPOSITORY_ITEM_DATA_ENDPOINT,
    repositorySearchEndpoint: process.env.REPOSITORY_SEARCH_ENDPOINT,
    repositoryObjectEndpoint: process.env.REPOSITORY_OBJECT_ENDPOINT,
    repositoryCollectionEndpoint: process.env.REPOSITORY_COLLECTION_ENDPOINT,
    resourceLocation: process.env.RESOURCE_LOCATION
}