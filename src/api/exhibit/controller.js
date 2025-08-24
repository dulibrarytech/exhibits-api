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

exports.getExhibitItemResource = async (req, res) => {
    let {id, filename} = req.params;
    let verifyFile = req.query.verify || false;
    let data = [];

    if(verifyFile) {
        data = await Exhibit.resourceExists(id, filename);
        res.send(data);
    }
    else {
        // TODO stream resource file
        res.sendStatus(400);
    }
}