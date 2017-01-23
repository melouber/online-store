var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var ObjectId = mongo.ObjectID;
var mongoUrl = 'mongodb://heroku_wfqz3rhs:a5eo33ctgfb7a963a3p4vrl2jc@ds117199.mlab.com:17199/heroku_wfqz3rhs';

module.exports.findAll = function() {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('products').find().toArray().then((products) => {
                return db.close().then(() => {
                    return products;
                })
            })
        })
};

module.exports.findById = function(id) {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('products').find({_id: new ObjectId(id)}).limit(1).next().then((product) => {
                return db.close().then(() => {
                    return product;
                })
            })
        })
};

module.exports.delete = function(id) {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('products').deleteOne({_id: new ObjectId(id)}).then((res) => {
                return db.close().then(() => {
                    if (res.deletedCount !== 1)
                        throw 'Product not deleted'
                })
            })
        })
};

module.exports.add = function(name, price, description) {
    return MongoClient.connect(mongoUrl).then((db) => {
        return db.collection('products').insertOne({ name: name, price: price, description: description }).then((res) => {
            return db.close().then(() => {
                if (res.insertedCount !== 1) {
                    throw 'Product not added.';
                }
            })
        })
    })
}

module.exports.edit = function(id, name, price, description) {
    return MongoClient.connect(mongoUrl).then((db) => {
        return db.collection('products').updateOne({_id: new ObjectId(id)}, {$set: { name: name, price: price, description: description }}).then((res) => {
            return db.close().then(() => {
                if (res.matchedCount !== 1) {
                    throw 'Product not modified.';
                }
            })
        })
    })
}