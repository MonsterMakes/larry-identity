'use strict';
const ManagementClient = require('auth0').ManagementClient;
const URL = require('url').URL;

class Auth0 {
	constructor(auth0Domain = process.env['AUTH0_DOMAIN'], clientId = process.env['CLIENT_ID'], clientSecret = process.env['CLIENT_SECRET']) {
		const auth0Url = new URL(auth0Domain);
		
		this._auth0 = new ManagementClient({
			domain: auth0Url.hostname,
			clientId: clientId,
			clientSecret: clientSecret
		});
	}

	createApi(name, identifier, scopes) {
		return this._auth0.createResourceServer({
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
		});
	}
	getAPIs(){
		return this._auth0.getResourceServers();
	}
	getRules(){
		return this._auth0.getRules();
	}
	createRule(name,script,order=undefined){
		return this._auth0.createRule({
			name: name,
			script: script,
			order: order,
			enabled: true
		});
	}
	getClients(){
		return this._auth0.getClients();
	}
	createClient(name,clientUrl){
		return this._auth0.createClient({
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
			}
		});
	}
	getConnections(){
		return this._auth0.getConnections();
	}
	createConnection(name,enabledClients){
		return this._auth0.createConnection({
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
		});
	}
	getRoles(){
		return this._auth0.getRoles();
	}
	createRole(name, description) {
		return this._auth0.createRole({
			name: name,
			description: description
		});
	}
	getRolePermissions(roleId){
		return this._auth0.getPermissionsInRole({id:roleId});
	}
	addPermissionsToRole(roleId,permissions){
		return this._auth0.addPermissionsInRole({id:roleId},{
			permissions
		});
	}
	removePermissionsFromRole(roleId,permissions){
		return this._auth0.removePermissionsFromRole({id:roleId},{
			permissions
		});
	}
}
module.exports = Auth0;
