// -- Imports -- //
var http         = require('http');
var express      = require('express');
var session      = require('express-session');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore   = require('connect-mongo')(session);
var crypto       = require('crypto');

// -- Repositories -- //

var userRepository = require('./repositories/userRepository');
var productRepository = require('./repositories/productRepository');

// -- Setup -- //

var mongoUrl = 'mongodb://heroku_wfqz3rhs:a5eo33ctgfb7a963a3p4vrl2jc@ds117199.mlab.com:17199/heroku_wfqz3rhs';
var secretString = '2a6f51a3513b4cb8b7087faffdef27d0';

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cookieParser(secretString));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: secretString,
    store: new MongoStore({ url: mongoUrl }),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000*60*60 }
}));

app.use(express.static('./static'));

// -- Views -- //

app.get('/', (req, res) => {
    res.end('GREEDY BISHOP WELCOMES');
});

app.get('/login', (req, res) => {
    if (req.signedCookies.authcookie) {
        res.redirect('/');
    }

    res.render('login');
});

app.post('/login', (req, res) => {
    var login = req.body.login;
    var password = req.body.password;

    userRepository.findByLogin(login).then((user) => {        
        if (!req.query.returnUrl) {
            req.query.returnUrl = '/';
        }

        sha256 = crypto.createHash('sha256');
        sha256.update(password);
        hashedPassword = sha256.digest('hex');

        if (user && user.password == hashedPassword) {
            res.cookie('authcookie', {login: login, role: user.role}, {signed: true, maxAge: 1000 * 60 * 60})           
            res.redirect(req.query.returnUrl);
        } else {
            res.render('login', {message: 'Zły login lub hasło.'});
        }
    }).catch((err) => {
        res.render('login', {message: `Zapytanie do bazy danych zawiodło. (${err})`});
    })
});

app.get('/register', (req, res) => {
    if (req.signedCookies.authcookie) {
        res.redirect('/');
    }

    res.render('register');
});

app.get('/test', (req, res) => {
    userRepository.add('abc', 'cba').then((sth) => {
        console.log(sth.insertedCount);
        res.end(JSON.stringify(sth.insertedCount) + '1');
    }).catch((err) => {
        res.end(JSON.stringify(err) + '2');
    })
});

app.post('/register', (req, res) => {
    var login = req.body.login;
    var password = req.body.password;

    userRepository.findByLogin(login).then((user) => {        
        if (user != null) {
            res.render('register', { message: 'Użytkownik o takim loginie już istnieje.'});
        }
    }).catch((err) => {
        res.render('register', {message: `Zapytanie do bazy danych zawiodło. (${err})`});
    })

    sha256 = crypto.createHash('sha256');
    sha256.update(password);
    hashedPassword = sha256.digest('hex');

    userRepository.add(login, hashedPassword).then(() => {
        res.render('register', { message: 'Pomyślnie utworzono konto.' });
    }).catch((err) => {
        res.render('register', { message: `Zapytanie do bazy danych zawiodło. (${err})`});
    });
});

app.get('/cart', authorizeUser, (req, res) => {
    if (!req.session.cart)
        req.session.cart = {};

    var prods = Object.keys(req.session.cart).map(key => {
        var cnt = req.session.cart[key];
        var prod = products_db[key]
        prod.quantity = cnt;
        return prod;
    });

    res.render('cart', { products: prods });
})

app.post('/add_to_cart/:id', authorizeUser, (req, res) => {
    if (!req.session.cart)
        req.session.cart = {};

    console.log(product.name + ' added to cart');
    if (!req.session.cart[req.params.id])
        req.session.cart[req.params.id] = 1;
    else
        req.session.cart[req.params.id] += 1;

    console.log(req.session.cart);
    res.redirect('/products');
});

// -- Auth functions -- //

function authorizeUser(req, res, next) {
    if (!req.signedCookies.authcookie) {
        res.redirect('/login?returnUrl=' + req.url);
    } else {
        next();
    }
}

function authorizeAdmin(req, res, next) {
    if (req.signedCookies.authcookie.role !== 'admin') {
        res.redirect('/login?returnUrl=' + req.url);
    } else {
        next();
    }
}

// -- 404 -- //

app.use((req, res, next) => {
    res.end('404');
});

// -- http server -- //

var server = http.createServer(app).listen(process.env.PORT || 3000);
console.log('server started');