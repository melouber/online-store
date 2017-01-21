// -- Imports -- //
var http         = require('http');
var express      = require('express');
var session      = require('express-session');
var FileStore    = require('session-file-store')(session);
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');

// -- Setup -- //
var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
        store: new FileStore,
        secret: 'secret',
        resave: true,
        saveUninitialized: true
    })
);

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
app.get('/', (req, res) => {
    res.redirect(req.cookies.user ? '/products_in' : '/products_out');
    res.end();
});

app.get('/products_in', auth, (req, res) => { 
    res.render('products_in', { products: products_arr, user_name: req.cookies.user });
    res.end();
});

app.get('/products_out', (req, res) => {
    if (req.cookies.user)
        res.redirect('/products_in');
    else 
        res.render('products_out', { products: products_arr });
    res.end();
});

app.get('/login', (req, res) => {
    res.render('login');
})

products_arr.forEach(product => {
    app.post('/add_to_cart' + product.id, auth, (req, res) => {
        if (!req.session.cart)
            req.session.cart = {};

        console.log(product.name + ' added to cart');
        if (!req.session.cart[product.id])
            req.session.cart[product.id] = 1;
        else
            req.session.cart[product.id] += 1;

        console.log(req.session.cart);
        res.redirect('/products_in');
        // res.render('products_in', { locals : { message : 'Added ' + product.name + ' to cart.' } } );
    });
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