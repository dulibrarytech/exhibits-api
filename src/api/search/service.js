'use strict'

const util = require('util');
const Elastic = require('../../libs/elastic_search');
const Logger = require('../../libs/log4js');
// const Settings = require('../../config/settings');
const Configuration = require('../../config/configuration');
const {getRepositoryThumbnailUri} = require('../repository/helper');

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

    // let {
    //     OBJECT_TYPES,
    //     ITEM_TYPES,
    //     SEARCH_FIELDS,
    //     AGGREGATION_FIELDS_ITEM
    // } = Settings;

    // TODO: move to settings
    // object types to include in the search
    const OBJECT_TYPES = ["exhibit", "item", "grid", "vertical_timeline", "vertical_timeline_2"];

    // item types to include in search
    const ITEM_TYPES = ["image", "large_image", "audio", "video", "pdf"];

    // fulltext search fields
    const SEARCH_FIELDS = ["title", "description", "text", "caption", "item_subjects"];
    
    // fields to aggregate in search results
    const AGGREGATION_FIELDS_ITEM = [
        {
            "name": "item_type",
            "field": "item_type.keyword"
        },
        {
            "name": "type",
            "field": "type.keyword"        
        },
        {
            "name": "subject",
            "field": "item_subjects.keyword"
        },
    ];

    const MAX_NESTED_ITEMS_RESULTS = 100;
    // END move to settings

    // object type (top level only (should))
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

    // match item type (top level and nested)
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

    // TODO find a better way to detect multi word terms
    if(terms.indexOf('\\ ') > 0) {
        queryType = "match_phrase";
        terms = terms.replace('\\', '')
    }
    else {
        queryType = "match";
    }

    // add top level index fields
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

    if(facets) {
        for(let key in facets) {
            facetQuery.push({
                term: {
                    [`${key}`]: facets[key]
                }
            });

            nestedFacetQuery.push({
                term: {
                    [`items.${key}`]: facets[key]
                }
            });
        }
    }

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
    /*
     * end main query
     */

    // build search query object
    queryData = {
        bool: {
            must: [
                {bool: {should: objectTypes}},
                {bool: {should: mainQuery}},
            ],
        }
    };

    // add the item aggregation fields to the main query
    for(let {name, field} of AGGREGATION_FIELDS_ITEM) {
        aggsData[name] = {
            terms: { field }
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

    try {
        if(Configuration.nodeEnv == 'development') {
            let objectStructure = util.inspect(queryData, {showHidden: false, depth: null});
            Logger.module().info('INFO: ' + `Search query object (top level): ${objectStructure}`);
        }
        
        // execute the search for top level documents
        resultsData = await Elastic.query(queryData, sortData, page, aggsData);

        // add the aggs bucket for exhibits
        let exhibitAggs = {
            is_member_of_exhibit: []
        };

        // add the exhibits to the aggregation data
        for(let {type, is_member_of_exhibit} of resultsData.results) {
            if(type == "exhibit") continue;

            let exhibitAgg = exhibitAggs.is_member_of_exhibit.find(({key}) => {
                return key == is_member_of_exhibit;
            })

            if(!exhibitAgg) {
                exhibitAggs.is_member_of_exhibit.push({
                    key: is_member_of_exhibit,
                    display: "",
                    doc_count: 1
                })
            }
            else {
                exhibitAgg.doc_count++;
            }
        }

        // sort the exhibit aggregations by count descending
        exhibitAggs.is_member_of_exhibit = exhibitAggs.is_member_of_exhibit.sort((a, b) => {
            return b.doc_count - a.doc_count;
        })

        // get the exhibit title
        for(let agg of exhibitAggs.is_member_of_exhibit) {
            let exhibit = await Elastic.get(agg.key);
            agg.display = exhibit.title;
        }

        // add repository thumbnail uri "thumbnail" field if the field has not been set
        resultsData.results = resultsData.results.map((result) => {
            if(result.is_repo_item && !result.thumbnail) {
                return {...result, thumbnail: getRepositoryThumbnailUri(result.media)};
            }
            else {
                return result;
            }
        });

        // append the exhibit aggregations to the main aggregations
        resultsData.aggregations = {...resultsData.aggregations, ...exhibitAggs}

    }
    catch(error) {
        Logger.module().error(`Error searching index. Elastic response: ${error}`);
    }

    return resultsData;
}
