'use strict'

const Search = require('./service');

exports.searchIndex = async (req, res) => {
    let terms = req.query.q ? req.query.q.replace(/,/g, ' ').toLowerCase() : null;
    let facets = req.query.f || null;
    let sort = req.query.sort ? req.query.sort.split(',') : null;
    let exhibitId = req.query.exhibitId || null;
    let results = [];

    if(terms) {
        results = await Search.index(terms, facets, sort, exhibitId);
        if(!results) res.status(500);
    }
    else res.status(400);

    res.send(results);
}