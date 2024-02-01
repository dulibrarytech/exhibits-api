'use strict'

const { Client } = require('@elastic/elasticsearch');
const CONFIG = require('../config/configuration.js');

const RESULTS_SIZE = 100;

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

exports.query = async (query={}, sort=null, aggs=null) => {
    let response = { results: [] };
    
    try {
        let elasticResponse = await elastic_client.search({
            index: elasticIndex,
            body: {
                size: RESULTS_SIZE,
                query,
                sort: sort || undefined,
                aggregations: aggs || undefined
            }
        });

        let {hits, aggregations = null} = elasticResponse.body;

        for(let result of hits.hits) {
            response.results.push(result['_source']);
        }

        if(aggregations) {
            response.aggregations = {};
            for(let field in aggregations) {
                response.aggregations[field] = aggregations[field].buckets;
            }
        }
    }
    catch(error) {
        throw error;
    }

    return response;
}