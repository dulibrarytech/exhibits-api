'use strict'

const Elastic = require('../../libs/elastic_search');

exports.index = async (terms, facets=null, sort=null, exhibitId=null) => {
    let results = null;
    let sortData = null;
    let aggsData = null;

    // object types to include in search
    const ITEM_TYPES = [
        {match: {type: "exhibit"}},
        {match: {type: "item"}}
    ]

    // fulltext search fields
    const SEARCH_FIELDS = [
        {match: { "title": terms }},
        {match: { "description": terms }},
        {match: { "text": terms }}
    ]

    let queryData = {
        bool: {
            must: [
                {bool: {should: ITEM_TYPES}},
                {bool: {should: SEARCH_FIELDS}}
            ]
        },
    };

    // TODO define aggs obj if facets pres (build from facets) (will be not null in Elastic::srch() call)
    if(facets) {
        //aggsData = [];
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
        results = await Elastic.query(queryData, aggsData, sortData);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    return results;
}
