'use strict'

const Elastic = require('../../libs/elastic_search');

exports.getAll = async () => {
    let exhibits = null;
    let sort = [
        {"title.keyword": "asc"}
    ];

    try {
        let {results} = await Elastic.query({
            match: { type: 'exhibit' }

        }, sort);

        exhibits = results;
    }
    catch(error) {
        console.log(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return exhibits;
}

exports.get = async (id) => {
    let exhibit = null;

    try {
        let {results} = await Elastic.query({
            match: { uuid: id }
        });

        if(results.length > 0) {
            exhibit = results.at(0);
        }
    }
    catch(error) {
        console.log(`Error retrieving exhibits. Elastic response: ${error}`);
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
            match: { is_member_of_exhibit: id }
        }, sort, null);

        items = results;
    }
    catch(error) {
        console.log(`Error retrieving exhibits. Elastic response: ${error}`);
    }

    return items;
}