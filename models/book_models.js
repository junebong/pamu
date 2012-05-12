var mongoose = require('mongoose'),
    crypto = require('crypto');

/**
 * Model: user
 */
function validatePresenceOf(value) {
    return value && value.length;
}

var User = new mongoose.Schema({
    email: { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    user_name: String,
    hashed_password: String,
    salt: String
});

User.virtual('id')
    .get(function() {
        return this._id.toHexString();
    });

    
User.virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
    })
    .get(function() {return this._password; });
    
User.method('authenticate', function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
});

User.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
});

User.method('encryptPassword', function(password) {
    return crypto.createHmac('RSA-SHA256', this.salt).update(password).digest('hex');
});

User.pre('save', function(next) {
    if (!validatePresenceOf(this.password)) {
        next(new Error('Invalid password'));
    } else {
        next();
    }
});

/**
 * Model: LoginToken
 * 
 * Used for session persistence.
 */
var LoginToken = new mongoose.Schema({
    email: { type: String, index: true },
    series: { type: String, index: true },
    token: { type: String, index: true }
});

LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
});

LoginToken.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken();
    
    if (this.isNew)
        this.series = this.randomToken();
        
    next();
});

LoginToken.virtual('id')
    .get(function() {
        return JSON.stringify({ email: this.email, token: this.token, series: this.series });
    });
    
mongoose.model('LoginToken', LoginToken);
mongoose.model('User', User);

//接続メソッドの定義
exports.createConnection = function(url) {
    return mongoose.createConnection(url);
};

