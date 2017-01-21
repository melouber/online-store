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

// -- DB Mockups -- //

var users_db = {
    'mat': 'mati',
    'jul': 'juli'
}

var products_db = [
    { name: 'Bloody Mary', price: 3, description: 'Dobra woda' },
    { name: 'Martini', price: 5, description: 'Zla woda' },
    { name: 'Scotch', price: 10, description: 'Ok woda' }
]

// -- Views -- //

app.get('/', (req, res) => {
    res.render('products_out', { products: products_db });
    res.end();
});

app.get('/products_in', auth, (req, res) => {
    res.render('products_in', { products: products_db });
    res.end();
});

app.get('/login', (req, res) => {
    res.render('login');
})

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