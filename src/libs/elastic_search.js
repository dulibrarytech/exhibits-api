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
    let response = { results: [] };
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

        response.resultCount = hits.total.value;
        for(let result of hits.hits) {
            response.results.push(result['_source']);
        }

        // console.log("TEST results:", response.results)
        // console.log("TEST response:", elasticResponse.body)
        // console.log("TEST result count:", response.resultCount)

        if(aggregations) {
            response.aggregations = {};
            for(let field in aggregations) {
                response.aggregations[field] = aggregations[field].buckets;
            }
        }
        
        /////
        // TEST - output the internal subqueries
        ///////
        for(let agg in response.aggregations) {
            console.log("TEST ES agg:", agg)
            console.log("TEST ES agg items:", response.aggregations[agg])
        }
        /////
        // end TEST
        ///////
    }
    catch(error) {
        throw error;
    }

    return response;
}