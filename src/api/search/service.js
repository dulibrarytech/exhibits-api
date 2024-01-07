'use strict'

const Elastic = require('../../libs/elastic_search');

exports.index = async (terms, facets) => {
    let results = null;

    const DEFAULT_FILTERS = [
        {match: {type: "exhibit"}},
        {match: {type: "item"}}
    ]
    
   try {
        results = await Elastic.query({
            bool: {
                must: [

                    // fulltext search fields
                    {
                        bool: {
                            should: [
                                {match: { "title": terms }},
                                {match: { "description": terms }},
                                {match: { "text": terms }}
                            ]
                        }
                    },

                    // apply default filters
                    {
                        bool: {should: DEFAULT_FILTERS}
                    }   
                ]
            },
        }, facets);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    return results;
}

exports.exhibit = async (terms, facets, exhibitId) => {
    let results = null;

    const DEFAULT_FILTERS = [
        {match: {type: "exhibit"}},
        {match: {type: "item"}}
    ]
    
    try {
        results = await Elastic.query({
            bool: {
                must: [

                    // fulltext search fields
                    {
                        bool: {
                            should: [
                                {match: { "title": terms }},
                                {match: { "description": terms }},
                                {match: { "text": terms }}
                            ]
                        }
                    },

                    // apply default filters
                    {
                        bool: {should: DEFAULT_FILTERS}
                    }, 

                    // apply exhibit id
                    {
                        bool: {filter: {term: {"is_member_of_exhibit": exhibitId}}}
                    }
                ]
            },
        }, facets);
    }
    catch(error) {
        console.log(`Error searching index. Elastic response: ${error}`);
    }

    return results;
}
