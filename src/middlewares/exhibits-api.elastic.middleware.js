const escapeElastic = require('elasticsearch-sanitize');

const sanitizeElasticQuery = async (req, res, next) => {
    
    let queryFields = Object.keys(req.query || {});

    for (let field of queryFields) {
        if(typeof req.query[field] == 'string') {
            req.query[field] = escapeElastic(req.query[field]).replace(/\\-/g, "-");
        }
        else {
            
            for(let index in req.query[field]) {
                let queryValue = req.query[field][index];

                if(typeof queryValue == "string") {
                    queryValue = escapeElastic(req.query[field][index]).replace(/\\-/g, "-");
                }
                else {
                    for(let index of queryValue) {
                        index = escapeElastic(index).replace(/\\-/g, "-");
                    }
                    req.query[field][index] = queryValue;
                }
            }
        }
    }

    let paramFields = Object.keys(req.params || {});
    for (let field of paramFields) {
        if(typeof req.params[field] == 'string') {
            req.params[field] = escapeElastic(req.params[field]);
        }
        else {
            for(let index in req.params[field]) {
                req.params[field][index] = escapeElastic(req.params[field][index]);
            }
        }
    }
        
    next();
}
  
module.exports = {
    sanitizeElasticQuery
};