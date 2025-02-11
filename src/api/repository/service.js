'use strict'

const LOGGER = require('../../libs/log4js');
const CONFIG = require('../../config/configuration.js');
const ELASTIC = require('../../libs/elastic_search');
const FS = require('fs');
const HTTPS = require('https');
const AXIOS = require('axios');
const AGENT = new HTTPS.Agent({
  rejectUnauthorized: false,
});

let {
    repositoryDomain,
    repositoryApiKey,
    repositoryItemDatastreamEndpoint,
    repositoryItemThumbnailEndpoint,
    repositoryItemDataEndpoint,
    repositorySearchEndpoint,
    repositoryObjectEndpoint,
    repositoryCollectionEndpoint,
    resourceLocation

} = CONFIG;

// TODO: add all directly to cfg?
const ITEM_ID_FIELD = "pid";
const COLLECTION_ID_FIELD = "is_member_of_collection";
const COLLECTION_TITLE_FIELD = "title";

/**
 * 
 * @param {*} itemId 
 * @returns 
 */
exports.getItemData = async (itemId) => {
    let data = null, 
        collectionData = {}, 
        url, 
        response;

    // fetch repository item data
    try {
        LOGGER.module().info(`Fetching data for repository item: ${itemId}`);
        url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", itemId);
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
    try {
        LOGGER.module().info(`Fetching data for repository collection: ${data.collection_id}`);
        url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", data.collection_id);
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

/**
 * 
 * @param {*} queryString 
 * @returns 
 */
exports.search = async (queryString) => {
    let results = null, url, response;
    
    try {
        LOGGER.module().info(`Searching repository: query: ${queryString}`);
        url = `${repositoryDomain}/${repositorySearchEndpoint}?${queryString}`;
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

/**
 * 
 * @param {*} repositoryItemId 
 * @param {*} exhibitItemId 
 * @param {*} fileExtension 
 * @returns 
 */
exports.fetchSourceFile = async (repositoryItemId="null", exhibitItemId=null, fileExtension=null, datastreamId=null) => {
    let fileName = "";
    let status = false;
    let fileExists = false;
    let file = "";
    let filePath = "";

    LOGGER.module().info(`Fetching source file for repository item: ${repositoryItemId}...`);

    try {
        // validate the exhibit item id, and extract the exhibit id for the file path
        let exhibitItem = await ELASTIC.fieldSearch("uuid", exhibitItemId, "items");
        let exhibitId = exhibitItem.is_member_of_exhibit || null;
        if(exhibitId == null) throw `Exhibit item not found: ID: ${exhibitItemId}`;
        if(datastreamId == null) datastreamId = fileExtension || "";

        // build the source file url for the repository item in local storage
        fileName = `${exhibitItemId}_repository_item_${datastreamId}.${fileExtension}`;
        filePath = exhibitId;
        file = `./${resourceLocation}/${filePath}/${fileName}`;

        // verify the local resource file
        LOGGER.module().info(`Verifying source file in local storage: ${fileName}...`);
        fileExists = FS.existsSync(file);
    }
    catch(error) {
        LOGGER.module().error(`Error verifying file in local storage: ${error} Storage location: ${file}`);
        return {filename: "", status: false};
    }

    // if the file does not exist, fetch it from the repository
    if(fileExists == false) {
        try {
            // get the url for the repository source datastream
            let url = `${repositoryDomain}/${repositoryItemDatastreamEndpoint}`
                .replace("{item_id}", repositoryItemId) 
                .replace("{datastream_id}", datastreamId);

            LOGGER.module().info(`File is not present in local storage. Fetching file for exhibit from repository. datastream url: ${url}...`);

            // create the local resource file
            let writeStream = FS.createWriteStream(file);
            writeStream.on('error', (error) => {
                LOGGER.module().error(`Error storing source file: ${error}`);
            });

            writeStream.on('finish', () => {
                console.log(`File written: ${fileName}`);
            });

            // fetch and stream the file to local storage
            let response = await AXIOS.get(url, {
                httpsAgent: AGENT,
                responseType: 'stream'
            });
            LOGGER.module().info("Fetch successful. Writing file...", fileName);
            response.data.pipe(writeStream);
            
            status = true;
        }
        catch(error) {
            LOGGER.module().error(`Error storing source file: ${error}`);
        }
    }
    else {
        LOGGER.module().info("Repository source file found. File:", fileName);
        status = true;
    }

    return {fileName, status}
}