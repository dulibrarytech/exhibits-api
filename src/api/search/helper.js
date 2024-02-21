'use strict'

exports.getSearchResultAggregations = (aggFields, results) => {
    let aggregations = {};
    let aggCounts = {}, aggField, aggValue;

    for(let {name} of aggFields) {
        aggField = name;

        if(aggField in aggregations == false) {
            aggregations[aggField] = [];
        }

        for(let result of results) {
            aggValue = result[aggField];
            
            if(!aggCounts[aggValue]) aggCounts[aggValue] = 0;
            aggCounts[aggValue]++;
        }

        for(let key in aggCounts) {
            aggregations[aggField].push({
                key,
                doc_count: aggCounts[key]
            })
        }
    }

    return aggregations; 
}

exports.combineAggregations = (existingAggs, newAggs) => {
    let agg;
    for(let key in newAggs) {

        for(let newAgg of newAggs[key]) {
            agg = existingAggs[key].filter((topAgg) => {
                return topAgg.key == newAgg.key;
            })[0];

            if(agg) {
                agg.doc_count += newAgg.doc_count;
            }
            else {
                existingAggs[key].push(newAgg);
            }
        }
    }

    return existingAggs;
}