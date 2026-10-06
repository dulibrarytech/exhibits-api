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

    // remove unpublished items if not admin request
    items = items.filter((result) => {
        return isAdmin ? true : result.is_published == 1;
    });

    // remove unpublished grid items (in items []) if not admin request
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
        items = await addRepositoryData(items);
        await addIIIFData(items);
    }

    return items;
}

const addMetadataFields = async (items) => {
    await Promise.all(items.map(async (item) => { // remove, convert to single item input
        let {
            media_subjects = null
        } = item; 
        
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
    return await Promise.all(items.map(async (item) => {
        if(item.items) {
            item.items = await addRepositoryData(item.items);
        }
        return await getRepositoryItemData(item);
    }));
}

const getRepositoryItemData = async (item) => {
    const {
        is_repo_item: isRepoItem = null,
    } = item;

    if(isRepoItem) { 
        let repositoryItemId = item.media;
        item.media = null; // remove the repository item id from the media field

        let repositoryItemData = CACHE.get(repositoryItemId) || false;

        // fetch the repository item data for the item.repository_data field
        if(repositoryItemData == false) {
            LOGGER.module().info(`Retrieving data from repository for exhibit item: ${item.uuid}`);

            repositoryItemData = await REPOSITORY.importItemData({repositoryItemId});
            if(repositoryItemData) {
                CACHE.set(repositoryItemId, repositoryItemData);
            }
            else {
                repositoryItemData = {};
            }
        }
        item.repository_data = repositoryItemData;

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

        // adds iiif data to repository item, if not present
        if(enableIIIFItem) {
            const {
                manifest_url: repositoryItemManifestUrl = null,
                image_url: repositoryItemImageUrl = null,
                service_url: repositoryItemServiceUrl = null
            } = item.media_iiif || {};

            // if the item does not have media_iiif data, or if the media_iiif data is missing any of the required fields, assign the repository iiif urls to the item
            const repository_media_iiif = {
                manifest_url:   repositoryItemManifestUrl || `${repositoryIIIFManifestUrl}`.replace("{item_id}", repositoryItemId),
                image_url:      repositoryItemImageUrl ||`${repositoryIIIFImageUrl}`.replace("{item_id}", repositoryItemId),
                service_url:    repositoryItemServiceUrl || `${repositoryIIIFServiceUrl}`.replace("{item_id}", repositoryItemId),
            };

            item.media_iiif = repository_media_iiif;
        }

        // adds iiif thumbnail data to repository item, if not present
        if(enableIIIFThumbnail) {
            const {
                thumbnail_url: repositoryItemThumbnailUrl = null,
            } = item.thumbnail_iiif || {};

            // if the item does not have thumbnail_iiif data, or if the thumbnail_iiif data is missing the required field, assign the repository iiif thumbnail url to the item
            const repository_thumbnail_iiif = {
                thumbnail_url: repositoryItemThumbnailUrl || `${repositoryIIIFThumbnailUrl}`.replace("{item_id}", repositoryItemId),
            };

            item.thumbnail_iiif = repository_thumbnail_iiif;
        }
        
        if (fetchResourceFile) {
            LOGGER.module().info(`Fetching media file for repository item: ${repositoryItemId}...`);
            const resourcePath = `${resourceLocalStorageLocation}/${item.is_member_of_exhibit}`;
            const resourceFilename = `${item.uuid}_repository_item_media`;
            item.media = await REPOSITORY.importItemResourceFile(repositoryItemId, resourcePath, resourceFilename);
            LOGGER.module().info(`Media file fetch complete for repository item: ${repositoryItemId}`);
        }
    }

    return item;
}
exports.getRepositoryItemData = getRepositoryItemData;

async function addIIIFData(items) {
    await Promise.all(items.map(async (item) => {
        const {
            uuid, media_iiif
        } = item;

        if (media_iiif) {
            const { manifest_url = "" } = media_iiif;

            // TODO: verify manifest url domain
            // const url = new Url(manifest_url)
            // if url.domain == config.EXHIBITS_IIIF_DOMAIN => do insecure fetch
            try {
                const response = await AXIOS.get(manifest_url, { httpsAgent: AGENT });
                const { success = null, message = "Unspecified error from IIIF manifest server" } = response.data;

                if (typeof success != undefined && success === false) {
                    media_iiif.manifest = null;
                    throw message;
                }
                else {
                    media_iiif.manifest = JSON.stringify(response.data);
                }
            }
            catch (error) {
                LOGGER.module().error(`Error fetching iiif manifest: ${error} Item: ${uuid}`);
            }
        }
        else if (item.items) {
            await addIIIFData(item.items);
        }
    }));
}

const addKalturaData = async (items) => {
    await Promise.all(items.map((item) => { 
        const {
            kaltura: kalturaData = null, 
            media = null,
        } = item;

        if(kalturaData) {
            const {
                kaltura_id: kalturaId = null
            } = kalturaData;

            item.is_kaltura_item = 1;
            item.kaltura_id = kalturaId || media || null;

            if(!item.kaltura_id) {
                LOGGER.module().error(`Kaltura id not found in kaltura item: ${item.uuid}`);
            }
        }
        else if(item.items) {
            addKalturaData(item.items);
        }
    }));
}