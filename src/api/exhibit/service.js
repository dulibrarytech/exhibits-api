'use strict'

const Elastic = require('../../libs/elastic_search');

exports.getAll = async () => {
    let exhibits = null;

    try {
        exhibits = await Elastic.query({
            match: { type: 'exhibit' }
        });
    }
    catch(error) {
        console.log(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibits;
}

exports.get = async (id) => {
    let exhibit = null;

    try {
        let response = await Elastic.query({
            match: { uuid: id }
        });

        if(response.length > 0) exhibit = response.at(0);
    }
    catch(error) {
        console.log(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibit || {};
}

exports.getItems = async (id) => {
    let items = null;

    try {
        items = await Elastic.query({
            match: { is_member_of_exhibit: id }
        });
    }
    catch(error) {
        console.log(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return items;
}