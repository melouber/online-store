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

var appendUser = (req, model) => {
    var cookie = req.signedCookies.authcookie;
    if (cookie)
        model.user = { login : cookie.login, role : cookie.role };
    return model;
}

var appendMessage = (req, model) => {
    if (req.session.msg) {
        model.message = req.session.msg;
        delete req.session['msg'];    
    }

    return model;
}

app.get('/', (req, res) => {
    var model = appendUser (req, { products : {} });
    model = appendMessage (req, model);

    productRepository.findAll().then(prods => {
        // console.log(prods);

        model.products = prods;
        
        res.render('products', model);
    }).catch((err) => {
        model.message = `Zapytanie do bazy danych zawiodło. (${err})`;
        res.render('products', model);
    });
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

app.get('/logout', (req, res) => {
    if (req.signedCookies.authcookie) {
        res.cookie('authcookie', {}, {signed: true, maxage: 0});   
        req.session.msg = `Wylogowano`;
    }

    res.redirect('/');
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
    });

    sha256 = crypto.createHash('sha256');
    sha256.update(password);
    hashedPassword = sha256.digest('hex');

    userRepository.add(login, hashedPassword).then(() => {
        res.render('register', { message: 'Pomyślnie utworzono konto.' });
    }).catch((err) => {
        res.render('register', { message: `Zapytanie do bazy danych zawiodło. (${err})`});
    });
});

app.post('/search', (req, res) => { 
    var srch = req.body.search_field.toLowerCase();
    var model = appendUser (req, { products : {} });
    model = appendMessage (req, model);

    productRepository.findAll().then(prods => {

        model.products = prods.filter(prod => 
            prod.name.toLowerCase().indexOf(srch) > -1 || 
            prod.description.toLowerCase().indexOf(srch) > -1);
        
        res.render('products', model);
    }).catch((err) => {
        model.message = `Zapytanie do bazy danych zawiodło. (${err})`;
        res.render('products', model);
    });
});

app.get('/cart', authorizeUser, (req, res) => {
    if (!req.session.cart)
        req.session.cart = {};

    productRepository.findAll().then(prods => {
        var total = 0;

        var cart_products = Object.keys(req.session.cart).map(key => {
            var cnt = req.session.cart[key];
            var prod = prods.find(prod => prod._id == key);
            prod.quantity = cnt;
            total += cnt * Number.parseInt(prod.price);

            return prod;
        });
        
        var model = appendMessage (req, { products: cart_products, total : total });
        res.render('cart', appendUser(req, model));
    }).catch((err) => {
        req.session.msg = `Zapytanie do bazy danych zawiodło. (${err})`;
        res.redirect('/');
    });
})


app.get('/checkout', authorizeUser, (req, res) => {
    req.session.cart = {};
    req.session.msg = 'Zamowienie zostało złozone. Dziękujemy za zakupy!';
    res.redirect('/');
});

app.get('/add_to_cart/:id', authorizeUser, (req, res) => {
    if (!req.session.cart)
        req.session.cart = {};

    var id = req.params.id;

    productRepository.findAll().then(prods => {
        var product = prods.find(prod => prod._id == id);
        if (product) {
            // console.log(product.name + ' added to cart');

            if (!req.session.cart[id])
                req.session.cart[id] = 1;
            else
                req.session.cart[id] += 1;

            // console.log(req.session.cart);
            req.session.msg = `Dodano ${product.name} do koszyka.`;
            res.redirect('/');
        }
    }).catch((err) => {
        req.session.msg = `Zapytanie do bazy danych zawiodło. (${err})`;
        res.redirect('/');
    })
});

app.get('/remove_from_cart/:id/:name', authorizeUser, (req, res) => {
    if (!req.session.cart)
        req.session.cart = {};

    var id = req.params.id;
    delete req.session.cart[id];
    
    var name = req.params.name;

    req.session.msg = `Usunięto ${name} z koszyka.`;
    res.redirect('/cart');
});

app.get('/admin', authorizeAdmin, (req, res) => {
    res.render('admin');
})

// -- Auth functions -- //

function authorizeUser(req, res, next) {
    if (!req.signedCookies.authcookie) {
        res.redirect('/login?returnUrl=' + req.url);
    } else {
        next();
    }
}

function authorizeAdmin(req, res, next) {
    if (!req.signedCookies.authcookie) {
        res.redirect('/login?returnUrl=' + req.url);
    } else if (req.signedCookies.authcookie.role !== 'admin') {
        res.render('/', {message: 'Brak uprawnień.'})
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