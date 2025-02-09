'use strict'

const Exhibit = require('./service');

exports.getExhibits = async (req, res) => {
    let data = [];    
    data = await Exhibit.getAll();
    if(!data) res.status(500);
    res.send(data);
}

exports.getExhibit = async (req, res) => {
    let id = req.params.id || null;
    let data = {};
    data = await Exhibit.get(id);
    if(!data) res.status(500);
    res.send(data);
}

exports.getExhibitItems = async (req, res) => {
    let id = req.params.id;
    let data = [];
    data = await Exhibit.getItems(id);
    if(!data) res.status(500);
    res.send(data);
}