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

exports.fetchSource = async (req, res) => {
    let response = {};
    let itemId = req.params.id || "";

    let {
        fileName,
        filePath
    } = req.body;

    Logger.module().info(`GET /repository/source/fetch/${itemId}`);
    response = await Repository.storeSourceFile(itemId, fileName, filePath);
    if(!response) res.status(500);
    res.send(response);
}