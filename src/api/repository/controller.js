'use strict'

const Repository = require('./service');
const Logger = require('../../libs/log4js');

exports.getData = async (req, res) => {
    let data = {};
    let id = req.params.id || null;
    
    Logger.module().info(`GET /repository/data/${id}`);
    data = await Repository.getItemData(id);
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
    let response = {}; // fields: status, message, filename
    let id = req.params.id;
    let data = req.body;

    Logger.module().info(`GET /repository/source/fetch/${id}`);
    response = await Repository.storeSourceFile(id, data);
    if(!response) res.status(500);
    res.send(response);
}