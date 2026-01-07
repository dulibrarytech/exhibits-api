/**
 * 
 * Combines the nested results (inner_hits) aggregation buckets and document counts with the main aggregations buckets and document counts
 * 
 * @param {*} elasticResponse - Elastic api query response object
 * @param {*} nestedField - The nested index field (code update required for multiple nested fields)
 * 
 * @typedef {Object} CombinedResults
 * @property {Array} results - Top level and nested search results
 * @property {Array} aggregations - Top level and nested aggregations
 * 
 * @returns {CombinedResults} - Combined search results and aggregations of both top-level and nested queries
 */
var _ = require('lodash');

exports.addNestedResultsAggregations = (elasticResponse, nestedField) => {
  let {hits, aggregations = null} = elasticResponse;

  let results = []
  for(let result of hits.hits) {

    // check if there are inner_hits present on this search result
    if(_.get(result, ['inner_hits', nestedField, 'hits', 'total', 'value']) > 0) {

        for(let field in result.inner_hits) {

            for(let innerResult of _.get(result, ['inner_hits', field, 'hits', 'hits'])) {
                // push the inner result for each field to the top level results
                results.push({
                    container_uuid: result._source.uuid,
                    score: innerResult._score,
                    ...innerResult._source, 
                });

                // create an agg bucket for each agg field in the top level search, and push it if the field is present in the nested result
                for(let aggField in aggregations) {

                    let field = _.get(innerResult, ['_source', aggField]);
                    if(!field) continue;

                    if(typeof field != "object") field = [field];
                    for(let value of field) {

                        // find the bucket for this aggregation field if it exists
                        let bucket = aggregations[aggField].buckets.find((bucket) => {
                            return bucket.key == value;
                        })

                        if(bucket) {
                            // increment the nested aggregation bucket count
                            bucket.doc_count++;
                        }
                        else {
                            // create a new bucket for the aggregation field if it does not exist
                            aggregations[aggField].buckets.push({
                                key: value,  
                                doc_count: 1
                            })
                        }
                    }
                }
            }
        }
    }

    // Push the top level result to the results set if it is not a container item
    else if(result._source[nestedField] == undefined) {
        results.push({
            score: result._score,
            ...result._source,
        });
    }
  }

  return {results, aggregations}
}