'use strict'

const { Client } = require('@elastic/elasticsearch');
const CONFIG = require('../config/configuration.js');
const fs = require('fs');
const Logger = require('../libs/log4js');

const RESULTS_PAGE_LENGTH = 10;
const DEFAULT_RESULTS_SIZE = 200;

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
            //ca: fs.readFileSync( "pathtocert" ) // TODO get from env
            rejectUnauthorized: false
        }
    });
}
catch (error) {
    Logger.module().error(`Could not connect to Elastic cluster at ${elasticDomain}. Error: ${error}`);
}

if(elastic_client) {
    elastic_client.info().then(function (response) {
        Logger.module().info(`Connected to Elastic server. Server info:`, response)

    }, function (error) {
        Logger.module().error(`Could not connect to Elastic server. Error: ${error}`);
    });
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

        let {hits, aggregations = null} = elasticResponse;

        for(let result of hits.hits) {

            // If inner_hits are present, add the inner results to the main results set
            if(result.inner_hits) {
                for(let field in result.inner_hits) {
                    response.resultCount += result.inner_hits[field].hits.total.value;
                    for(let innerResult of result.inner_hits[field].hits.hits) {
                        response.results.push(innerResult._source);
                    }
                }
            }

            // Push the top level result to the results set
            else {
                response.resultCount = hits.total.value;
                response.results.push(result['_source']);
            }
        }

        if(aggregations) {
            if(!response.aggregations) response.aggregations = {};
            for(let field in aggregations) {
                response.aggregations[field] = aggregations[field].buckets;
            }
        }
    }
    catch(error) {
        Logger.module().error(`Elastic error: ${error}`);
        throw error;
    }

    return response;
}