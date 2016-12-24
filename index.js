var http = require('http');
var express = require('express');

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    res.render('index', {message: 'Hello!'});
});

app.use((req, res, next) => {
    res.end('404!');
});

var server = http.createServer(app).listen(process.env.PORT || 3000);
console.log('server has started!');