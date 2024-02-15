'use strict'

const { Client } = require('@elastic/elasticsearch');
const CONFIG = require('../config/configuration.js');

const RESULTS_SIZE = 10;

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

exports.query = async (query={}, sort=null, aggs=null, page=1) => {
    console.log("TEST ES search page:", page)
    let response = { results: [] };
    let size = RESULTS_SIZE;
    let from = size * (page-1);

    // console.log("TEST ES search page:", page)
    console.log("TEST ES search from:", from)
    console.log("TEST ES search size:", RESULTS_SIZE)
    
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

        console.log("TEST ES responde body:", elasticResponse.body)

        let {hits, aggregations = null} = elasticResponse.body;

        response.resultCount = hits.total.value;
        for(let result of hits.hits) {
            response.results.push(result['_source']);
        }

        //console.log("TEST ES results:", response.results)
        console.log("TEST ES results count:", response.results.length)

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