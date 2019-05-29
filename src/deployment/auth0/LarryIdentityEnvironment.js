'use strict';
const Auth0 = require('./Auth0');
const Handlebars = require('handlebars');
const fs = require('fs');
const pathUtils = require('path');
const _ = require('lodash');

const ROLES_RULE_NAME = 'LARRY-ROLES-RULE';

//TODO need to add support for multiple APIs
class LarryIdentityEnvironment {
	constructor(config) {
		//TODO throw error with friendly message to the developer
		this._environmentName = _.get(config, 'environmentName');
		this._environmentBaseUrl = _.get(config, 'environmentBaseUrl');
		this._envionmentClientUrl = _.get(config, 'envionmentClientUrl');
		this._roles = _.get(config, 'roles', []);
		this._scopes = _.get(config, 'scopes', []);
		this._auth0Domain = _.get(config, 'auth0Domain', process.env['AUTH0_DOMAIN']);
		this._clientId = _.get(config, 'clientId', process.env['CLIENT_ID']);
		this._clientSecret = _.get(config, 'clientSecret', process.env['CLIENT_SECRET']);

		if(_.get(config,'pathToOidcScopes')){
			this._convertOidcScopes(require(config.pathToOidcScopes));
		}
		if(_.get(config,'pathToOidcRoles')){
			this._convertOidcRoles(require(config.pathToOidcRoles));
		}
		this._auth0 = new Auth0(this._auth0Domain, this._clientId, this._clientSecret);
	}
	_convertOidcRoles(oidcRoles){
		let roles = [];
		Object.keys(oidcRoles).forEach((oidcRoleName)=>{
			let oidcRoleDefinition = oidcRoles[oidcRoleName];
			let role = {
				name: oidcRoleName,
				description: oidcRoleDefinition.description || `${oidcRoleName} role.`,
				scopes: []
			};
			
			let includeExtras = _.get(oidcRoleDefinition.scopes,'include');
			let excludeExtras = _.get(oidcRoleDefinition.scopes,'exclude');
			
			this._scopes.forEach(scope=>{
				let includeIt = false;
				let split = scope.value.split(':');
				let actionTypeShortName = split[0];
				let actionType;
				switch(actionTypeShortName){
				case 'r':
					actionType = 'read';
					break;
				case 'w':
					actionType = 'write';
					break;
				}
				let resourceName = split[1];
				//If we are including everything
				if(includeExtras.hasOwnProperty('ALL')){
					includeIt = true;
				}
				//If we are including by action type
				else if(includeExtras.hasOwnProperty(actionType)){
					includeIt = true;
				}
				//If we are including by resource
				else if(includeExtras.hasOwnProperty(resourceName)){
					//if we are including by resource and action type
					if(_.isPlainObject(includeExtras[resourceName])){ 
						if(includeExtras[resourceName].hasOwnProperty(actionType)){
							includeIt = true;
						}
					}
					else{
						includeIt = true;
					}
				}
				if(excludeExtras){
					//If we are excluding by resource
					if(excludeExtras.hasOwnProperty(resourceName)){
						//if we are excluding by resource and action type
						if(_.isPlainObject(excludeExtras[resourceName])){
							if(excludeExtras[resourceName].hasOwnProperty(actionType)){
								includeIt = false;
							}
						}
						else{
							includeIt = false;
						}
					}
					//If we are excluding by action type
					else if(excludeExtras.hasOwnProperty(actionType)){
						includeIt = false;
					}
				}	

				//If the above logic has determined this scope to be included push it
				if(includeIt){
					role.scopes.push({
						name: scope.value,
						description: scope.description,
						api: scope.api
					});
				}
			});
			roles.push(role);
		});
		this._roles = this._roles.concat(roles);
	}
	_convertOidcScopes(oidcScopes){
		let scopes = [];
		oidcScopes.forEach((scopeResourceName)=>{
			scopes.push({
				value: `r:${scopeResourceName}`,
				description: `Allows accessing the ${scopeResourceName} resource`
			});
			scopes.push({
				value: `w:${scopeResourceName}`,
				description: `Allows creating and updating the ${scopeResourceName} resource.`
			});
		});
		this._scopes = this._scopes.concat(scopes);
	}
	_verifyAuth0Resource(resourceName, retrieveAllFn, name, createFn) {
		return Promise.resolve()
			.then(() => {
				return retrieveAllFn();
			})
			.then((resp) => {
				let found = resp.find((rsc) => {
					if (rsc.name === name) {
						return true;
					}
				});
				return found;
			})
			.then((found) => {
				if (found) {
					console.info(`${resourceName} already exists not going to alter it...`, found);
					return found;
				}
				else {
					console.info(`${resourceName} does NOT exist creating it...`);

					return Promise.resolve()
						.then(() => {
							return createFn();
						})
						.then((creationResponse) => {
							console.info(`${resourceName} created.`, creationResponse);
							return creationResponse;
						});
				}
			});
	}

