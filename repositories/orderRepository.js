var MongoClient = require('mongodb').MongoClient;
var mongoUrl = 'mongodb://heroku_wfqz3rhs:a5eo33ctgfb7a963a3p4vrl2jc@ds117199.mlab.com:17199/heroku_wfqz3rhs';

module.exports.findAllPlaced = function() {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('orders').find().toArray().then((orders) => {
                return db.close().then(() => {
                    return orders.map((order) => { return {login: order.login, cart: JSON.parse(order.cart)}});
                })
            })
        })
};

module.exports.findAllPending = function() {
    return MongoClient.connect(mongoUrl).then((db) => {
            return db.collection('sessions').find().toArray().then((sessions) => {
                return db.close().then(() => {
                    var result = []
                    sessions.map((session) => {
                        var parsed = JSON.parse(session.session)
                        if (parsed.cart && Object.keys(parsed.cart).length > 0) {
                            result.push({login: parsed.login, cart: parsed.cart})
                        }
                    })
                    return result
                })
            })
        })
};


module.exports.add = function(login, cart) {
    return MongoClient.connect(mongoUrl).then((db) => {
        return db.collection('orders').insertOne({ login: login, cart: JSON.stringify(cart) }).then((res) => {
            return db.close().then(() => {
                if (res.insertedCount !== 1) {
                    throw 'Order not added.';
                }
            })
        })
    })
}