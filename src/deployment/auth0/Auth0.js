'use strict';
const request = require('request');
const URL = require('url').URL;

class Auth0 {
	constructor(auth0Domain = process.env['AUTH0_DOMAIN'], clientId = process.env['CLIENT_ID'], clientSecret = process.env['CLIENT_SECRET']) {
		this._auth0Domain = auth0Domain;
		this._clientId = clientId;
		this._clientSecret = clientSecret;
	}
	__makeAuth0Request(options){
		return new Promise((resolve,reject)=>{
			request(options, function (error, response, body) {
				if (error) {
					reject(error);
				}
				else if(response.statusCode !== 200 && response.statusCode !== 201 && response.statusCode !== 204){
					reject({
						errorCode: response.statusCode,
						errorMsg: response.statusMessage,
						httpResponse: response
					});
				}
				else{
					resolve(body);
				}
			});
		});
	}
	_getAccessToken(){
		return Promise.resolve()
			.then(()=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl('/oauth/token'),
					json: true,
					body: {
						client_id: this._clientId,
						client_secret: this._clientSecret,
						audience: this._getUrl('/api/v2/'),
						grant_type: 'client_credentials'
					}
				});
			})
			.then(body=>{
				return body.access_token;
			});

	}
	_getUrl(path) {
		let url = new URL(path, this._auth0Domain);
		return url.toString();
	}
	createApi(name, identifier, scopes) {
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl('/api/v2/resource-servers'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						name: name,
						identifier: identifier,
						scopes: scopes,
						signing_alg: 'RS256',
						allow_offline_access: false,
						token_lifetime: 600,
						token_lifetime_for_web: 600,
						skip_consent_for_verifiable_first_party_clients: true,
						enforce_policies: true,
						token_dialect: 'access_token_authz'
					}
				});
			});
	}
	getAPIs(){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'GET',
					url: this._getUrl('/api/v2/resource-servers'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true
				});
			});
	}
	getRules(){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'GET',
					url: this._getUrl('/api/v2/rules'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true
				});
			});
	}
	createRule(name,script,order=undefined){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl('/api/v2/rules'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						name: name,
						script: script,
						order: order,
						enabled: true
					}
				});
			});
	}
	getClients(){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'GET',
					url: this._getUrl('/api/v2/clients'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true
				});
			});
	}
	createClient(name,clientUrl){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl('/api/v2/clients'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						name: name,
						description: `Client application for the ${clientUrl} environment.`,
						logo_uri: '',
						callbacks: [
							`${clientUrl}/auth/code-callback`,
							`${clientUrl}/auth/silent-code-callback`
						],
						allowed_origins: [
							clientUrl
						],
						allowed_logout_urls: [
							`${clientUrl}/auth/logged-out`
						],
						grant_types: [
							'authorization_code'
						],
						token_endpoint_auth_method: 'none',
						app_type: 'native',
						oidc_conformant: true,
						jwt_configuration: {
							lifetime_in_seconds: 600,
							scopes: {},
							alg: 'RS256'
						},
					}
				});
			});
	}
	getConnections(){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'GET',
					url: this._getUrl('/api/v2/connections'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true
				});
			});
	}
	createConnection(name,enabledClients){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl('/api/v2/connections'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						name: name,
						strategy: 'auth0',
						enabled_clients: enabledClients,
						options: {
							passwordPolicy: 'excellent',
							disable_signup: true,
							requires_username: false,
							brute_force_protection: true,
							strategy_version: 2,
							password_no_personal_info: {
								enable: false
							},
							password_dictionary: {
								enable: true,
								dictionary: []
							},
							password_history: {
								enable: true,
								size: 5
							},
							password_complexity_options: {
								min_length: 8
							}
						},
					}
				});
			});
	}
	getRoles(){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'GET',
					url: this._getUrl('/api/v2/roles'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true
				});
			});
	}
	createRole(name, description) {
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl('/api/v2/roles'),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						name: name,
						description: description
					}
				});
			});
	}
	getRolePermissions(roleId){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'GET',
					url: this._getUrl(`/api/v2/roles/${roleId}/permissions`),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true
				});
			});
	}
	addPermissionsToRole(roleId,permissions){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'POST',
					url: this._getUrl(`/api/v2/roles/${roleId}/permissions`),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						permissions
					}
				});
			});
	}
	removePermissionsFromRole(roleId,permissions){
		return this._getAccessToken()
			.then((accessToken)=>{
				return this.__makeAuth0Request({
					method: 'DELETE',
					url: this._getUrl(`/api/v2/roles/${roleId}/permissions`),
					headers: {
						'Authorization': `Bearer ${accessToken}`
					},
					json: true,
					body: {
						permissions					}
				});
			});
	}
}
module.exports = Auth0;
