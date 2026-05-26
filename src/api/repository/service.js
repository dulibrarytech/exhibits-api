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

const FILE_FETCH_TIMEOUT = 90000;

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
 * @param {*} repositoryItemId the repository item id (digitaldu pid)
 * @returns repository item data object
 */
exports.importItemData = async (params) => {
    let itemData = {};
    let collectionData = {};

    const {
        repositoryItemId,
    } = params;

    let objectDataUrl = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", repositoryItemId);

    try {
        LOGGER.module().info(`Fetching data for repository item: ${repositoryItemId}...`);
        let {data} = await AXIOS.get(objectDataUrl, {
            httpsAgent: AGENT,
        });
        LOGGER.module().info(`Data fetch complete for repository item: ${repositoryItemId}`);

        itemData = data;

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository item data. Fetch error: ${error} Url: ${objectDataUrl}`);
        return {};
    }

    let id              = itemData.pid || "";
    let title           = itemData.title || "untitled item";
    let collection_id   = itemData.is_member_of_collection || null;
    let mime_type       = itemData.mime_type || null;
    let kaltura_id      = itemData.entry_id || itemData.kaltura_id || null;
    let thumbnail       = itemData.thumbnail || "";

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

    let archivalObjectPath = itemData.display_record?.uri || null;
    let archival_object_url = archivalObjectPath ? `${CONFIG.archivalMetadataProviderDomain}${archivalObjectPath}` : null;

    let collectionDataUrl = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", collection_id);
    try {
        LOGGER.module().info(`Fetching data for repository collection: ${collection_id}`);
        let {data} = await AXIOS.get(collectionDataUrl, {
            httpsAgent: AGENT,
        });

        LOGGER.module().info(`Collection data fetch successful.`);
        collectionData = data;

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository collection data. Error: ${error} Url: ${collectionDataUrl}`);
        return {};
    }

    /* define the repository data fields for the exhibit item */
    const collection_name = collectionData["title"] || "untitled collection";

    /* define the links to the repository for the exhibit item */
    const link_to_item = `${repositoryDomain}/${repositoryObjectEndpoint}`.replace("{item_id}", repositoryItemId);
    const link_to_collection = `${repositoryDomain}/${repositoryCollectionEndpoint}`.replace("{collection_id}", collection_id || "null");
    const thumbnail_datastream_url = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", repositoryItemId);

    return {
        id, 
        title, 
        collection_id, 
        mime_type, 
        kaltura_id,
        thumbnail,
        local_identifier, 
        subject, 
        subjects, 
        collection_name, 
        link_to_item, 
        link_to_collection, 
        thumbnail_datastream_url,
        archival_object_url
    }
}

/**
 * 
 * @param {*} repositoryItemId 
 * @param {*} resourceFile 
 */
exports.importItemResourceFile = async (repositoryItemId, writeFilePath, writeFileName) => {
    let resourceFileExists = false;
    let repositoryStream = null;

    let streamResponseData;
    try {
        const streamUrl = `${repositoryDomain}/${repositoryItemResourceEndpoint}`.replace("{item_id}", repositoryItemId);
        streamResponseData = await AXIOS.head(streamUrl, {
            httpsAgent: AGENT
        });
    }
    catch(error) {
        LOGGER.module().error(`Error connecting to repository: ${error} Url: ${repositoryDomain} Can't retrieve resource data`);
        return false;
    }
    
    const fileExtension = MIME_TYPES.extension(streamResponseData.headers.get('content-type') || "");
    const resourceFilePath = `${writeFilePath}/${writeFileName}.${fileExtension}`;
    const resourceFileName = `${writeFileName}.${fileExtension}`;

    try {
        LOGGER.module().info(`Verifying media resource file in local storage: ${resourceFilePath}...`);
        resourceFileExists = FS.existsSync(resourceFilePath);
    }
    catch(error) {
        LOGGER.module().error(`Error verifying file in local storage: ${error} Storage location: ${writeFilePath}`);
        return false;
    }

    if(resourceFileExists) {
        LOGGER.module().info("Repository resource file found:", resourceFileName);
        return resourceFileName;
    }

    try {
        LOGGER.module().info(`Repository resource file not found. Fetching file from repository: ${streamUrl}...`);
        repositoryStream = await AXIOS.get(streamUrl, {
            httpsAgent: AGENT,
            responseType: 'stream',
            timeout: FILE_FETCH_TIMEOUT
        });

    } catch (error) {
        LOGGER.module().error(`Error fetching file: ${error}`);
        return false;
    }

    LOGGER.module().info(`Fetch successful. Writing file ${resourceFileName}...`);

    try {
        let writeStream = FS.createWriteStream(resourceFilePath);

        writeStream.on('error', (error) => {
            LOGGER.module().error(`Error writing file: ${error} Repository item id: ${repositoryItemId}`);
        });

        writeStream.on('finish', () => {
            LOGGER.module().info(`File write complete: ${resourceFileName}`);
        });

        repositoryStream.data.pipe(writeStream);

        return resourceFileName;
    }
    catch(error) {
        if (error.code === 'ECONNABORTED') {
            LOGGER.module().error(`Request timed out. Repository item id: ${repositoryItemId}`);
        }
        else {
            LOGGER.module().error(`Error creating file in media storage: ${error}`);
        }
        return false;
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
            result.thumbnail_datastream_url = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", result["pid"]);
        });
    }
    catch(error) {
        LOGGER.module().error(`Error searching repository: ${error}`);
    }
    
    return results;
}