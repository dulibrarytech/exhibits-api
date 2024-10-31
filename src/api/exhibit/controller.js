'use strict'

const Exhibit = require('./service');
const Logger = require('../../libs/log4js');

exports.getExhibits = async (req, res) => {
    let data = [];
    
    Logger.module().info(`GET /exhibit`);
    data = await Exhibit.getAll();
    if(!data) res.status(500);
    res.send(data);
}

exports.getExhibit = async (req, res) => {
    let id = req.params.id || null;
    let data = {};

    Logger.module().info(`GET /exhibit/${id}`);
    data = await Exhibit.get(id);
    if(!data) res.status(500);
    res.send(data);
}

exports.getExhibitItems = async (req, res) => {
    let id = req.params.id;
    let data = [];

    Logger.module().info(`GET /exhibit/${id}/items`);
    data = await Exhibit.getItems(id);
    if(!data) res.status(500);
    res.send(data);
}