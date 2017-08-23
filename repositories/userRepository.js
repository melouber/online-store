var MongoClient  = require('mongodb').MongoClient;
var mongoUrl = 'mongoDbUrl';

module.exports.findByLogin = function(login) {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('users').find({login: login}).limit(1).next().then((user) => {
                return db.close().then(() => {
                    return user;
                })
            })
        })
};

module.exports.findAll = function() {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('users').find().toArray().then((user) => {
                return db.close().then(() => {
                    return user;
                })
            })
        })
};

module.exports.add = function(login, password) {
    return MongoClient.connect(mongoUrl).then((db) => {
        return db.collection('users').insertOne({ login: login, password: password, role: 'user' }).then((res) => {
            return db.close().then(() => {
                if (res.insertedCount !== 1) {
                    throw 'User not added.';
                }
            })
        })
    })
}