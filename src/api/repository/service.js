'use strict'

const LOGGER = require('../../libs/log4js');
const CONFIG = require('../../config/configuration.js');

const AXIOS = require('axios');
const HTTPS = require('https');
const QUERYSTRING = require('querystring');
const AGENT = new HTTPS.Agent({
  rejectUnauthorized: false,
});

let {
    repositoryDomain,
    repositoryApiKey,
    repositoryItemSourceEndpoint,
    repositoryItemThumbnailEndpoint,
    repositoryItemDataEndpoint,
    repositorySearchEndpoint,
    repositoryObjectEndpoint,
    repositoryCollectionEndpoint

} = CONFIG;

const COLLECTION_ID_FIELD = "is_member_of_collection";
const COLLECTION_TITLE_FIELD = "title";

exports.getItemData = async (id) => {
    let data = null, collectionData = {}, url, response;

    // fetch repo item data
    url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", id);
    try {
        LOGGER.module().info(`Fetching data for repository item: ${id}`);
        response = await AXIOS.get(url, {
            httpsAgent: AGENT,
        });

        data = response.data;
        data.link_to_item = `${repositoryDomain}/${repositoryObjectEndpoint}`.replace("{item_id}", id);
        data.collection_id = response.data[COLLECTION_ID_FIELD] || null;

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository item data. Axios response: ${error}`);
    }

    // fetch collection data
    url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", data.collection_id);
    try {
        LOGGER.module().info(`Fetching data for repository collection: ${data.collection_id}`);
        response = await AXIOS.get(url, {
            httpsAgent: AGENT,
        });

        collectionData = response.data;
        data.collection_name = collectionData[COLLECTION_TITLE_FIELD] || "";
        data.link_to_collection = `${repositoryDomain}/${repositoryCollectionEndpoint}`.replace("{collection_id}", data.collection_id || "null");
    } catch (error) {
        LOGGER.module().error(`Error retrieving repository collection data. Axios response: ${error}`);
    }

    return data;
}

exports.search = async (queryString) => {
    let results = null, url, response;
    
    url = `${repositoryDomain}/${repositorySearchEndpoint}?${queryString}`;
    try {
        LOGGER.module().info("Searching repository");
        response = await AXIOS.get(url, {
            httpsAgent: AGENT,
        });

        results = response.data;
    }
    catch(error) {
        LOGGER.module().error(`Error searching repository: ${error}`);
    }
    
    return results;
}

exports.storeSourceFile = async () => {

}