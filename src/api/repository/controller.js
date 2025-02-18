'use strict'

const Repository = require('./service');

exports.getData = async (req, res) => {
    let data = {};
    let itemId = req.params.id || null;
    
    data = await Repository.getItemData(itemId);
    if(!data) res.status(500);
    res.send(data);
}

exports.search = async (req, res) => {
    let results = [];
    let queryString = req.body.queryString || null;

    results = await Repository.search(queryString);
    if(!results) res.status(500);
    res.send(results);
}

exports.fetchSourceFile = async (req, res) => {
    let response = {filename: "null"}
    let repositoryItemId = req.params.id;

    let {
        exhibitItemId = null,
        fileExtension = null

    } = req.body;

    response = await Repository.verifySourceFile(repositoryItemId, exhibitItemId, fileExtension);  // DEV does not need to catch error. If error, response.status field will be false
    if(!response.status) res.status(500);

    res.send(response);
}