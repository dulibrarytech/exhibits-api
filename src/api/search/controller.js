'use strict'

const Search = require('./service');

// TODO middleware to sanitize query strings for ES => rem {}, []

exports.searchIndex = async (req, res) => {
    let terms = req.query.q ? req.query.q.replace(/,/g, ' ').toLowerCase() : null;
    let exhibitId = req.query.exhibitId || null;
    let results = [];

    if(terms) {
        if(exhibitId) results = await Search.exhibit(exhibitId, terms);
        else results = await Search.index(terms);
        
        if(!results) res.status(500);
    }
    else res.status(400);

    res.send(results);
}