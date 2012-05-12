
/**
 * Module dependencies.
 */

var express = require('express')
  , connectTimeout = require('connect-timeout')
  , mongoStore = require('connect-mongodb')
  , routes = require('./routes');
  

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(connectTimeout({ time: 10000 }));
  app.use(express.session({ store: mongoStore(app.set('db-uri')), secret: 'topsecret' }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.loadUser, routes.layout);            // welcome画面
app.get('/layout', routes.layout);     
app.post('/login', routes.login);
app.get('/users/new', routes.signup);     // ユーザー登録画面
app.post('/confirm', routes.confirm);  // ユーザー登録実行

// Sessions
app.get('/sessions/new', routes.ses_new);
app.post('/sessions', routes.ses_cre);
app.del('/sessions', routes.loadUser, routes.ses_del);


app.listen(process.env.C9_PORT || process.env.VCAP_APP_PORT || process.env.PORT , function(){
    // process.env.C9_PORT || process.env.VCAP_APP_PORT || process.env.PORT
    console.log("Server has started.");
});
