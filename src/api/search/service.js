'use strict'

const util = require('util');
const Elastic = require('../../libs/elastic_search');

exports.index = async (terms, facets=null, sort=null, page=null, exhibitId=null) => {
    let queryData = null;
    let aggsData = {};
    let sortData = null;
    let objectTypes = [];
    let itemTypes = [];
    let searchFields = [];
    let queryType = null;
    let resultsData = {};

    // object types to include in the search
    const OBJECT_TYPES = ["exhibit", "item"]; // <-- remove grid/vtl
    const NESTED_OBJECT_TYPES = ["grid", "vertical_timeline"]

    // item types to include in search
    const ITEM_TYPES = ["image", "large_image", "audio", "video", "pdf", "external"];

    // fulltext search fields
    const SEARCH_FIELDS = ["title", "description", "text"];
    const NESTED_SEARCH_FIELDS = ["items"];
    
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

    // TODO find a better way to detect multi word terms
    if(terms.indexOf('\\ ') > 0) {
        queryType = "match_phrase";
        terms = terms.replace('\\', '')
    }
    else {
        queryType = "match";
    }

    // add top level index fields
    for(let field of SEARCH_FIELDS) {
        searchFields.push({
            [queryType]: {
                [field]: terms
            }
        });
    }

    // build main search query object
    queryData = {
        bool: {
            must: [
                {bool: {should: objectTypes}},
                {bool: {should: itemTypes}},
                {bool: {should: searchFields}}
            ]
        }
    };

    // add the item aggregation fields to the main query
    for(let {name, field} of exhibitId ? AGGREGATION_FIELDS_ITEM : AGGREGATION_FIELDS_EXHIBIT) {
        aggsData[name] = {
            terms: { field }
        }
    }

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
        resultsData = await Elastic.query(queryData, sortData, page || 1, aggsData);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    objectTypes = [];
    for(let type of NESTED_OBJECT_TYPES) {
        objectTypes.push({
            match: { type }
        });
    }

    itemTypes = [];
    for(let item_type of ITEM_TYPES) {
        itemTypes.push({
            match: { [`items.item_type`]: item_type }
        });
    }

    searchFields = [];
    for(let field of NESTED_SEARCH_FIELDS) {
        searchFields.push({
            nested: {
                path: field,
                query: {
                    bool: {
                        must: [
                            {bool: {should: itemTypes}},
                            {bool: {should: [
                                {match: {[`${field}.title`] : terms}}, // TODO use SEARCH_FIELDS
                                {match: {[`${field}.description`] : terms}},
                                {match: {[`${field}.text`] : terms}}
                            ]}}
                        ]
                    }
                },
                inner_hits: {} 
            }
        });
    }

    queryData = {
        bool: {
            must: [
                {bool: {should: objectTypes}},
                {bool: {should: searchFields}}
            ]
        }
    };
    aggsData = {};

    let itemsAggs = {};
    for(let {name, field} of AGGREGATION_FIELDS_ITEM) {
        itemsAggs[`items.${name}`] = {
            terms: { field: `items.${field}` }
        }
    }

    for(let field of NESTED_SEARCH_FIELDS) {
        aggsData.items = {
            nested: {
                path: field
            },
            aggregations: itemsAggs
        }
    }

    if(exhibitId) {
        queryData.bool.must.push({
            bool: {filter: {term: {"is_member_of_exhibit": exhibitId}}}
        });
    }

    try {
        let nestedResultData = await Elastic.query(queryData, sortData, page || 1, aggsData);

        let nestedAggregations = {};
        let aggCounts = {}, aggField, aggValue;

        for(let {name} of AGGREGATION_FIELDS_ITEM) {
            aggField = name;

            if(aggField in nestedAggregations == false) {
                nestedAggregations[aggField] = [];
            }

            for(let result of nestedResultData.results) {
                aggValue = result[aggField];
                
                if(!aggCounts[aggValue]) aggCounts[aggValue] = 0;
                aggCounts[aggValue]++;
            }

            for(let key in aggCounts) {
                nestedAggregations[aggField].push({
                    key,
                    doc_count: aggCounts[key]
                })
            }
        }

        let topAggs = resultsData.aggregations, topAgg;
        for(let key in nestedAggregations) {
            for(let nestedAgg of nestedAggregations[key]) {
                topAgg = topAggs[key].filter((topAgg) => {
                    return topAgg.key == nestedAgg.key;
                })[0];

                if(topAgg) {
                    topAgg.doc_count += nestedAgg.doc_count;
                }
                else {
                    topAggs[key].push(nestedAgg);
                }
            }
        }

        resultsData.results = resultsData.results.concat(nestedResultData.results);
        resultsData.resultCount += nestedResultData.resultCount;
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    return resultsData;
}