	deploy() {
		let rolesRuleDetails, apiDetails, clientDetails, roleDetails, connectionDetails;

		return Promise.resolve()
			.then(() => {
				return this.verifyRolesRule(this._environmentBaseUrl);
			})
			.then((rolesResponse) => {
				rolesRuleDetails = rolesResponse;
				return this.verifyApi();
			})
			.then((apiResponse) => {
				apiDetails = apiResponse;
				return this.verifyClient();
			})
			.then((clientResponse) => {
				clientDetails = clientResponse;
				return this.verifyConnection([clientDetails.client_id]);
			})
			.then((connectionResponse) => {
				connectionDetails = connectionResponse;
				return this.verifyRoles(apiDetails.identifier);
			})
			.then((roleDetails) => {
				console.info('All the produced things for your records.',{rolesRuleDetails, apiDetails, clientDetails, roleDetails, connectionDetails});
			});
		// .then(()=>{
		// 	//ADD the seeded user
		// })
	}
	verifyRolesRule(namespace = 'https://monstermakes.tech') {
		return this._verifyAuth0Resource(
			'Roles rule',
			() => {
				return this._auth0.getRules();
			},
			ROLES_RULE_NAME,
			() => {
				return new Promise((resolve, reject) => {
					fs.readFile(pathUtils.join(__dirname, './rules/Roles.rule.js'), 'utf8', (err, data) => {
						if (err) {
							reject(err);
						}
						else {
							let templateFn = Handlebars.compile(data);
							let source = templateFn({ namespace });
							resolve(source);
						}
					});
				}).then((ruleSource) => {
					return this._auth0.createRule(ROLES_RULE_NAME, ruleSource);
				});
			}
		);
	}
	verifyApi() {
		return this._verifyAuth0Resource(
			'API',
			() => {
				return this._auth0.getAPIs();
			},
			this._environmentName,
			() => {
				return this._auth0.createApi(this._environmentName, this._environmentBaseUrl, this._scopes);
			}
		);
	}
	verifyClient() {
		return this._verifyAuth0Resource(
			'Client',
			() => {
				return this._auth0.getClients();
			},
			this._environmentName,
			() => {
				return this._auth0.createClient(this._environmentName, this._envionmentClientUrl);
			}
		);
	}
	verifyConnection(clientIds) {
		return this._verifyAuth0Resource(
			'Connection',
			() => {
				return this._auth0.getConnections();
			},
			this._environmentName,
			() => {
				return this._auth0.createConnection(this._environmentName, clientIds);
			}
		);
	}
	verifyRoles(deafultApiIdentifier) {
		return Promise.resolve()
			.then(() => {
				return this._auth0.getRoles();
			})
			.then((rolesResponse) => {
				let proms = [];
				this._roles.forEach((roleDefinition) => {
					let found = rolesResponse.find((rsc) => {
						if (rsc.name === roleDefinition.name) {
							return true;
						}
					});
					proms.push(
						Promise.resolve()
							// verify that the role exists and has no associated permissions (a.k.a scopes)
							.then(() => {
								if (found) {
									console.info(`Role already exists going to remove permissions to gaurantee proper permissions are added...`, found);
									
									return Promise.resolve()
										.then(()=>{
											return this._auth0.getRolePermissions(found.id);
										})
										.then((permissions) => {
											if(permissions.length){
												permissions.forEach((p)=>{ delete p.resource_server_name; delete p.description; });
												return this._auth0.removePermissionsFromRole(found.id,permissions);
											}
										})
										.then(()=>{
											return found;
										});
								}
								else {
									return this._auth0.createRole(roleDefinition.name, roleDefinition.description)
										.then((creationResponse) => {
											console.info(`Role does NOT exist creating it...`);
											console.info(`Role created.`, creationResponse);
											return creationResponse;
										});
								}
							})
							//find the scopes that need to be associated with this role
							.then((auth0Role) => {
								let permissions = [];
								//TODO for now this assumes the scopes are associated with the API that was just verified
								//May need support for multiple APIs at some point
								roleDefinition.scopes.forEach(scopeDefinition => {
									let permission = {};
									if (_.isPlainObject(scopeDefinition)) {
										permission.resource_server_identifier = scopeDefinition.api || deafultApiIdentifier,
										permission.permission_name = scopeDefinition.name;
									}
									else if (_.isString(scopeDefinition)) {
										permission.resource_server_identifier = deafultApiIdentifier,
										permission.permission_name = scopeDefinition;
									}
									permissions.push(permission);
								});
								return this._auth0.addPermissionsToRole(auth0Role.id,permissions);
							})
					);
				});
				return Promise.all(proms);
			})
			//go fetch the latest roles in the system
			.then(() => {
				return this._auth0.getRoles();
			});
	}
}

module.exports = LarryIdentityEnvironment;

let identityEnv = new LarryIdentityEnvironment({
	auth0Domain: 'https://cobo-solutions.auth0.com',
	clientId: 'pJ4vhv4w2tNyMXKnI4936mCZDeOxTaVB',
	clientSecret: '_Udv6-Mp7tVq79yIlozlLyxCvIvypUj2M0gLXBoyiaguVeFq9qR32d7uMkSVZ8qS',
	environmentName: 'COBO-LOCAL-DEV',
	environmentBaseUrl: 'http://cobo.local',
	envionmentClientUrl: 'http://cobo.local:4200',
	pathToOidcScopes: '../../../OIDC.scopes.js',
	pathToOidcRoles: '../../../OIDC.roles.js'
});

identityEnv.deploy()
	.catch(e=>{
		console.error(e);
	});
