var juggler

if (typeof exports !== 'undefined') {
    juggler = exports;
} else {
    juggler = root.juggler = {};
}

juggler.VERSION = '0.0.1';

// Create new instance of juggler.
juggler.createSSOJuggler = function(options) {
    return new Juggler(options);
};


/*******************************************
* Juggler 
*/
Juggler = function(options) {
	var defaults = {
        authenticationPath: '/login',
        cookieExpirationTime: 60,
        authPath: '/auth',
        deauthPath: '/deauth',
        successPath: '/success'
	};
	
	this.options = mergeOptions(options, defaults);
};

Juggler.prototype = {

	saveUserIdentifier: function(session, userIdentifier) {
		session.userIdentifier = userIdentifier;
	},
	
	saveRemember: function(session, remember) {
		session.remember = remember;
	},

    addRoutes: function(app) {
		
        var isTokenValid = function(token) {
			return token != null;
		};
		
		var responseAuth = function(req, res, token) {
			
			if (token != null) {
				
				if (!req.session.remember) {
					res.cookie('token', JSON.stringify(token), { maxAge: this.options.cookieExpirationTime*1000 });
				} else {
					res.cookie('token', JSON.stringify(token));
				}
				
				var symbol = '?';
				if (req.session.callbackUrl.indexOf('?') >= 0) {
					symbol = '&';
				}
				res.redirect(req.session.callbackUrl + symbol + 'userIdentifier=' + token.userIdentifier);
			} else {
				res.clearCookie('token');
			}
			
		}.bind(this);

		app.get(this.options.authPath, function(req, res){
			
			var callbackUrl = req.param('callbackUrl');
						
			var token = req.cookies.token != null ? JSON.parse(req.cookies.token) : null;
			
			req.session.callbackUrl = callbackUrl;
			
			if (isTokenValid(token)) {
				responseAuth(req, res, token);
			} else {
				res.redirect(this.options.authenticationPath);
			}

		}.bind(this));

		app.get(this.options.successPath, function(req, res){
			
			var token = {};
			token.token = require('crypto').createHash('md5').update(req.session.userIdentifier + Math.round((new Date().valueOf() * Math.random()))).digest('hex');
			token.userIdentifier = req.session.userIdentifier;
			responseAuth(req, res, token);

		});
		
		app.get(this.options.deauthPath, function(req, res){
			
			var callbackUrl = req.param('callbackUrl');
			res.clearCookie('token');
			req.session.destroy();
			res.redirect(callbackUrl);

		});
    }
};

// helper
var mergeOptions = function(options, defaultOptions) {
    if (!options || typeof options === 'function') {
        return defaultOptions;
    }
    
    var merged = {};
    for (var attrname in defaultOptions) { merged[attrname] = defaultOptions[attrname]; }
    for (var attrname in options) { if (options[attrname]) merged[attrname] = options[attrname]; }
    return merged;  
};
