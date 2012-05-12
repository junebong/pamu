//LoginToken, User モデルクラス定義の呼び出し
var mongoModel = require('../models/book_models');
//MongoDB への接続設定
var db = mongoModel.createConnection('mongodb://pamupamu:pamupamu@flame.mongohq.com:27077/pamu');

//LoginToken モデルを取得
var LoginToken = db.model('LoginToken');
//User モデルを取得
var User = db.model('User');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index',
        { title: '画像アップロード',
          h1: 'システムログイン',
          loginMsg: 'ログインしてください。',
          signup_url: '/signup'});
};

exports.layout = function(req, res){
  res.render('layout', {title: "Layout "});
};

exports.login = function(req, res) {
    var data = req.body;
    res.render('main', 
        {title: "Welcome",
         userName: "ユーザー名"});
};

exports.signup = function(req, res) {
    res.render('users/new', 
        {title: "登録画面",
          h1: 'システムユーザー登録',
          loginMsg: '個人情報を登録してください。'});
};

exports.confirm = function(req, res) {
    
    //User.email = 'info@test.com';
    //User.user_name = 'taiji';
    //User.password = 'taijiji';
    
    var user = new User(req.body.user);
    
    user.save(function(err) {
        if (err) {
            console.log('save failed');
        }
        
        console.log('save success');
    });
    res.redirect('/');
};

exports.ses_new = function(req, res) {
  res.render('sessions/new', {title: "Login Ok! ",
    locals: { user: new User() }
  });
};

exports.ses_cre = function(req, res) {
  User.findOne({ email: req.body.user.email }, function(err, user) {
    if (user && user.authenticate(req.body.user.password)) {
      req.session.user_id = user.id;

      // Remember me
      if (req.body.remember_me) {
        var loginToken = new LoginToken({ email: user.email });
        loginToken.save(function() {
          res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          res.redirect('/layout', {title: "Login Ok! "});
        });
      } else {
        res.redirect('/layout', {title: "Login Ok! "});
      }
    } else {
      req.flash('error', 'Incorrect credentials');
      res.redirect('/sessions/new');
    }
  }); 
};

exports.ses_del = function(req, res) {
  if (req.session) {
    LoginToken.remove({ email: req.currentUser.email }, function() {});
    res.clearCookie('logintoken');
    req.session.destroy(function() {});
  }
  res.redirect('/sessions/new');
};

function authenticateFromLoginToken(req, res, next) {
  var cookie = JSON.parse(req.cookies.logintoken);

  LoginToken.findOne({ email: cookie.email,
                       series: cookie.series,
                       token: cookie.token }, (function(err, token) {
    if (!token) {
      res.redirect('/sessions/new');
      return;
    }

    User.findOne({ email: token.email }, function(err, user) {
      if (user) {
        req.session.user_id = user.id;
        req.currentUser = user;

        token.token = token.randomToken();
        token.save(function() {
          res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 2 * 604800000), path: '/' });
          next();
        });
      } else {
        res.redirect('/sessions/new');
      }
    });
  }));
}

exports.loadUser = function(req, res, next) {
  if (req.session.user_id) {
    User.findById(req.session.user_id, function(err, user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/sessions/new');
      }
    });
  } else if (req.cookies.logintoken) {
    authenticateFromLoginToken(req, res, next);
  } else {
    res.redirect('/sessions/new');
  }
}