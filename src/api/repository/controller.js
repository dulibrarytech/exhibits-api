'use strict'

const Repository = require('./service');
const Logger = require('../../libs/log4js');

exports.getData = async (req, res) => {
    let data = {};
    let itemId = req.params.id || null;

    Logger.module().info(`GET /repository/data/${itemId}`);
    
    data = await Repository.getItemData(itemId);
    if(!data) res.status(500);
    res.send(data);
}

exports.search = async (req, res) => {
    let results = [];
    let queryString = req.body.queryString || null;

    Logger.module().info(`GET /repository/search`);

    results = await Repository.search(queryString);
    if(!results) res.status(500);
    res.send(results);
}

exports.fetchSourceFile = async (req, res) => {
    let response = {
        filename: "null"
    };

    let repositoryItemId = req.params.id;

    let {
        exhibitItemId = null,
        fileExtension = null

    } = req.body;

    Logger.module().info(`GET /repository/source/fetch/${repositoryItemId}`);

    if(!exhibitItemId || !fileExtension) {
        res.status(400);
    }
    else {
        response = await Repository.fetchSourceFile(repositoryItemId, exhibitItemId, fileExtension);
        if(!response.status) res.status(500);
    }

    res.send(response);
}