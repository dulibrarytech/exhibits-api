'use strict'

const { Client } = require('@elastic/elasticsearch');
const CONFIG = require('../config/configuration.js');

const RESULTS_PAGE_LENGTH = 10;
const DEFAULT_RESULTS_SIZE = 200;

let {
    elasticDomain, 
    elasticIndex

} = CONFIG;

let elastic_client;

try {
    elastic_client = new Client({
        node: elasticDomain
    });
    console.log(`Connected to Elastic cluster: ${elastic_client.name} at ${elasticDomain}`);
}
catch (error) {
    console.error(`Could not connect to Elastic cluster at ${elasticDomain}. Error: ${error}`);
}

exports.query = async (query={}, sort=null, page=1, aggs=null) => {
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
                aggregations: aggs || undefined,
            }
        });

        let {hits, aggregations = null} = elasticResponse.body;

        for(let result of hits.hits) {

            if(result.inner_hits) {
                for(let field in result.inner_hits) { // if broken revert 'field' to ['items'] key to test
                    response.resultCount += result.inner_hits[field].hits.total.value;
                    for(let innerResult of result.inner_hits[field].hits.hits) {
                        response.results.push(innerResult._source);
                    }
                }
            }

            else {
                response.resultCount = hits.total.value;
                response.results.push(result['_source']);
            }
        }

        if(aggregations) {
            response.aggregations = {};
            for(let field in aggregations) {
                response.aggregations[field] = aggregations[field].buckets;
            }
        }
    }
    catch(error) {
        console.error(error);
        throw error;
    }

    return response;
}