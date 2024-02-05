'use strict'

const Elastic = require('../../libs/elastic_search');

exports.index = async (terms, facets=null, sort=null, exhibitId=null) => {
    let results = null;
    let queryData = null;
    let aggsData = {};
    let sortData = null;
    let objectTypes = [];
    let itemTypes = [];
    let searchFields = [];

    // object types to include in search
    const OBJECT_TYPES = ["exhibit", "item", "grid"];

    // object types to include in search
    const ITEM_TYPES = ["image", "large_image", "audio", "video", "pdf", "external"];

    // fulltext search fields
    const SEARCH_FIELDS = ["title", "description", "text", "items.title", "items.description", "items.text"]; // TODO if fields passed in, bypass this
    
    // fields to aggregate in search results
    const AGGREGATION_FIELDS = [
        {
            "name": "is_member_of_exhibit",
            "field": "is_member_of_exhibit.keyword"
        },
        {
            "name": "type",
            "field": "type.keyword"
        },
        {
            "name": "item_type",
            "field": "item_type.keyword"
        }
    ];

    for(let type of OBJECT_TYPES) {
        objectTypes.push({
            match: { type }
        });
    }

    for(let item_type of ITEM_TYPES) {
        itemTypes.push({
            match: { item_type }
        });
    }

    for(let field of SEARCH_FIELDS) {
        searchFields.push({
            match: {
                [field]: terms
            }
        });
    }

    for(let {name, field} of AGGREGATION_FIELDS) {
        aggsData[name] = {
            terms: { field }
        }
    }

    queryData = {
        bool: {
            must: [
                {bool: {should: objectTypes}},
                {bool: {should: itemTypes}},
                {bool: {should: searchFields}}
            ]
        },
    };

    if(facets) {
        for(let field in facets) {
            for(let value of facets[field].split(',')) {
                queryData.bool.must.push({
                    term: {
                        [field]: value
                    }
                });
            }
        }
    }

    if(sort) {
        let field = sort[0];
        let value = sort[1];

        sortData = [];
        sortData.push({
            [field]: value
        });

        sortData.push("_score");
    }

    // scope search to an exhibit if exhibitId is present
    if(exhibitId) {
        queryData.bool.must.push({
            bool: {filter: {term: {"is_member_of_exhibit": exhibitId}}}
        });
    }
    
    try {
        results = await Elastic.query(queryData, sortData, aggsData);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    return results;
}
