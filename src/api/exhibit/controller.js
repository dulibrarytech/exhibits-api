'use strict'

const Exhibit = require('./service');

exports.getExhibits = async (req, res) => {
    let key = req.query.key || null;
    let data = [];  
      
    data = await Exhibit.getExhibits(key);
    if(!data) res.sendStatus(500);
    else res.send(data);
}

exports.getExhibit = async (req, res) => {
    let id = req.params.id || null;
    let key = req.query.key || null;
    let data = {};

    data = await Exhibit.getExhibit(id, key);
    if(!data) res.sendStatus(500);
    else res.send(data);
}

exports.getExhibitItems = async (req, res) => {
    let id = req.params.id;
    let key = req.query.key || null;
    let data = [];

    data = await Exhibit.getItems(id, key);
    if(!data) res.sendStatus(500);
    else res.send(data);
}