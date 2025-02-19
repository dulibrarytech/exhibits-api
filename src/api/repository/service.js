'use strict'

const LOGGER = require('../../libs/log4js');
const ELASTIC = require('../../libs/elastic_search');
const FS = require('fs');
const HTTPS = require('https');
const AXIOS = require('axios');
const AGENT = new HTTPS.Agent({
  rejectUnauthorized: false,
});

const CONFIG = require('../../config/configuration.js');

let {
    repositoryDomain,
    repositoryApiKey,
    repositoryObjectEndpoint,
    repositoryCollectionEndpoint,
    repositoryItemResourceEndpoint,
    repositoryItemThumbnailEndpoint,
    repositoryItemDataEndpoint,
    repositorySearchEndpoint,
    resourceLocation

} = CONFIG;

/**
 * 
 * @param {*} itemId 
 * @returns 
 */
exports.getItemData = async (itemId) => {
    let itemData = {};
    let collectionData = {};

    // fetch repository item data
    try {
        LOGGER.module().info(`Fetching data for repository item: ${itemId}`);

        let url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", itemId);
        let {data} = await AXIOS.get(url, {
            httpsAgent: AGENT,
        });
        itemData = data;

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository item data. Axios error: ${error}`);
    }

    // set object data fields
    let title = itemData["title"] || "untitled item";
    let collection_id = itemData["is_member_of_collection"] || null;
    let mime_type = itemData.mime_type;

    let local_identifier = itemData.display_record.identifiers.find((identifier) => {
        return identifier.type == 'local';  
    })?.identifier || "no identifier";

    let subject = itemData.display_record.subjects.find((subject) => {
        return subject.authority == 'local';
    })?.title || "no subject";

    // fetch parent collection data
    try {
        LOGGER.module().info(`Fetching data for repository collection: ${collection_id}`);

        let url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", collection_id);
        let {data} = await AXIOS.get(url, {
            httpsAgent: AGENT,
        });
        collectionData = data;

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository collection data. Axios response: ${error}`);
    }

    // set collection data fields
    let collection_name = collectionData["title"] || "untitled collection";

    // set link fields
    let link_to_item = `${repositoryDomain}/${repositoryObjectEndpoint}`.replace("{item_id}", itemId);
    let link_to_collection = `${repositoryDomain}/${repositoryCollectionEndpoint}`.replace("{collection_id}", collection_id || "null");
    let thumbnail_datastream = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", itemId);

    return {title, collection_id, mime_type, local_identifier, subject, collection_name, link_to_item, link_to_collection, thumbnail_datastream}
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
            result.link_to_item = `${repositoryDomain}/${repositoryObjectEndpoint}`.replace("{item_id}", result["pid"]);
            result.thumbnail_datastream = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", result["pid"]);
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
exports.verifyResourceFile = async (repositoryItemId="null", exhibitItemId=null, fileExtension=null) => {
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

        // build the source file url for the repository item in local storage
        fileName = `${exhibitItemId}_repository_item_source.${fileExtension}`;
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

        // get the url for the repository source datastream
        let url = `${repositoryDomain}/${repositoryItemResourceEndpoint}`
            .replace("{item_id}", repositoryItemId) 

        LOGGER.module().info(`File is not present in local storage. Fetching file for exhibit from repository. Exhibit item source file: ${fileName}`);

        // fetch the datastream from the repository and write the file
        let status = await fetchFile(url, file);

        return {fileName, status};
    }
    else {
        LOGGER.module().info("Repository source file found. File:", fileName);
        status = true;
    }

    return {fileName, status}
}

const fetchFile = (url, file) => {
    return new Promise(function(resolve, reject) {
        LOGGER.module().info(`Fetching file from url ${url}...`);

        AXIOS.get(url, {
            httpsAgent: AGENT,
            responseType: 'stream'

        }).then(function(response) {
            LOGGER.module().info(`Fetch successful. Writing file ${file}...`);

            try {
                let writeStream = FS.createWriteStream(file);

                writeStream.on('error', (error) => {
                    LOGGER.module().error(`Error writing source file: ${error}`);
                    resolve(false);
                });
    
                writeStream.on('finish', () => {
                    LOGGER.module().info(`File written.`);
                    resolve(true);
                });

                response.data.pipe(writeStream);
            }
            catch(error) {
                LOGGER.module().error(`Error creating file in media storage: ${error}`);
                resolve(false)
            }
        });
    });
}