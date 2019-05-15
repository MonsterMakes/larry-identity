'use strict';
const queryStringUtils = require('querystring');
const urlUtils = require('url');
const request = require('request');
const handlebars = require('handlebars');
const fs = require('fs');
const _ = require('lodash');

/***********************************************************************************************/
/***********************************************************************************************/
/* REQUIRED ENVIRONMENT VARIABLES 															   */
/***********************************************************************************************/
/* AUTH0_DEFAULT_CONNECTION => The default connection for this Auth Service                    */
/* AUTH0_DOMAIN => This is the uri pointing to the root AUTH0 tenants domain.   		       */
/* AUTH0_CLIENT_ID => This is the id of the AUTH0 application used for authentication.         */
/* AUTH0_CLIENT_SECRET => This is the secret of the AUTH0 application used for authentication. */
/* AUDIENCE => This is the OIDC audience (aud claim), the unique identifier of the AUTH0 API   */
/* API_URI => This is the external URI to this API           							       */
/***********************************************************************************************/
/***********************************************************************************************/
//const OIDC_SCOPE_WITH_REFRESH = 'offline_access openid profile email';
const OIDC_SCOPE = 'openid profile email';
class Auth {
	constructor(context){
		this._apiServer = context.apiServer;
		this._log = context.log;
		this._apiBaseUri =process.env.API_URI;
		this._auth0BaseUri = process.env.AUTH0_DOMAIN;
		this._auth0ClientId = process.env.AUTH0_CLIENT_ID;
		this._auth0ClientSecret = process.env.AUTH0_CLIENT_SECRET;
		this._auth0Audience = process.env.AUDIENCE;
	}
	/**
	 * Private helper method that forwards "Proxies" a request to another endpoint.
	 * Note: Make sure that this request is NOT using the bodyParser (STANDARD.json) middleware. This method will fail if the request stream has already been processed.
	 * @param {string} forwardUrl - The url, including query params, to the forwarded endpoint.
	 * @param {ExpressRequest} rawRequest - The Express API Request object.
	 * @param {ExpressResponse} rawResponse - The Express API Response object.
	 */
	_forwardRequest(forwardUrl,rawRequest,rawResponse){
		return new Promise((resolve,reject)=>{
			let auth0Request = request(forwardUrl,(error,response,data)=>{
				let logObj = {
					error,
					data,
					url: _.get(response,'url'),
					method: _.get(response,'method'),
					statusCode: _.get(response,'statusCode'),
					headers: _.get(response,'headers'),
				};
				let forwardPath = urlUtils.parse(forwardUrl).pathname;
				if(error){
					this._log.error(logObj,`Failed to make ${forwardPath} request to auth0`);
					reject(error);
				}
				else{
					this._log.trace(logObj,`Successfully made ${forwardPath} request to auth0`);
					resolve();
				}
			});
			//copies method, headers and request body into proxied request
			rawRequest.pipe(auth0Request);
			//pipe the raw response from auth0
			auth0Request.pipe(rawResponse);
		});
	}
	/**
	 * @swagger
	 * /login:
	 *   get:
	 *     serviceMethod: Auth.login
	 *     description: Starts the OIDC Authorization Code Grant (with optional PKCE) login process, you will be redirected to Authorization Server. If using PKCE you need to generate and store a code_verifier, then use that to generate a code_challenge and provide it to this request.
	 *     tags: [auth]
	 *     parameters:
	 *       - in: query
	 *         name: redirect_uri
	 *         description: The URL to which the requestor will be redirected after authorization has been granted by the user.
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: code_challenge
	 *         description: Generated challenge from the stored (on the requestor's side) code_verifier. Note S256 is the only supported method.
	 *         required: false
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: state
	 *         description: An opaque value the requestor can provide that will be returned once the redirection completes. This value must be used by the client to prevent CSRF attacks.
	 *         required: false
	 *         schema:
	 *           type: string
	 *     responses:
	 *       302:
	 *         description: Redirects the user to the appropriate Authorization Server to be authenticated.
	 */
	login(requestHelper,responseHelper){
		let queryParams = requestHelper.rawRequest.query;
		queryParams.client_id = this._auth0ClientId;
		queryParams.response_type = 'code';
		queryParams.scope = OIDC_SCOPE;
		queryParams.audience = this._auth0Audience;
		queryParams.connection = null; // force redirection to autho login (dont go to social identity providers)
		//TODO AUTH0_DEFAULT_CONNECTION should we use it?
		
		// wrap the clients state and redirect_uri into the state object
		let wrappedState = {
			state: queryParams.state || null,
			redirectUri: queryParams.redirect_uri
		};
		queryParams.state = JSON.stringify(wrappedState);
		queryParams.redirect_uri = `${this._apiBaseUri}callback`;

		// If the client is requesting Authorization code grant using PKCE set the default challenge method
		if(queryParams.hasOwnProperty('code_challenge') && !queryParams.hasOwnProperty('code_challenge_method')){
			queryParams.code_challenge_method = 'S256';
		}

		//Make the call to Auth0 /authorize endpoint
		let queryString = queryStringUtils.stringify(queryParams);
		requestHelper.rawRequest.url = `${this._auth0BaseUri}authorize?${queryString}`;

		this._log.trace({
			queryParams,
			url: requestHelper.rawRequest.url,
			headers: requestHelper.getHeaders(),
			payload: requestHelper.payload
		},'Login request received making authorize request to auth0');
		
		return this.authorize(requestHelper,responseHelper);
	}
	/**
	 * @swagger
	 * /logout:
	 *   get:
	 *     serviceMethod: Auth.logout
	 *     description: Use this endpoint to logout the user from the Authorization Server. 
	 *     tags: [auth]
	 *     responses:
	 *       302:
	 *         description: Redirects the user to the logged-out callback endpoint.
	 */
	logout(requestHelper,responseHelper){
		//override some settings
		let queryParams = requestHelper.rawRequest.query;
		queryParams.client_id = this._auth0ClientId;
		queryParams.returnTo = `${this._apiBaseUri}logged-out`;
		queryParams.federated = true;

		//Make the call to Auth0 /logout endpoint
		let queryString = queryStringUtils.stringify(requestHelper.rawRequest.query);
		let requestUrl = `${this._auth0BaseUri}v2/logout?${queryString}`;
		responseHelper.redirect(requestUrl);
	}
	/**
	 * @swagger
	 * /logged-out:
	 *   get:
	 *     serviceMethod: Auth.loggedOut
	 *     description: Logs the current user out of the Authorization Server.
	 *     tags: [auth]
	 *     produces:
	 *       - text/html
	 *     responses:
	 *       200:
	 *         description: User has been successfully logged out of the Authorization Server.
	 */
	loggedOut(requestHelper,responseHelper){//eslint-disable-line
		return new Promise((resolve,reject)=>{//eslint-disable-line
			let path = `${__dirname}/pages/LoggedOut.html`;
			fs.readFile(path, 'utf-8', (error, source)=>{
				let tmpltVars = {
					loginUrl: `${this._apiBaseUri}login`
				};
				if(error){
					this._log.error({path},`Failed to read LoggedOut.html, using default instead.`);
					//create raw html just in case the file is missing
					source=`<h1>You've been logged out successfully/h1>`;
				}
				let tmplt = handlebars.compile(source);
				let htmlResponse = tmplt(tmpltVars);
				responseHelper.send(htmlResponse,200);
				resolve();
			});
		});
	}
	/**
	 * @swagger
	 * /callback:
	 *   get:
	 *     serviceMethod: Auth.callback
	 *     description: Login and authorization flow has completed sucessfully or with errors.
	 *     tags: [auth]
	 *     produces:
	 *       - text/html
	 *     responses:
	 *       302:
	 *         description: Attempts to exchange the code for a token with the Authorization Server, if success user will be redirected.
	 *       4038:
	 *         description: If anything goes wrong an error page will be displayed to the user.
	 *         content: 
	 *           text/html:
	 *             schema:
	 *               type: string
	 */
	callback(requestHelper,responseHelper){//eslint-disable-line
		return new Promise((resolve,reject)=>{//eslint-disable-line
			let errorTitle = requestHelper.queryParams.error;
			//This most commonly will be caused by failed auth0 rules
			if(errorTitle){
				let path = `${__dirname}/pages/GenericError.html`;
				fs.readFile(path, 'utf-8', (error, source)=>{
					let errorDescription = requestHelper.queryParams.error_description;
					let tmpltVars = {
						errorTitle,
						errorDescription,
						loginUrl: `${this._apiBaseUri}login`
					};
					if(error){
						this._log.error({path,error,errorDescription},`Failed to read GenericError.html, using default instead.`);
						//create raw html just in case the file is missing
						source=`<h1>${tmpltVars.errorTitle}</h1>
						<p>${tmpltVars.errorDescription}</p>
						<p>Try to <a href="${tmpltVars.loginUrl}">login</a> again, if the problem persists please contact support.</p>`;
					}
					else{
						this._log.error({error,errorDescription},`Received unknown error in the auth callback process.`);
					}
					let tmplt = handlebars.compile(source);
					let htmlResponse = tmplt(tmpltVars);
					responseHelper.send(htmlResponse,403);
					resolve();
				});
			}
			else{
				try{
					let wrappedState = JSON.parse(requestHelper.queryParams.state);
					if(wrappedState.redirectUri){
						let redirectPath = new urlUtils.URL(wrappedState.redirectUri);
						redirectPath.searchParams.set('state',wrappedState.state);
						redirectPath.searchParams.set('code',requestHelper.queryParams.code);
						responseHelper.redirect(redirectPath);
					}
					else{
						resolve(requestHelper.toJSON());
					}
				}
				catch(e){
					//TODO
					reject(e);
				}
			}
		});
	}
	/*********************************************************************************/
	/*********************************************************************************/
	/* START OIDC STANDARD METHODS (https://openid.net/connect/) */
	/*********************************************************************************/
	/*********************************************************************************/	
	/**
	 * @swagger
	 * /authorize:
	 *   get:
	 *     serviceMethod: Auth.authorize
	 *     description: Starts the OIDC login process, you will be redirected to Authorization Server. 
	 *     tags: [auth]
	 *     parameters:
	 *       - in: query
	 *         name: client_id
	 *         description: The client_id of your application.
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: response_type
	 *         description: Indicates to Auth0 which OAuth 2.0 Flow you want to perform. Use 'code' for Authorization Code Grant (PKCE) Flow.
	 *         required: true
	 *         schema:
	 *           type: string
	 *           enum: ['code', 'id_token', 'token', 'id_token token' ]
	 *       - in: query
	 *         name: connection
	 *         description: The name of the connection associated with your application you'd like to authenticate against.
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: scope
	 *         description: The scopes which you want to request authorization for. These must be separated by a space. You can request any of the [standard OIDC scopes](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims) about users, such as profile and email, custom claims that must conform to a namespaced format, or any scopes supported by the target API (for example, read:contacts). Include offline_access to get a Refresh Token.
	 *         required: false
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: audience
	 *         description: The unique identifier of the target API you want to access.
	 *         required: false
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: redirect_uri
	 *         description: The URL to which the requestor will be redirected after authorization has been granted by the user.
	 *         required: true
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: code_challenge
	 *         description: Generated challenge from the stored (on the requestor's side) code_verifier. Note S256 is the only supported method.
	 *         required: false
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: state
	 *         description: An opaque value the requestor can provide that will be returned once the redirection completes. This value must be used by the client to prevent CSRF attacks.
	 *         required: false
	 *         schema:
	 *           type: string
	 *       - in: query
	 *         name: prompt
	 *         description: To initiate a silent authentication request. A silent authentication request will not redirect the user, instead it fails the request if the user is not currently authenticated or issues the response if authenticated.
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: [none]
	 *       - in: query
	 *         name: nonce
	 *         description: A string value which will be included in the ID Token response from Auth0, [used to prevent token replay attacks](https://auth0.com/docs/api-auth/tutorials/nonce). It is required for response_type="id_token token".
	 *         required: false
	 *         schema:
	 *           type: string
	 *     responses:
	 *       302:
	 *         description: Redirects the user to the appropriate Authorization Server.
	 */
	authorize(requestHelper,responseHelper){
		//Make the call to Auth0 /authorize endpoint
		let queryString = queryStringUtils.stringify(requestHelper.rawRequest.query);
		let requestUrl = `${this._auth0BaseUri}authorize?${queryString}`;
		responseHelper.redirect(requestUrl);
	}
	/**
	 * @swagger
	 * /token:
	 *   post:
	 *     serviceMethod: Auth.token
	 *     description: Retrieves or refreshes tokens (Access Token, ID Token, Refresh Token)
	 *     tags: [auth]
	 *     requestBody:
	 *       content:
	 *         application/x-www-form-urlencoded:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - grant_type
	 *               - client_id
	 *             properties:
	 *               grant_type:
	 *                 description: Denotes the flow you are using
	 *                 type: string
	 *                 enum: [authorization_code, refresh_token, client_credentials]
	 *               client_id:
	 *                 description: The client_id of your application.
	 *                 type: string
	 *               code:
	 *                 description: The Authorization Code received from the initial /authorize or /login call, required if using authorization_code grant_type.
	 *                 type: string
	 *               code_verifier:
	 *                 description: Cryptographically random key that was used to generate the code_challenge passed to /authorize or /login, required if using authorization_code grant_type.
	 *                 type: string
	 *               redirect_uri:
	 *                 description: The URL to which the requestor will be redirected after authorization has been granted by the user. Must match the redirect_uri passed to /authorize or /login.
	 *                 type: string
	 *               client_secret:
	 *                 description: The application's client secret, required if using authorization code grant without PKCE flow or client_credentials grant_type.
	 *                 type: string
	 *               audience:
	 *                 description: The unique identifier of the target API you want to access, required if using client_credentials grant_type.
	 *                 type: string
	 *               refresh_token:
	 *                 description: The refresh token to use to refresh the token(s), required if using refresh_token grant_type.
	 *                 type: string
	 *     responses:
	 *       200:
	 *         description: Redirects the user to the appropriate Authorization Server.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 access_token:
	 *                   type: string
	 *                   description: A JWT which contains the issued access token.
	 *                 id_token:
	 *                   type: string
	 *                   description: A JWT which contains the issued id token.
	 *                 scope:
	 *                   type: string
	 *                   description: The scopes requested to produce the above tokens.
	 *                 expires_in:
	 *                   type: integer
	 *                   description: The number of seconds before the access_token expires.
	 *                 token_type:
	 *                   type: string
	 *                   enum: [Bearer]
	 *                   description: The type of the tokens provided above.
	 */
	token(requestHelper,responseHelper){
		//Make the call to Auth0 /token endpoint
		let queryString = queryStringUtils.stringify(requestHelper.rawRequest.query);
		let requestUrl = `${this._auth0BaseUri}oauth/token?${queryString}`;
		return this._forwardRequest(requestUrl,requestHelper.rawRequest,responseHelper.rawResponse);
	}
	/**
	 * @swagger
	 * /userinfo:
	 *   get:
	 *     serviceMethod: Auth.userinfo
	 *     description: Retrieve the user info associated with an access Token from the Authorization Server. 
	 *     tags: [auth]
	 *     parameters:
	 *       - in: query
	 *         name: access_token
	 *         schema:
	 *           type: string
	 *           description: The access_token of the user info being requested.
	 *     responses:
	 *       200:
	 *         description: The user profile information based on the scopes requested.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 sub:
	 *                   type: string
	 *                   description: Unique Identifier for the End-User at the Issuer.
	 *                 nickname:
	 *                   type: string
	 *                   description: Casual name of the End-User that may or may not be the same as the given_name.
	 *                 name:
	 *                   type: string
	 *                   description: End-User's full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User's locale and preferences.
	 *                 picture:
	 *                   type: string
	 *                   description: URL of the End-User's profile picture. This URL MUST refer to an image file (for example, a PNG, JPEG, or GIF image file), rather than to a Web page containing an image.
	 *                 updated_at:
	 *                   type: integer
	 *                   description: Time the End-User's information was last updated. Its value is a JSON number representing the number of seconds from 1970-01-01T0:0:0Z as measured in UTC until the date/time.
	 *                 email:
	 *                   type: string
	 *                   description: End-User's preferred e-mail address.
	 *                 email_verified:
	 *                   type: string
	 *                   description: True if the End-User's e-mail address has been verified; otherwise false.
	 *                 http://monstermakes.tech/roles:
	 *                   type: string
	 *                   items:
	 *                     type: string
	 *                   description: The custom roles claim used to describe the privileges associated with the user in the system.
	 */
	userinfo(requestHelper,responseHelper){
		//Make the call to Auth0 /userinfo endpoint
		let queryString = queryStringUtils.stringify(requestHelper.rawRequest.query);
		let requestUrl = `${this._auth0BaseUri}userinfo?${queryString}`;
		return this._forwardRequest(requestUrl,requestHelper.rawRequest,responseHelper.rawResponse);
	}
	/**
	 * @swagger
	 * /.well-known/openid-configuration:
	 *   get:
	 *     serviceMethod: Auth.wellKnownOpenIdConfiguration
	 *     description: Retrieve the OpenID Provider document for this Authorization Server.
	 *     tags: [auth]
	 *     responses:
	 *       200:
	 *         description: The retieved OpenID Provider document, see https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig for more details
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 */
	wellKnownOpenIdConfiguration(requestHelper,responseHelper){
		//Make the call to Auth0 /userinfo endpoint
		let queryString = queryStringUtils.stringify(requestHelper.rawRequest.query);
		let requestUrl = `${this._auth0BaseUri}.well-known/openid-configuration?${queryString}`;
		return this._forwardRequest(requestUrl,requestHelper.rawRequest,responseHelper.rawResponse);
	}
	/**
	 * @swagger
	 * /.well-known/jwks.json:
	 *   get:
	 *     serviceMethod: Auth.wellKnownJwks
	 *     description: Retrieve a JSON object that represents a set of JWKs. The JSON object MUST have a keys member, which is an array of JWKs. A JWK is a JSON object that represents a cryptographic key. The members of the object represent properties of the key, including its value.
	 *     tags: [auth]
	 *     responses:
	 *       200:
	 *         description: The retrieved JWKs, see https://tools.ietf.org/html/rfc7517 for more info on the contents.A JSON object that represents a set of JWKs. The JSON object MUST have a keys member, which is an array of JWKs.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 */
	wellKnownJwks(requestHelper,responseHelper){
		//Make the call to Auth0 /userinfo endpoint
		let queryString = queryStringUtils.stringify(requestHelper.rawRequest.query);
		let requestUrl = `${this._auth0BaseUri}.well-known/jwks.json?${queryString}`;
		return this._forwardRequest(requestUrl,requestHelper.rawRequest,responseHelper.rawResponse);
	}
	/**
	 * @swagger
	 * /revoke:
	 *   post:
	 *     serviceMethod: Auth.revoke
	 *     serviceMiddlewares: 
	 *       - STANDARD.json
	 *     description: Starts the OIDC (Authorization Code Grant) login process, you will be redirected to Authorization Server. 
	 *     tags: [auth]
	 *     requestBody:
	 *       content:
	 *         application/x-www-form-urlencoded:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               client_id:
	 *                 type: string
	 *                 description: The id of the client application that issued the refresh token, if not specified uses the default client application.
	 *               client_secret:
	 *                 type: string
	 *                 description: The secret of the client application that issued the refresh token, if not specified uses the default client application. 
	 *               token:
	 *                 type: string
	 *                 description: The refresh token to be revoked
	 *             required:
	 *               - token
	 *     responses:
	 *       200:
	 *         description: The refresh token was successfully revoked.
	 *       400:
	 *         description: The required parameters were not sent in the request.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   enum: [invalid_request]
	 *                 error_description:
	 *                   type: string
	 *       401:
	 *         description: The request is not authorized. Check that the client credentials (client_id and client_secret) are present in the request and hold valid values.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *                   enum: [invalid_client]
	 *                 error_description:
	 *                   type: string
	 */
	revoke(requestHelper,responseHelper){
		return new Promise((resolve,reject)=>{
			//override some settings
			requestHelper.payload.client_id = this._auth0ClientId;
			requestHelper.payload.client_secret = this._auth0ClientSecret;

			// make revoke request to auth0
			let auth0Request = request(
				{
					method: 'post',
					uri: `${this._auth0BaseUri}oauth/revoke`,
					json: true,
					body: requestHelper.payload
				},
				(error,response,data)=>{
					let logObj = {
						error,
						data,
						url: _.get(response,'url'),
						method: _.get(response,'method'),
						statusCode: _.get(response,'statusCode'),
						headers: _.get(response,'headers'),
					};
					if(error){
						this._log.error(logObj,'Failed to make /revoke request to auth0');
						reject(error);
					}
					else{
						this._log.trace(logObj,'Successfully made /revoke request to auth0');
						resolve();
					}
				}
			);
			//pipe the raw response from auth0
			auth0Request.pipe(responseHelper.rawResponse);
		});
	}
	/*********************************************************************************/
	/*********************************************************************************/
	/* END OIDC STANDARD METHODS */
	/*********************************************************************************/
	/*********************************************************************************/	
}
module.exports = Auth;