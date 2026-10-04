/**
 * Exhibits@DU search engine
 */

'use strict'

const ELASTIC = require('../../libs/elastic_search');
const LOGGER = require('../../libs/log4js');
const APP_SETTINGS = require('../../config/appSettings.js');
const REPO_SERVICE = require('../repository/service.js');

const {
    getRepositoryThumbnailUri,
    getRepositoryResourceUri,
} = require('../repository/helper');

const {
    search: SEARCH_SETTINGS
} = APP_SETTINGS;

const {
    objectTypes: OBJECT_TYPES,
    itemTypes: ITEM_TYPES,
    searchFields: SEARCH_FIELDS,
    aggregationFields: AGGREGATION_FIELDS_ITEM,

} = SEARCH_SETTINGS;

exports.search = async (terms, type=null, facets=null, sort=null, page=null, exhibitId=null) => { 
    let queryData = null;
    let queryType = null;
    let aggsData = {};
    let sortData = null;
    let resultsData = {};
    let objectTypes = [];
    let itemTypes = [];
    let nestedItemTypes = [];
    let searchFields = [];
    let nestedSearchFields = [];
    let facetQuery = [];
    let nestedFacetQuery = [];

    // module settings
    const MAX_NESTED_ITEMS_RESULTS = 100;
    const MAX_AGGREGATION_COUNT = 100;

    // object type (match in top level documents only)
    if(type) {
        objectTypes.push({
            match: { type }
        });
    }
    else {
        objectTypes = OBJECT_TYPES.map((type) => {
            return {match: {type}}
        })
    }

    // match item type (match in top level and nested documents)
    itemTypes = ITEM_TYPES.map((item_type) => {
        return {match: { item_type }}
    });
    nestedItemTypes = ITEM_TYPES.map((item_type) => {
        return {match: { [`items.item_type`]: item_type }}
    });

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

    // use match_phrase query for single terms that contain multiple words (terms from request data that were enclosed in double quotes) TODO: find a better way to detect multi word terms
    if(terms.indexOf('\\ ') > 0) {
        queryType = "match_phrase";
        terms = terms.replace('\\', '')
    }
    // use match query for all other terms
    else {
        queryType = "match";
    }

    // add top level document and nested document index fields
    searchFields = SEARCH_FIELDS.map((field) => {
        return {
            [queryType]: {
                [field]: terms
            }
        }
    });
    nestedSearchFields = SEARCH_FIELDS.map((field) => {
        return {
            [queryType]: {
                [`items.${field}`]: terms
            }
        }
    });

    // add the facet query (top level and nested documents) - one match query for each selected facet item (selected filter value)
    if(facets) {
        for(let key in facets) {

            let values = facets[key];
            if(typeof values != "object") values = [values];

            for(let value of values) {
                facetQuery.push({
                    match: {
                        [`${key}.keyword`]: value
                    }
                });

                nestedFacetQuery.push({
                    match: {
                        [`items.${key}.keyword`]: value
                    }
                });
            }
        }
    }

    // build the main search query object (top level and nested documents) This query is included eith the 'itemTypes' query in a 'should' clause in the top level query object. This allows the search to return results that match either the top level document or the nested document.
    let mainQuery = [
        {
            bool: {
                must: [
                    {bool: {should: itemTypes}},
                    {bool: {should: searchFields}},

                    {bool: {must: [
                        {match: {"is_published": 1}}
                    ]}}
                ],
                filter: facetQuery
            }
        },
        {
            nested: {
                path: "items",
                query: {
                    bool: {
                        must: [
                            {bool: {should: nestedItemTypes}},
                            {bool: {should: nestedSearchFields}},

                            {bool: {must: [
                                {match: {"items.is_published": 1}}
                            ]}}
                        ],
                        filter: nestedFacetQuery                    
                    }
                },
                inner_hits: {
                    "size": MAX_NESTED_ITEMS_RESULTS
                } 
            }
        }
    ]

    // build the elastic request "query" object - this object is added directly to the "query" field of the elastic search request data
    queryData = {
        bool: {
            must: [
                {bool: {should: objectTypes}},
                {bool: {should: mainQuery}},
            ],
        }
    };

    // build aggregation data object
    for(let {field, path} of AGGREGATION_FIELDS_ITEM) {
        aggsData[field] = {
            terms: { 
                field: path,
                size: MAX_AGGREGATION_COUNT
            }
        }
    }

    // Add sort field if sort value is present
    if(sort) {
        let [field, value] = sort;

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

    // add the parent exhibit aggregation field to the aggs object
    aggsData['is_member_of_exhibit'] = {
        terms: {
            field: "is_member_of_exhibit.keyword",
            size: MAX_AGGREGATION_COUNT
        }
    }

    try {
        // execute the search (the elastic module query() function handles top level and nested documents and returns a flat list of results)
        resultsData = await ELASTIC.query(queryData, sortData, page, aggsData, "items");
    }
    catch(error) {
        LOGGER.module().error(`Error searching index. Elastic response: ${error}`);
    }

    try {
        // add repository data to the result (repository item results)
        resultsData.results = await Promise.all(resultsData.results.map(async (result) => {
            if(result.is_repo_item) {
                result = {
                    ...result, 
                    repository_data: await REPO_SERVICE.importItemData({repositoryItemId: result.media}),
                    thumbnail:       getRepositoryThumbnailUri(result.media),
                    media:           getRepositoryResourceUri(result.media),
                };
            }
            return result;
        }));
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving repository item data for search results: ${error}`);
    }

    try {
        // add parent exhibit title to the result (item results)
        resultsData.results = await Promise.all(resultsData.results.map(async (result) => {
            return {
                ...result,
                parent_exhibit_title: await ELASTIC.get(result.is_member_of_exhibit).then((exhibit) => {
                    return exhibit.title;
                }).catch((error) => {
                    LOGGER.module().error(`Error retrieving parent exhibit title for result: ${result.uuid}. Error: ${error}`);
                    return undefined;
                })
            }
        }));
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving parent exhibit title data for search results: ${error}`);
    }

    try {
        // add additional fields to the aggregations data (parent exhibit title for item results)
        resultsData.aggregations.is_member_of_exhibit = await Promise.all(resultsData.aggregations.is_member_of_exhibit.map(async (agg) => {
            let exhibit = await ELASTIC.get(agg.key);
            return {
                ...agg,
                display: exhibit.title
            }
        }));
    }
    catch(error) {
        LOGGER.module().error(`Error retrieving parent exhibit title data for search result aggregations: ${error}`);
    }

    return resultsData;
}
