'use strict'

const Elastic = require('../../libs/elastic_search');
const {getSearchResultAggregations, combineAggregations} = require('./helper');

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
    const NESTED_OBJECT_TYPES = ["grid", "vertical_timeline", "vertical_timeline_2"]

    // item types to include in search
    const ITEM_TYPES = ["image", "large_image", "audio", "video", "pdf", "external"];

    // fulltext search fields
    const SEARCH_FIELDS = ["title", "description", "text"];
    
    // fields to aggregate in search results
    const AGGREGATION_FIELDS_EXHIBIT = [];
    const AGGREGATION_FIELDS_ITEM = [
        {
            "name": "item_type",
            "field": "item_type.keyword"
        }
    ];

    /*
     * main query - searches in top level index documents
     */
    for(let type of OBJECT_TYPES) { // helper
        objectTypes.push({
            match: { type }
        });
    }

    for(let item_type of ITEM_TYPES) { // helper
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

    // add facet clauses to main search query
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

    // Add sort field if sort value is present
    if(sort) {
        let field = sort[0];
        let value = sort[1];

        sortData = [];
        sortData.push({
            [field]: value
        });

        sortData.push("_score");
    }

    // If exhibitId is present, scope the search to the exhibit
    if(exhibitId) {
        queryData.bool.must.push({
            bool: {filter: {term: {"is_member_of_exhibit": exhibitId}}}
        });
    }

    try {
        // execute the search for top level documents
        resultsData = await Elastic.query(queryData, sortData, page || 1, aggsData);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }
    /*
     * end main query
     */

    /*
     * nested query - searches in the "items" array of grid documents
     */
    let nestedResultsData = {}, nestedAggregations = {};

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

    // build nested search query object
    let nestedQuery = {
        bool: {
            must: [
                {bool: {should: itemTypes}},
                {bool: {should: [
                    {match: {[`items.title`] : terms}}, // TODO use SEARCH_FIELDS
                    {match: {[`items.description`] : terms}},
                    {match: {[`items.text`] : terms}}
                ]}}
            ]
        }
    }

    // add facet clauses to nested search query
    if(facets) {
        for(let field in facets) {
            for(let value of facets[field].split(',')) {
                nestedQuery.bool.must.push({
                    term: {
                        [`items.${field}`]: value
                    }
                });
            }
        }
    }

    // create the nested query to the main search fields array
    searchFields = [];
    searchFields.push({
        nested: {
            path: "items",
            query: nestedQuery,
            inner_hits: {} 
        }
    });

    // build the search query object
    queryData = {
        bool: {
            must: [
                {bool: {should: objectTypes}},
                {bool: {should: searchFields}}
            ]
        }
    };

    // add nested aggregations
    let itemsAggs = {};
    for(let {name, field} of AGGREGATION_FIELDS_ITEM) {
        itemsAggs[`items.${name}`] = {
            terms: { field: `items.${field}` }
        }
    }
    aggsData = {};
    aggsData.items = {
        nested: {
            path: "items"
        },
        aggregations: itemsAggs
    }

    // if exhibitId is present, scope the search to the exhibit
    if(exhibitId) {
        queryData.bool.must.push({
            bool: {filter: {term: {"is_member_of_exhibit": exhibitId}}}
        });
    }

    try {
        // execute the search for nested documents
        nestedResultsData = await Elastic.query(queryData, sortData, page || 1, aggsData);
        nestedAggregations = getSearchResultAggregations(AGGREGATION_FIELDS_ITEM, nestedResultsData.results);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    /*
     * end nested query
     */

    // add the nested search results data to the main search results data
    if(resultsData.aggregations) resultsData.aggregations = combineAggregations(resultsData.aggregations, nestedAggregations);
    resultsData.results = resultsData.results.concat(nestedResultsData.results);
    resultsData.resultCount += nestedResultsData.resultCount;

    return resultsData;
}
