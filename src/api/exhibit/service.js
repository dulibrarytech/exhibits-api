'use strict'

const Elastic = require('../../libs/elastic_search');
const Logger = require('../../libs/log4js');

exports.getAll = async () => {
    let exhibits = null;
    let page = null;
    let sort = [
        {"order": "asc"}
    ];

    try {
        let {results} = await Elastic.query({ 
            match: { type: 'exhibit' }

        }, sort, page);

        exhibits = results;
    }
    catch(error) {
        Logger.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibits;
}

exports.get = async (id) => {
    let exhibit = null;

    try {
        let {results} = await Elastic.query({
            match: { 
                uuid: {
                    query: id,
                    operator: "AND"
                } 
            }
        });

        if(results.length > 0) {
            exhibit = results.at(0);
        }
    }
    catch(error) {
        Logger.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibit || {};
}

exports.getItems = async (id) => {
    let items = null;
    let sort = [
        {"order": "asc"}
    ];

    try {
        let {results} = await Elastic.query({
            match: { 
                is_member_of_exhibit: {
                    query: id,
                    operator: "AND"
                } 
            }

        }, sort, null);

        items = results;
    }
    catch(error) {
        Logger.module().error(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return items;
}