'use strict'

const Search = require('./service');

exports.searchIndex = async (req, res) => {
    let terms = req.query.q ? req.query.q.replace(/,/g, ' ').toLowerCase() : null;
    let facets = req.query.f || null;
    let sort = req.query.sort ? req.query.sort.split(',') : null;
    let page = req.query.page ?? null;
    let type = req.query.type ?? null;
    let exhibitId = req.query.exhibitId || null;
    let results = [];

    if(terms) {
        results = await Search.index(terms, type, facets, sort, page, exhibitId);
        if(!results) res.sendStatus(500);
        else res.send(results);
    }
    else res.sendStatus(400);
}