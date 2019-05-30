'use strict';
const _ = require('lodash');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
/******************************************************************/
/******************************************************************/
/* REQUIRED ENVIRONMENT VARIABLES */
/******************************************************************/
/* JWKS_URI => This is the uri pointing to the JSON web Key set   */
/* ISSUER => This is the issuer (iss claim) of the JWT tokens     */
/* AUDIENCE => This is the OIDC audience (aud claim)              */
/******************************************************************/
/******************************************************************/
class AuthorizationMiddleware {
	constructor(context) {
		this._apiServer = context.apiServer;
	}
	validateAccessToken(req, res) {
		return Promise.resolve()
			.then(() => {
				const checkJwt = jwt({
					// Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
					secret: jwksRsa.expressJwtSecret({
						cache: true,
						rateLimit: true,
						jwksRequestsPerMinute: 5,
						jwksUri: process.env.JWKS_URI
					}),

					// Validate the audience and the issuer.
					audience: process.env.AUDIENCE,
					issuer: process.env.ISSUER,
					algorithms: ['RS256']
				});
				return new Promise((resolve, reject) => { //eslint-disable-line
					checkJwt(req.rawRequest, res.rawResponse, (err) => {
						if (err) {
							res.unauthorized(err.message);
						}
						else {
							resolve();
						}
					});
				});
			});
	}
	authorizeAccessToken(req, res, methodDefinition) {
		let rawRequest = req.rawRequest;
		let requiredScopes = [];
		if(_.has(methodDefinition,'security')) {
			let oidcSecurity = methodDefinition.security.find((secScheme)=>{
				if(secScheme.hasOwnProperty('openIdConnect')){
					return true;
				}
				else{
					return false;
				}
			});
			if(oidcSecurity){
				requiredScopes = oidcSecurity.openIdConnect;
			}
		}
		return new Promise((resolve, reject) => { //eslint-disable-line
			let allowed = true;
			if (requiredScopes.length !== 0) {
	
				let scopeKey = 'permissions';
				
				if (!rawRequest.user) {
					res.forbidden('JWT Token missing.',requiredScopes);
				}
				else{
					let userScopes = [];
					if (typeof rawRequest.user[scopeKey] === 'string') {
						userScopes = rawRequest.user[scopeKey].split(' ');
					} 
					else if (Array.isArray(rawRequest.user[scopeKey])) {
						userScopes = rawRequest.user[scopeKey];
					}

					allowed = requiredScopes.every(scope => userScopes.includes(scope));
					if(allowed){
						resolve();
					}
					else{
						res.forbidden('Insufficient authorization.',requiredScopes);
					}
				}
			}
			else{
				resolve();
			}
		});
	
	}
}
module.exports = AuthorizationMiddleware;