// -- Imports -- //
var http         = require('http');
var express      = require('express');
var session      = require('express-session');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore   = require('connect-mongo')(session);
var assert       =  require('assert');

var userRepository = require('./repositories/userRepository');
var productRepository = require('./repositories/productRepository');

// -- Setup -- //
var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cookieParser('2a6f51a3513b4cb8b7087faffdef27d0'));
app.use(bodyParser.urlencoded({extended: true}));

var mongoUrl = 'mongodb://heroku_wfqz3rhs:a5eo33ctgfb7a963a3p4vrl2jc@ds117199.mlab.com:17199/heroku_wfqz3rhs';
app.use(session({
    secret: '2a6f51a3513b4cb8b7087faffdef27d0',
    store: new MongoStore({ url: mongoUrl }),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000*60*60 }
}));

app.use(express.static('./static'));

// -- Helpers -- //

var getValues = obj => {
    values = [];
    Object.keys(obj).forEach(key => values.push(obj[key]));
    return values;
}

// -- DB Mockups -- //

var users_db = {
    'mat': 'mati',
    'jul': 'juli'
}

var products_db = {
    '1' : { id: 1, name: 'Bloody Mary', price: 3, description: 'Dobra woda' },
    '2' : { id: 2, name: 'Martini', price: 5, description: 'Zla woda' },
    '3' : { id: 3, name: 'Scotch', price: 10, description: 'Ok woda' }
}

var products_arr = getValues(products_db);

// -- Views -- //

app.get('/add', async (req, res) => {
    users = await productRepository.findAll();
    res.end(JSON.stringify(users));
});


app.get('/', (req, res) => {
    res.end('GREEDY BISHOP WELCOMES');
});

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/cart', auth, (req, res) => {
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

app.post('/add_to_cart/:id', auth, (req, res) => {
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

app.post('/login', (req, res) => {
    console.log('login : ' + req.body.login);
    console.log('pass  : ' + req.body.pass);
    
    if (users_db[req.body.login] == req.body.pass) {
        res.cookie('user', req.body.login);
		res.redirect('/products_in');
    }
    else {
        res.render('login', { locals : { message : "Login and pass don't match" } });
    }
})

function auth(req, res, next) {
    if ( req.cookies.user ) {
        console.log(req.cookies.user);
        req.user = req.cookies.user; 
        next();
    } else {
        req.session.lastSite = req.url;
        res.redirect('/login'); 
    }
}

app.use((req, res, next) => {
    res.end('404');
});

var server = http.createServer(app).listen(process.env.PORT || 3000);
console.log('server started');