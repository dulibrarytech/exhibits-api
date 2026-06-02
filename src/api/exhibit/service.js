'use strict'

const CONFIG = require('../../config/configuration.js');
const ELASTIC = require('../../libs/elastic_search');
const LOGGER = require('../../libs/log4js');
const REPOSITORY = require('../repository/service');
const CACHE = require('../../libs/cache').create();
const FS = require('fs');
const AXIOS = require('axios');

const HTTPS = require('https');
const AGENT = new HTTPS.Agent({  
  rejectUnauthorized: false
});

const FETCH_REPOSITORY_RESOURCE_FILE = false;

exports.getExhibits = async (isAdmin) => {
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
            return isAdmin ? true : result.is_published == 1;
        });
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibits;
}

exports.getExhibit = async (id, isAdmin) => {
    let exhibit = null;

    try {
        let data = await ELASTIC.get(id);
        exhibit = (isAdmin || data.is_published == 1) ? data : null;
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibit. Elastic response: ${error}`);
    }

    return exhibit || {};
}

exports.getItems = async (id, isAdmin) => {
    let items = [];

    const sort = [
        {"order": "asc"}
    ];

    const query = {
        bool: {
            must: [
                {
                    match: { 
                        is_member_of_exhibit: {
                            query: id,
                            operator: "AND"
                        } 
                    }
                }
            ],
        }
    };

    try {
        let {results} = await ELASTIC.fetch(query, sort, null);
        items = results || [];
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibit items: ${error}`);
    }

    // remove unpublished items if api key is absent
    items = items.filter((result) => {
        return isAdmin ? true : result.is_published == 1;
    });

    // remove unpublished grid items (in items []) if api key is absent
    items = items.map((item) => {
        if(item.items) {  
            item.items = item.items.filter((item) => {
                return isAdmin ? true : item.is_published == 1;
            })
        }
        return item;
    });

    if(items.length) {
        await addSearchData(items);
        await addKalturaData(items);
        await addRepositoryData(items);
        await addIIIFData(items);
    }

    return items;
}

const addSearchData = async (items) => {
    await Promise.all(items.map(async (item) => {
        let {
            subjects = null, 
            media_subjects = null
        } = item;

        if(!subjects) { subjects = [] }
        
        // subjects
        if(media_subjects) {
            for(let bucket of Object.keys(media_subjects)) {
                const values = media_subjects[bucket];
                if(!values || !values.length) continue;
                subjects = subjects.concat(values);
            }
            item.subjects = subjects;
        }

        if(item.items) {
            await addSearchData(item.items);
        }
    }));
}

const addRepositoryData = async (items) => {
    let repositoryItemId, data = {};
    
    for(let item of items) {

        const {
            is_repo_item = null,
            media = null,
            subjects = null
        } = item;

        if(item.is_repo_item) {
            repositoryItemId = item.media;
            data = CACHE.get(repositoryItemId) || false;

            if(data == false) {
                LOGGER.module().info(`Retrieving data from repository for exhibit item: ${item.uuid}`);
                data = await REPOSITORY.importItemData({
                    repositoryItemId,
                });

                if(data) {
                    CACHE.set(repositoryItemId, data);
                }
                else {
                    data = {};
                }
            }

            if(data.subjects) {
                if(!item.subjects) item.subjects = [];
                item.subjects = [...new Set([...item.subjects, ...data.subjects])];
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
            await addRepositoryData(item.items);
        }
    }
}

const addIIIFData = async (items) => {

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
            await addIIIFData(item.items)
        }
    }))
}

const addKalturaData = async (items) => {
    await Promise.all(items.map((item) => {
        const {is_kaltura_item, media} = item;
        if(is_kaltura_item) {
            item.kaltura_id = media;
        }
        else if(item.items) {
            addKalturaData(item.items);
        }
    }))
}

// REMOVE
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
// end REMOVE