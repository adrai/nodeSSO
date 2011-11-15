var authPath= '/auth',
    deauthPath= '/deauth',
    successPath= '/success',
    validatePath= '/validate';
    
var ssoJuggler = require('../lib/ssoJuggler').createSSOJuggler({
        authenticationPath: '/login',
        //authenticationPath: '/auth/openid?openid_identifier=https://www.google.com/accounts/o8/id',
        cookieExpirationTime: 20,
        authPath: authPath,
        deauthPath: deauthPath,
        successPath: successPath,
        validatePath: validatePath
	});

var everyauth = require('everyauth');

//everyauth.debug = true;
everyauth
  .openid
    .myHostname('http://localhost:3001')
    .findOrCreateUser( function (session, userMetadata) {
		
	  // Don't forget to save the userIdentifier!
	  ssoJuggler.saveUserIdentifier(session, userMetadata.email);
	  ssoJuggler.saveAuthSource(session, 'openId');
	  
	  if (userMetadata.claimedIdentifier.indexOf('https://www.google.com/accounts/o8/id') == 0) {
		  ssoJuggler.saveAuthSource(session, 'google');
	  }
	  
      return userMetadata;
    })
    .redirectPath(successPath);
everyauth.password
  .loginWith('login')
  .getLoginPath('/login') // Uri path to the login page
  .postLoginPath('/login') // Uri path that your login form POSTs to
  .loginView("login.jade")
  .extractExtraRegistrationParams( function (req) {
	  return req;
  })
  .authenticate( function (login, password, req) {
	  
	  console.log(login);
	  console.log(password);
	  console.log(req.param('remember') !== undefined);
	  
	  var errors = [];
      if (!login) errors.push('Missing login');
      if (!password) errors.push('Missing password');
      if (errors.length) return errors;
      var user = { login: 'user', password: 'password'}
      if (!user) return ['Login failed'];
      if (user.password !== password) return ['Login failed'];
            
      ssoJuggler.saveUserIdentifier(req.session, user.login);
      ssoJuggler.saveAuthSource(session, 'password');
      ssoJuggler.saveRemember(req.session, req.param('remember') !== undefined);
      //req.session.userIdentifier = user.login;
      
      return user;
  })
  .loginSuccessRedirect(successPath) // Where to redirect to after a login

  .getRegisterPath('/register') // Uri path to the registration page
  .postRegisterPath('/register') // The Uri path that your registration form POSTs to
  .registerView('a string of html; OR the name of the jade/etc-view-engine view')
  .validateRegistration( function (newUserAttributes) {
  })
  .registerUser( function (newUserAttributes) {
  })
  .registerSuccessRedirect(successPath); // Where to redirect to after a successful registration
  
//everyauth.everymodule.logoutRedirectPath(deauthPath);
  
var express = require('express');
//var RedisStore = require('connect-redis')(express);
var app = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.cookieParser()
  , express.session({ secret: 'htuayreve'/*, store: new RedisStore */})
  , everyauth.middleware()
);

ssoJuggler.addRoutes(app);

var consumerToken = 'testToken';

app.get('/', function(req, res){
	res.writeHead(200, { 'Content-Type': 'text/html' });
	res.write('Login <a href="'+authPath+'?callbackUrl=http://localhost:3001/val/">'+authPath+'?consumerToken='+consumerToken+'&callbackUrl=http://localhost:3001/val</a>');
	res.write('</br>');
	res.write('</br>');
	res.write('Logout <a href="'+deauthPath+'?callbackUrl=http://www.google.ch">'+deauthPath+'?callbackUrl=http://www.google.ch</a>');
	res.end();
});

app.get('/val', function(req, res){
	var userToken = req.param('userToken');
	res.redirect(validatePath+'?consumerToken=' + consumerToken + '&userToken=' + userToken + '&callbackUrl=http://localhost:3001/result');
});

app.get('/result', function(req, res){
	var userIdentifier = req.param('userIdentifier');
	var backConsumerToken = req.param('consumerToken');
	res.writeHead(200, { 'Content-Type': 'text/html' });
	if (backConsumerToken == consumerToken) {
		if (userIdentifier) {
			res.write('This is the user: '+userIdentifier);
		} else {
			res.write('User not valid');
		}
	} else {
		res.write('Wrong sender');
	}
	res.end();
});

everyauth.helpExpress(app);

app.listen(3001);
