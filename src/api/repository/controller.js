'use strict'

const Repository = require('./service');

exports.data = async (req, res) => {
    let data = {};
    let itemId = req.params.id || null;
    
    data = await Repository.getItemData(itemId);
    if(!data) res.sendStatus(500);
    else res.send(data);
}

exports.search = async (req, res) => {
    let results = [];
    let queryString = req.body.queryString || null;

    results = await Repository.search(queryString);
    if(!results) res.sendStatus(500);
    else res.send(results);
}

exports.item = async (req, res) => {
    let response = {filename: "null"}
    let itemId = req.params.id;

    let {
        exhibitItemId = null
    } = req.body;

    response = await Repository.getItemResource({itemId, exhibitItemId});
    if(response.error) res.sendStatus(500)
    else res.send(response);
}