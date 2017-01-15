var http = require('http');
var express = require('express');
var cool_faces = require('cool-ascii-faces');

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    res.end(cool_faces());
});

app.use((req, res, next) => {
    res.end('404!');
});

var server = http.createServer(app).listen(process.env.PORT || 3000);
console.log('server has started! :>');