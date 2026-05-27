'use strict'

const CONFIG = require('../../config/configuration.js');
const ELASTIC = require('../../libs/elastic_search');
const LOGGER = require('../../libs/log4js');
const REPOSITORY = require('../repository/service');
const CACHE = require('../../libs/cache').create();
const FS = require('fs');
const AXIOS = require('axios');

const https = require('https');
const AGENT = new https.Agent({  
  rejectUnauthorized: false
});

const FETCH_REPOSITORY_RESOURCE_FILE = false;

const validateKey = (key) => {
    return key && key == CONFIG.apiKey;
}

exports.getExhibits = async (key) => {
    let exhibits = null;
    let page = null;
    let sort = [
        {"order": "asc"}
    ];

    try {
        let {results} = await ELASTIC.fetch({ 
            match: { type: 'exhibit' }

        }, sort, page);

        exhibits = results.filter((result) => {
            return validateKey(key) ? true : result.is_published == 1;
        });
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibits;
}

exports.getExhibit = async (id, key) => {
    let exhibit = null;

    try {
        let data = await ELASTIC.get(id);
        exhibit = (validateKey(key) || data.is_published == 1) ? data : false;
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibit. Elastic response: ${error}`);
    }

    return exhibit || {};
}

exports.getItems = async (id, key) => {
    let items = null;

    let sort = [
        {"order": "asc"}
    ];

    try {
        let {results} = await ELASTIC.fetch({
            match: { 
                is_member_of_exhibit: {
                    query: id,
                    operator: "AND"
                } 
            }
        }, sort, null);

        // filter out unpublished items if api key is absent
        items = results.filter((result) => {
            return validateKey(key) ? true : result.is_published == 1;
        });

        // filter out unpublished grid items (in items []) if api key is absent
        items = items.map((item) => {
            if(item.items) {  
                item.items = item.items.filter((item) => {
                    return validateKey(key) ? true : item.is_published == 1;
                })
            }

            return item;
        });
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibit items: ${error}`);
    }

    await getKalturaData(items);
    await getRepositoryItemData(items);
    await getIIIFData(items);

    return items;
}

const getRepositoryItemData = async (items) => {
    let repositoryItemId, data = {};
    
    for(let item of items) {
        if(item.is_repo_item) {
            repositoryItemId = item.media;
            data = CACHE.get(repositoryItemId) || false;

            if(data == false) {
                LOGGER.module().info(`Retrieving data from repository for exhibit item: ${item.uuid}`);
                data = await REPOSITORY.importItemData({
                    repositoryItemId,
                });

                // TODO - can this f() return false? if so, don't set cache here and skip all else in this block

                if(data) {
                    CACHE.set(repositoryItemId, data);
                }
                else {
                    data = {};
                }
            }

            if (data.kaltura_id) {
                item.is_kaltura_item = 1;
                item.media = data.kaltura_id;
            }
            
            if (FETCH_REPOSITORY_RESOURCE_FILE) {
                LOGGER.module().info(`Fetching media file for repository item: ${repositoryItemId}...`);
                
                const resourcePath = `${CONFIG.resourceLocalStorageLocation}/${item.is_member_of_exhibit}`;
                const resourceFilename = `${item.uuid}_repository_item_media`;

                data.media = await REPOSITORY.importItemResourceFile(repositoryItemId, resourcePath, resourceFilename);
                LOGGER.module().info(`Media file fetch complete for repository item: ${repositoryItemId}`);
            }
            
            // update media field to point to repository media file or url, if present
            item.media = data.media || null;

            // append all repository data to the item object in a "repository_data" field so that it is available for use in the frontend if needed
            item.repository_data = data;
        }
        else if(item.items) {
            await getRepositoryItemData(item.items);
        }
    }
}

const getIIIFData = async (items) => {

    await Promise.all(items.map(async (item) => {
        const {uuid, media_iiif} = item;

        if(media_iiif) {
            const {manifest_url = ""} = media_iiif;

            // TODO: verify manifest url domain
            // const url = new Url(manifest_url)
            // if url.domain == config.EXHIBITS_IIIF_DOMAIN => do insecure fetch

            try {
                const response = await AXIOS.get(manifest_url, { httpsAgent: AGENT });
                const {success = null, message = "Unspecified error from IIIF manifest server"} = response.data;

                if(typeof success != undefined && success === false) {
                    media_iiif.manifest = null;
                    throw message;
                }
                else {
                    media_iiif.manifest = JSON.stringify(response.data)
                }
            }
            catch(error) {
                LOGGER.module().error(`Error fetching iiif manifest: ${error} Item: ${uuid}`);
            }
        }
        else if(item.items) {
            await getIIIFData(item.items)
        }
    }))
}

const getKalturaData = async (items) => {
    await Promise.all(items.map((item) => {
        const {is_kaltura_item, media} = item;
        if(is_kaltura_item) {
            item.kaltura_id = media;
        }
        else if(item.items) {
            getKalturaData(item.items);
        }
    }))
}

exports.resourceExists = async (exhibitId, filename) => {
    let exists;
    let filePath = `${CONFIG.resourceLocalStorageLocation}/${exhibitId}/${filename}`;

    try {
        exists = FS.existsSync(filePath);
    }
    catch(error) {
        LOGGER.module().error(`Error verifying file in local storage: ${error} Storage location: ${filePath}`);
    }

    return exists || false;
}