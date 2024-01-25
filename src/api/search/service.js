'use strict'

const Elastic = require('../../libs/elastic_search');

exports.index = async (terms, facets=null, sort=null, exhibitId=null) => {
    let results = null;
    let queryData = null;
    let aggsData = {};
    let sortData = null;
    let itemTypes = [];
    let searchFields = [];

    // object types to include in search
    const ITEM_TYPES = ["exhibit", "item"];

    // fulltext search fields
    const SEARCH_FIELDS = ["name", "description", "text"];
    
    // fields to aggregate in search results
    const AGGREGATION_FIELDS = [
        {
            "name": "is_member_of_exhibit",
            "field": "is_member_of_exhibit.keyword"
        },
        {
            "name": "type",
            "field": "type.keyword"
        }
    ];

    for(let type of ITEM_TYPES) {
        itemTypes.push({
            match: { type }
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
                {bool: {should: itemTypes}},
                {bool: {should: searchFields}}
            ]
        },
    };

    if(facets) {
        // TODO build facet query with facet field:param, *append it to queryData*. facets => [ {facetName:value}, ... ]
        // -> A. *push directly to 'must' []* {term: {facetField:facetVal}}
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
