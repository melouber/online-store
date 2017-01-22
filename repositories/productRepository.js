var MongoClient  = require('mongodb').MongoClient;
var mongoUrl = 'mongodb://heroku_wfqz3rhs:a5eo33ctgfb7a963a3p4vrl2jc@ds117199.mlab.com:17199/heroku_wfqz3rhs';

module.exports.findAll = function() {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('products').find().toArray().then((product) => {
                return db.close().then(() => {
                    return product;
                })
            })
        })
};