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
const CACHE = require('../../libs/cache').create();

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

} = CONFIG;

const SUBJECT_AUTHORITIES = ['local', 'lcsh', 'lcnaf', 'aat'];

/**
 * 
 * @param {*} itemId the repository item id (digitaldu pid)
 * @returns 
 */
exports.getItemData = async (params) => {
    let itemData = {};
    let collectionData = {};

    const {
        repositoryItemId,
        resourcePath,
        resourceFilename
    } = params;

    itemData = CACHE.get(repositoryItemId) || false;

    // fetch the item data from the repository
    if(!itemData)  {
        try {
            let url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", repositoryItemId);
            
            LOGGER.module().info(`Fetching data for repository item: ${repositoryItemId}...`);
            let {data} = await AXIOS.get(url, {
                httpsAgent: AGENT,
            });
            itemData = data;
            LOGGER.module().info(`Data fetch complete for repository item: ${repositoryItemId}`);

            LOGGER.module().info(`Fetching resource file for repository item: ${repositoryItemId}...`);
            let file = `${resourceFilename}.${MIME_TYPES.extension(itemData.mime_type || "")}`;
            let resourceFile = `${resourcePath}/${file}`;
            // await getItemResource(repositoryItemId, resourceFile); // sync fetch/write (request completes when all files are written to local storage)
            getItemResource(repositoryItemId, resourceFile); // async fetch/write (request completes before all files are written to storage)
            LOGGER.module().info(`Resource file fetch complete for repository item: ${repositoryItemId}`);

            itemData = {...itemData, media: file};

            CACHE.set(repositoryItemId, itemData);

        } catch (error) {
            LOGGER.module().error(`Error retrieving repository item data. Error: ${error}`);
            return {};
        }
    }
    else {
        LOGGER.module().info(`Repository item data retrieved from cache: id: ${repositoryItemId}`);
    }

    // set repository data fields
    let id = itemData.pid || "";
    let title = itemData.title || "untitled item";
    let collection_id = itemData.is_member_of_collection || null;
    let mime_type = itemData.mime_type || null;
    let media = itemData.media || "";
    let thumbnail = itemData.thumbnail || "";

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
    let subjects = itemData.f_subjects;
    
    // get the parent collection
    collectionData = CACHE.get(collection_id) || false;
    if(!collectionData) {
        try {
            LOGGER.module().info(`Fetching data for repository collection: ${collection_id}`);

            let url = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", collection_id);
            
            let {data} = await AXIOS.get(url, {
                httpsAgent: AGENT,
            });

            CACHE.set(collection_id, data);
            collectionData = data;

        } catch (error) {
            LOGGER.module().error(`Error retrieving repository collection data. Response: ${error}`);
            return {};
        }
    }
    else {
        LOGGER.module().info(`Repository collection data retrieved from cache: id: ${repositoryItemId}`);
    }

    let collection_name = collectionData["title"] || "untitled collection";

    // set link fields
    let link_to_item = `${repositoryDomain}/${repositoryObjectEndpoint}`.replace("{item_id}", repositoryItemId);
    let link_to_collection = `${repositoryDomain}/${repositoryCollectionEndpoint}`.replace("{collection_id}", collection_id || "null");
    let thumbnail_datastream = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", repositoryItemId);

    return {
        id, 
        title, 
        collection_id, 
        mime_type, 
        media,
        thumbnail,
        local_identifier, 
        subject, 
        subjects, 
        collection_name, 
        link_to_item, 
        link_to_collection, 
        thumbnail_datastream
    }
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
 * @param {*} resourceFile 
 */
const getItemResource = async (repositoryItemId, resourceFile) => {
    let resourceFileExists = false;
    let resourceFileCreated = false;

    try {
        LOGGER.module().info(`Verifying media resource file in local storage: ${resourceFile}...`);
        resourceFileExists = FS.existsSync(resourceFile);
    }
    catch(error) {
        LOGGER.module().error(`Error verifying file in local storage: ${error} Storage location: ${filePath}`);
        return {error};
    }

    // if no file, run fetch ops (fetch media, write media, fetch tn, write tn, )
    if(resourceFileExists == false) {
        LOGGER.module().info(`File is not present in local storage. Fetching file for exhibit from repository. Exhibit item resource file: ${resourceFile}`);

        let url = `${repositoryDomain}/${repositoryItemResourceEndpoint}`
            .replace("{item_id}", repositoryItemId) 

        let {error} = await fetchFile(url, resourceFile);

        if(error) return {error};
        else resourceFileCreated = true;
    }
    else {
        LOGGER.module().info("Repository resource file found:", resourceFile);
    }

    return {resourceFileCreated}
}