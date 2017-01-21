var MongoClient  = require('mongodb').MongoClient;
var mongoUrl = 'mongodb://heroku_wfqz3rhs:a5eo33ctgfb7a963a3p4vrl2jc@ds117199.mlab.com:17199/heroku_wfqz3rhs';

module.exports.findByLogin = async function(login) {
    try {
        var db = await MongoClient.connect(mongoUrl);
        var user = await db.collection('users').find({login: login}).limit(1).next();

        await db.close();
        return user;
    } catch (err) {
        console.log(err);
        throw err;    
    }
};

module.exports.findAll = async function() {
    try {
        var db = await MongoClient.connect(mongoUrl);
        var user = await db.collection('users').find().toArray();

        await db.close();
        return user;
    } catch (err) {
        console.log(err);
        throw err;
    }
};