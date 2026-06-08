'use strict'

const CONFIG = require('../../config/configuration.js');
const APP_SETTINGS = require('../../config/appSettings.js');
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

const {
    repositoryIIIFImageUrl,
    repositoryIIIFThumbnailUrl,
    repositoryIIIFManifestUrl,
    repositoryIIIFServiceUrl,
    resourceLocalStorageLocation

} = CONFIG;

const {
    repository: REPOSITORY_SETTINGS
} = APP_SETTINGS;

const {
    enableIIIFThumbnail,
    enableIIIFItem,
    fetchResourceFile,

} = REPOSITORY_SETTINGS;

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
        await addMetadataFields(items);
        await addKalturaData(items);
        await addRepositoryData(items);
        await addIIIFData(items);
    }

    return items;
}

const addMetadataFields = async (items) => {
    await Promise.all(items.map(async (item) => { // remove, convert to single item input
        let {
            media_subjects = null
        } = item; 
        
        // subjects
        if(media_subjects) {
            let {subjects = null} = item;
            if(!subjects) { subjects = [] } 

            for(let bucket of Object.keys(media_subjects)) {
                const values = media_subjects[bucket];
                if(!values || !values.length) continue;
                subjects = subjects.concat(values);
            }
           
            item.subjects = subjects;
        }

        if(item.items) {
            await addMetadataFields(item.items);
        }
    }));
}

const addRepositoryData = async (items) => {
    let repositoryItemId, repositoryItemData = {};
    
    for(let item of items) { 
        const {
            is_repo_item = null,
        } = item;

        if(item.is_repo_item) {
            const {
                media = null,
                subjects = null
            } = item;

            repositoryItemId = item.media;
            item.media = null; // remove the repository item id from the media field
            repositoryItemData = CACHE.get(repositoryItemId) || false;

            // fetch the repository item data
            if(repositoryItemData == false) {
                LOGGER.module().info(`Retrieving data from repository for exhibit item: ${item.uuid}`);
                repositoryItemData = await REPOSITORY.importItemData({
                    repositoryItemId,
                });

                if(repositoryItemData) {
                    CACHE.set(repositoryItemId, repositoryItemData);
                }
                else {
                    repositoryItemData = {};
                }
            }

            const {
                subjects:   repositoryItemSubjects = null,
                kaltura_id: repositoryItemKalturaId = null
            } = repositoryItemData;

            // assign repository item subjects to the existing item subjects
            if(repositoryItemSubjects) {
                if(!item.subjects) item.subjects = [];
                item.subjects = [...new Set([...item.subjects, ...repositoryItemSubjects])];
            }

            // flag item as kaltura item if kaltura id is present in the repository data, and assign the kaltura id to the media field for the item
            if(repositoryItemKalturaId) {
                item.is_kaltura_item = 1;
                item.media = repositoryItemKalturaId;
            }

            if(enableIIIFItem) {
                item.media_iiif = {
                    manifest_url:   `${repositoryIIIFManifestUrl}`.replace("{item_id}", repositoryItemId),
                    image_url:      `${repositoryIIIFImageUrl}`.replace("{item_id}", repositoryItemId),
                    service_url:    `${repositoryIIIFServiceUrl}`.replace("{item_id}", repositoryItemId),
                };
            }
            if(enableIIIFThumbnail) {
                item.thumbnail_iiif = {
                    thumbnail_url:  `${repositoryIIIFThumbnailUrl}`.replace("{item_id}", repositoryItemId),
                }
            }
            
            if (fetchResourceFile) {
                LOGGER.module().info(`Fetching media file for repository item: ${repositoryItemId}...`);
                const resourcePath = `${resourceLocalStorageLocation}/${item.is_member_of_exhibit}`;
                const resourceFilename = `${item.uuid}_repository_item_media`;
                item.media = await REPOSITORY.importItemResourceFile(repositoryItemId, resourcePath, resourceFilename);
                LOGGER.module().info(`Media file fetch complete for repository item: ${repositoryItemId}`);
            }

            item.repository_data = repositoryItemData;
        }
        else if(item.items) {
            await addRepositoryData(item.items);
        }
    }
}

const addIIIFData = async (items) => {
    await Promise.all(items.map(async (item) => { 
        const {
            uuid, 
            media_iiif
        } = item;

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
        const {
            is_kaltura_item = null, 
            media = null
        } = item;

        if(is_kaltura_item) {
            const {kaltura_id: kalturaId = null} = item.kaltura || {};
            item.kaltura_id = kalturaId || media || null;
        }
        else if(item.items) {
            addKalturaData(item.items);
        }
    }))
}