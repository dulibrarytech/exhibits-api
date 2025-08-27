module.exports = {
    nodeEnv: process.env.NODE_ENV,
    appPort: process.env.PORT,
    apiKey: process.env.EXHIBITS_API_KEY,
    elasticDomain: process.env.ELASTIC_DOMAIN,
    elasticIndex: process.env.ELASTIC_INDEX,
    repositoryDomain: process.env.REPOSITORY_DOMAIN,
    repositoryApiKey: process.env.REPOSITORY_API_KEY,
    repositoryItemResourceEndpoint: process.env.REPOSITORY_ITEM_RESOURCE_ENDPOINT,
    repositoryItemThumbnailEndpoint: process.env.REPOSITORY_ITEM_THUMBNAIL_ENDPOINT,
    repositoryItemDataEndpoint: process.env.REPOSITORY_ITEM_DATA_ENDPOINT,
    repositorySearchEndpoint: process.env.REPOSITORY_SEARCH_ENDPOINT,
    repositoryObjectEndpoint: process.env.REPOSITORY_OBJECT_ENDPOINT,
    repositoryCollectionEndpoint: process.env.REPOSITORY_COLLECTION_ENDPOINT,
    resourceLocalStorageLocation: process.env.RESOURCE_LOCATION
}