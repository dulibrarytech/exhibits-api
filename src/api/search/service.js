'use strict'

const Elastic = require('../../libs/elastic_search');

exports.index = async (terms, facets=null, sort=null, page=null, exhibitId=null) => {
    let results = null;
    let queryData = null;
    let aggsData = {};
    let sortData = null;
    let objectTypes = [];
    let itemTypes = [];
    let searchFields = [];
    let queryType = null;

    // object types to include in search
    const OBJECT_TYPES = ["exhibit", "item"];

    // item types to include in search
    const ITEM_TYPES = ["image", "large_image", "audio", "video", "pdf", "external"];

    // fulltext search fields
    const SEARCH_FIELDS = ["title", "description", "text", "items.title", "items.description", "items.text"];
    
    // fields to aggregate in search results
    const AGGREGATION_FIELDS_EXHIBIT = [];
    const AGGREGATION_FIELDS_ITEM = [
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

    // allow items that have no 'item_type' field (exhibits, and item grids) to be hit
    itemTypes.push({
        bool: {
            must_not: {
                exists: {
                    field: "item_type"
                }
            }
        }
    });

    // detect multi word terms, and use a phrase match on the terms (will hit on exact match of string) All terms must be present in the index document, in order.
    if(terms.indexOf('\\ ') > 0) {
        queryType = "match_phrase";
        terms = terms.replace('\\', '')
    }
    // will hit if all terms are present, the order does not matter. AND boolean queries will still hit if not all of the terms are present in the index document.
    else {
        queryType = "match";
    }

    for(let field of SEARCH_FIELDS) {
        searchFields.push({
            [queryType]: {
                [field]: terms
            }
        });
    }

    for(let {name, field} of exhibitId ? AGGREGATION_FIELDS_ITEM : AGGREGATION_FIELDS_EXHIBIT) {
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

    // add the nested query object for the "items" field to search the items array objects
    // queryData.nested = {
    //     path: "items",
    //     query: {
    //         match: {"items.title" : terms},
    //         match: {"items.description" : terms},
    //         match: {"items.text" : terms}
    //     },
    //     inner_hits: {} 
    // }

    /////
    // TEST - output the internal subqueries
    ///////
    // queryData.bool.must.forEach((subquery) => {
    //     console.log("TEST subquery:", subquery.bool.should)
    // })
    /////
    // end TEST
    ///////

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

    if(exhibitId) {
        queryData.bool.must.push({
            bool: {filter: {term: {"is_member_of_exhibit": exhibitId}}}
        });
    }
    
    try {
        results = await Elastic.query(queryData, sortData, aggsData, page || 1);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    return results;
}
