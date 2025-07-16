'use strict'

const CONFIG = require('../../config/configuration.js');
const LOGGER = require('../../libs/log4js');
const ELASTIC = require('../../libs/elastic_search');
const FS = require('fs');
const HTTPS = require('https');
const AXIOS = require('axios');
const MIME_TYPES = require('mime-types');
const AGENT = new HTTPS.Agent({
  rejectUnauthorized: false,
});

const {fetchFile} = require('./helper');

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

const SUBJECT_AUTHORITIES = ['local', 'lcsh', 'lcnaf', 'aat'];

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

    // define object data fields
    let id = itemData.pid || "";
    let title = itemData.title || "untitled item";
    let collection_id = itemData.is_member_of_collection || null;
    let mime_type = itemData.mime_type || null;

    let local_identifier = null;
    if(itemData.display_record?.identifiers) {
        local_identifier = itemData.display_record.identifiers.find((identifier) => {
            return identifier.type == 'local';  
        })?.identifier || "no identifier";
    }
    
    let subject = null;
    if(itemData.display_record?.subjects) {

        subject = itemData.display_record.subjects.find((subject) => {
            return SUBJECT_AUTHORITIES.includes(subject.authority);

        })?.title || null;
    }
    
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

    return {id, title, collection_id, mime_type, local_identifier, subject, collection_name, link_to_item, link_to_collection, thumbnail_datastream}
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
 * @param {*} itemId 
 * @param {*} exhibitItemId 
 * @param {*} thumbnailFileExtension 
 * @returns 
 */
exports.getItemResource = async (params) => {
    let {
        itemId="null",
        exhibitItemId="null",
        thumbnailFileExtension="jpg"
        
    } = params;

    let exhibitId = null;
    let exhibitItem = {};
    let thumbnailFile = "";
    let mediaFileCreated = false;
    let mediaFileExists = false;
    let itemData = {};

    let response;

    // get the exhibit item data
    LOGGER.module().info(`Verifying exhibit item: ${exhibitItemId}...`);
    exhibitItem = await ELASTIC.fieldSearch("uuid", exhibitItemId, "items"); // TODO update for exhibits app specific function

    // if this is a container item, find the display item in the container 'items' array
    if(exhibitItem.items) {
        exhibitItem = exhibitItem.items.find((item) => {
            return item.uuid == exhibitItemId;
        });
    }

    try {
        // verify item is in an exhibit
        exhibitId = exhibitItem.is_member_of_exhibit || null;
        if(exhibitId == null) throw `Exhibit item not found: ID: ${exhibitItemId}`;
        if(exhibitItem.media != itemId) throw "Invalid repository item id";

        // get the repository item data
        LOGGER.module().info(`Fetching data for repository item: ${itemId}`);
        itemData = await this.getItemData(itemId);

        response = {...response, itemData};

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository item data: ${error}`);
        return {error};
    }

    let fileLocation = `./${resourceLocation}/${exhibitId}`;
    let mediaFile = `${exhibitItemId}_repository_item_media.${MIME_TYPES.extension(itemData.mime_type || "")}`;
    let filePath = `${fileLocation}/${mediaFile}`;

    // check if the repository item media file exists
    try {
        LOGGER.module().info(`Verifying media resource file in local storage: ${mediaFile}...`);
        mediaFileExists = FS.existsSync(filePath);
    }
    catch(error) {
        LOGGER.module().error(`Error verifying file in local storage: ${error} Storage location: ${filePath}`);
        return {error};
    }

    // if repository item media file does not exist, fetch it from the repository and create the media file
    if(mediaFileExists == false) {
        LOGGER.module().info(`File is not present in local storage. Fetching file for exhibit from repository. Exhibit item resource file: ${mediaFile}`);

        let url = `${repositoryDomain}/${repositoryItemResourceEndpoint}`
            .replace("{item_id}", itemId) 

        let {error} = await fetchFile(url, filePath);

        if(error) return {error};
        else mediaFileCreated = true;
    }
    else {
        LOGGER.module().info("Repository resource file found. File:", mediaFile);
    }

    // fetch and store the repository item thumbnail when a media file is created
    if(mediaFileCreated == true && repositoryItemThumbnailEndpoint) {
        LOGGER.module().info(`Fetching thumbnail file...`);

        thumbnailFile = `${exhibitItemId}_repository_item_thumbnail.${thumbnailFileExtension}`;
        filePath = `${fileLocation}/${thumbnailFile}`;

        let url = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`
            .replace("{item_id}", itemId) 

        let {error} = await fetchFile(url, filePath);

        // add thumbnail file creation data to the response object
        if(error) return {error};
        else response = {...response, thumbnailFile};
    }

    // add media file creation data to the response object
    return {mediaFile, mediaFileCreated, ...response}
}