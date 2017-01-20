// -- Imports --
var http = require('http');
var express = require('express');
var session = require('express-session');

// -- Setup -- 
var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
        store: new FileStore,
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

var users_db = {
    'mat': 'mati',
    'jul': 'juli'
}

// -- Views --

app.get('/', (req, res) => {
    res.render('products');
    res.end();
});

app.get('/products_in', (req, res) => {
    res.render('products_in');
    res.end();
});

app.post('/login', (req, res) => {
    console.log('login : ' + req.body.login);
    console.log('pass  : ' + req.body.pass);
    
    if (users_db[req.body.login] == req.body.pass) {
        res.cookie('user', req.body.login);
		res.redirect('/products_in');
    }
    else
        res.send("Login and pass don't match");
})

app.use((req, res, next) => {
    res.end('404');
});

var server = http.createServer(app).listen(process.env.PORT || 3000);
console.log('server started');