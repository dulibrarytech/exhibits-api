'use strict'

const LOGGER = require('../../libs/log4js');
const CONFIG = require('../../config/configuration.js');

const FS = require('fs');
const HTTPS = require('https');
const AXIOS = require('axios');
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
    repositoryCollectionEndpoint,
    resourceLocation

} = CONFIG;

const ITEM_ID_FIELD = "pid";
const COLLECTION_ID_FIELD = "is_member_of_collection";
const COLLECTION_TITLE_FIELD = "title";

exports.getItemData = async (itemId) => {
    let data = null, collectionData = {}, url, response;

    // fetch repo item data
    url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", itemId);
    try {
        LOGGER.module().info(`Fetching data for repository item: ${itemId}`);
        response = await AXIOS.get(url, {
            httpsAgent: AGENT,
        });

        data = response.data;
        data.link_to_item = `${repositoryDomain}/${repositoryObjectEndpoint}`.replace("{item_id}", itemId);
        data.thumbnail_datastream = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", itemId);
        data.collection_id = response.data[COLLECTION_ID_FIELD] || null;
    } catch (error) {
        LOGGER.module().error(`Error retrieving repository item data. Axios response: ${error}`);
    }

    // fetch parent collection data
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
        results.forEach((result) => {
            result.thumbnail_datastream = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", result[ITEM_ID_FIELD]);
        });
    }
    catch(error) {
        LOGGER.module().error(`Error searching repository: ${error}`);
    }
    
    return results;
}

exports.storeSourceFile = async (itemId, fileName, filePath) => {
    let status = true;
    let fileExists = false;
    let file = `./${resourceLocation}/${filePath}/${fileName}`;

    LOGGER.module().info(`Verifying repository source file ${fileName}...`);

    try {
        fileExists = FS.existsSync(file);
    }
    catch(error) {
        LOGGER.module().error(`Error verifying file in local storage: ${error} Storage location: ${file}`);
        status = false;
    }

    if(fileExists == false) {
        try {
            let url = `${repositoryDomain}/${repositoryItemSourceEndpoint}`.replace("{item_id}", itemId);
            LOGGER.module().info(`File is not present in local storage. Fetching file from repository: datastream url: ${url}...`);

            let writeStream = FS.createWriteStream(file);
            writeStream.on('error', (error) => {
                LOGGER.module().error(`Error storing source file: ${error}`);
            });

            let response = await AXIOS.get(url, {
                httpsAgent: AGENT,
                responseType: 'stream'
            });

            LOGGER.module().info("Fetch successful. Writing file...");
            response.data.pipe(writeStream);
            LOGGER.module().info("File written.");
        }
        catch(error) {
            LOGGER.module().error(`Error storing source file: ${error}`);
            status = false;
        }
    }
    else {
        LOGGER.module().info("Repository source file found. File:", file);
    }

    return status;
}