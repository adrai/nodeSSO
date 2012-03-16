## Introduction

The project goal is to provide simple SSO in node.js. 

## Getting started

1. get nodeSSO:
    
    `npm install nodeSSO`

    or

    `git clone git@github.com:adrai/nodeSSO.git`
    
2. go to /example
    
3. run `npm install express`, `npm install everyauth`

4. start the app `node server.js`

5. direct your browser to [localhost:3001](http://localhost:3001)

## Quick Start

Using nodeSSO comes very easy to use with everyauth and express.

1. Create a sso juggler
	
        var SsoJuggler = require('nodeSSO');
		var ssoJuggler = new SsoJuggler({
			authenticationPath: '/auth/openid?openid_identifier=https://www.google.com/accounts/o8/id'
		});
	
2. use everyauth

		var everyauth = require('everyauth');
		everyauth
		  .openid
			.myHostname('http://localhost:3001')
			.findOrCreateUser( function (session, userMetadata) {
			  // Don't forget to save the userIdentifier!
			  ssoJuggler.saveUserIdentifier(session, userMetadata.email);
			  return userMetadata;
			})
			.redirectPath(successPath);
		
3. use express

		var express = require('express');
		var app = express.createServer(
			express.bodyParser()
		  , express.static(__dirname + "/public")
		  , express.cookieParser()
		  , express.session({ secret: 'htuayreve' })
		  , everyauth.middleware()
		);
		everyauth.helpExpress(app);

4. add routes

		ssoJuggler.addRoutes(app);
	
5. and run the service

		app.listen(3001);
	
6. now you can authenticate calling: "http://localhost:3001/auth?callbackUrl=http://www.google.ch" 
	and 
	deauthenticat calling: "http://localhost:3001/deauth?callbackUrl=http://www.google.ch"

7. after a successfull authentication you will receive the userIdentifier with the parameter userIdentifier
