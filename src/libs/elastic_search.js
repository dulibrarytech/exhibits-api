'use strict'

const { Client } = require('@elastic/elasticsearch');
const CONFIG = require('../config/configuration.js');

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

exports.query = async (query={}, facets=null) => {
    let data = [];

    // TODO build aggs from facets
    
    let response = await elastic_client.search({
        index: elasticIndex,
        body: {
            query

            // TODO aggs 
        }
    });

    let results = response.body.hits.hits;

    data = results.map(function(result){
        return result['_source']; 
    });

    return data || [];
}