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
 * @param {*} resourcePath pthe to the repository resource file
 * @param {*} resourceFilename filename of the repository resource file
 * @returns repository item data object
 */
exports.importItem = async (params) => {
    let itemData = {};
    let mediaFileName = "";
    let collectionData = {};

    const {
        repositoryItemId,
        resourcePath,
        resourceFilename
    } = params;

    let objectDataUrl = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", repositoryItemId);

    try {
        /* fetch the repository object data for the exhibit item */
        LOGGER.module().info(`Fetching data for repository item: ${repositoryItemId}...`);
        let {data} = await AXIOS.get(objectDataUrl, {
            httpsAgent: AGENT,
        });
        LOGGER.module().info(`Data fetch complete for repository item: ${repositoryItemId}`);

        LOGGER.module().info(`Fetching media file for repository item: ${repositoryItemId}...`);
        mediaFileName = await importItemResourceFile(repositoryItemId, resourcePath, resourceFilename);
        LOGGER.module().info(`Media file fetch complete for repository item: ${repositoryItemId}`);

        itemData = {
            ...data, 
            media: mediaFileName
        };

    } catch (error) {
        LOGGER.module().error(`Error retrieving repository item data and/or resource. Error: ${error} Url: ${objectDataUrl}`);
        return {};
    }

    /* define the repository data fields for the exhibit item */
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
    /* end define the repository data fields for the exhibit item */

    let collectionDataUrl = `${repositoryDomain}/${repositoryItemDataEndpoint}?key=${repositoryApiKey}`.replace("{item_id}", collection_id);

    try {
        /* fetch the repository collection data for the exhibit item */
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
    let collection_name = collectionData["title"] || "untitled collection";

    /* define the links to the repository for the exhibit item */
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
 * @param {*} repositoryItemId 
 * @param {*} resourceFile 
 */
const importItemResourceFile = async (repositoryItemId, writeFilePath, writeFileName) => {
    let resourceFileExists = false;
    let repositoryStream = null;

    const streamUrl = `${repositoryDomain}/${repositoryItemResourceEndpoint}`.replace("{item_id}", repositoryItemId);

    let head = await AXIOS.head(streamUrl, {
        httpsAgent: AGENT
    });
    
    const fileExtension = MIME_TYPES.extension(head.headers.get('content-type') || "");
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
            result.thumbnail_datastream = `${repositoryDomain}/${repositoryItemThumbnailEndpoint}`.replace("{item_id}", result["pid"]);
        });
    }
    catch(error) {
        LOGGER.module().error(`Error searching repository: ${error}`);
    }
    
    return results;
}