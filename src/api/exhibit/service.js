'use strict'

const CONFIG = require('../../config/configuration.js');
const ELASTIC = require('../../libs/elastic_search');
const LOGGER = require('../../libs/log4js');

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
        LOGGER.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
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
        })
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return items;
}