/**
 * Elasticsearch interface functions
 */

'use strict'

const { Client } = require('@elastic/elasticsearch');
const CONFIG = require('../config/configuration');
const HELPER = require('./elastic_search_helper')
const Logger = require('../libs/log4js');

const RESULTS_PAGE_LENGTH = 10;
const DEFAULT_RESULTS_SIZE = 1000;

let {
    elasticDomain, 
    elasticIndex

} = CONFIG;

let elastic_client = null;

Logger.module().info(`Connecting to Elastic server at domain: ${elasticDomain}...`);

try {
    elastic_client = new Client({
        node: elasticDomain,
        tls: {
            rejectUnauthorized: false
        }
    });
}
catch (error) {
    Logger.module().error(`Could not connect to Elastic server at ${elasticDomain}. Error: ${error}`);
}

if(elastic_client) {
    elastic_client.info().then(function (response) {
        Logger.module().info(`Connected to Elastic server. Server info:`, response)

    }, function (error) {
        Logger.module().error(`Could not connect to Elastic server. Error: ${error}`);
    });
}

/**
 * get one document by id
 * 
 * @param {*} documentId 
 * @returns 
 */
exports.get = async (documentId) => {
    let document = {};

    try {
        document = await elastic_client.get({
            index: elasticIndex,
            id: documentId
        });
    }
    catch(error) {
        Logger.module().error(`Elastic error: ${error}`);
        throw error;
    }
    return document._source || {};
}

/**
 * 
 * @param {*} field 
 * @param {*} terms 
 * @param {*} nested 
 * @returns 
 */
exports.fieldSearch = async (field, terms, nested = null) => {
    let response = {};

    try {
        let queryData = {
            "bool": {
                "should": [
                    {
                        "match": {
                            [field]: terms
                        }
                    }
                ]
            }
        }

        if(nested) {
            let nestedField = `${nested}.${field}`;
            queryData.bool.should.push({
                "nested": {
                    "path": nested,
                    "query": {
                        "match": {
                            [nestedField]: terms
                        }
                    }
                }
            });
        }

        let data = {
            index: elasticIndex,
            body: {
                query: queryData
            }
        }

        let elasticResponse = await elastic_client.search(data);

        if(elasticResponse.hits.total.value > 0) {
            response = elasticResponse.hits.hits[0]._source;
        }
        else {
            Logger.module().info(`Elastic field search returned no results. Terms: ${terms}`);
        }

        return response;
    }
    catch(error) {
        Logger.module().error(`Elastic error: ${error}`);
        throw error;
    }
}

/**
 * custom elastic search engine for the exhibits app data model
 * 
 * performs a document level search and a nested object search
 * combines document level results with nested object results
 * combines all aggregations from the results into one object
 * omits results that contain a nested field
 * 
 * expects nested objects to be in the field 'items[]' 
 * 
 * @param {*} query 
 * @param {*} sort 
 * @param {*} page 
 * @param {*} aggs 
 * @returns 
 */
exports.query = async (query={}, sort=null, page=null, aggs=null) => {
    let queryResponse = { 
        results: [], 
        resultCount: 0 
    };

    let size = page ? RESULTS_PAGE_LENGTH : DEFAULT_RESULTS_SIZE;
    let from = page ? size * (page-1) : 0;

    try {
        let elasticResponse = await elastic_client.search({
            index: elasticIndex,
            body: {
                size,
                from,
                query,
                sort: sort || undefined,
                aggregations: aggs || undefined,
            }
        });

        let {results, aggregations = null} = HELPER.addNestedResultsAggregations(elasticResponse, "items");

        queryResponse.resultCount = results.length;
        queryResponse.results = results;

        if(aggregations) {
            if(!queryResponse.aggregations) queryResponse.aggregations = {};
            for(let field in aggregations) {
                queryResponse.aggregations[field] = aggregations[field].buckets;
            }
        }
    }
    catch(error) {
        Logger.module().error(`Elastic search query error: ${error}`);
        throw error;
    }

    queryResponse.results = queryResponse.results.sort((a, b) => {
        return b.score - a.score;
    });

    return queryResponse;
}

/**
 * fetch multiple documents by query
 * 
 * @param {*} query 
 * @param {*} sort 
 * @param {*} page 
 * @returns 
 */
exports.fetch = async (query={}, sort=null, page=null) => {
    let response = { results: [], resultCount: 0 };
    let size = page ? RESULTS_PAGE_LENGTH : DEFAULT_RESULTS_SIZE;
    let from = page ? size * (page-1) : 0;

    try {
        let elasticResponse = await elastic_client.search({
            index: elasticIndex,
            body: {
                size,
                from,
                query,
                sort: sort || undefined,
            }
        });

        let {hits} = elasticResponse;

        for(let result of hits.hits) {
            response.results.push({...result._source, score: result._score});
        }
    }
    catch(error) {
        Logger.module().error(`Elastic search query error: ${error}`);
        throw error;
    }

    return response;
}