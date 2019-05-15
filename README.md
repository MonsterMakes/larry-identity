# @monstermakes/larry-identity

[![https://nodei.co/npm/@monstermakes/larry-identity.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/@monstermakes/larry-identity.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/@monstermakes/larry-identity)


## Description
A user and authorization/authentication service based on auth0.

## Environment Variables
* API_URI 
	* This is the external URI to this API 
* AUTH0_DEFAULT_CONNECTION
	* The default connection for the Auth Service to connect to.
* AUTH0_DOMAIN
	* This is the uri pointing to the root AUTH0 tenants domain.
* AUTH0_CLIENT_ID
	* This is the id of the AUTH0 application used for authentication.
* AUTH0_CLIENT_SECRET 
	* This is the secret of the AUTH0 application used for authentication.
* JWKS_URI
	* This is the uri pointing to the JSON web Key set, see [auth0 docs](https://auth0.com/docs/jwks) for more info.
	* Example
		* https://{{AUTH0_DOMAIN}}/.well-known/jwks.json
* ISSUER
	* This is the issuer (iss claim) of the JWT tokens.
		* In our case this is the AUTH0 tenant's domain
	* Example
		* https://{{AUTH0_DOMAIN}}/
* AUDIENCE
	* This is the OIDC audience (aud claim) 
		* The unique identifier of the AUTH0 API

### Set environment shell template
```
export JWKS_URI=https://{{CHANGE_ME}}/.well-known/jwks.json;
export ISSUER=https://{{CHANGE_ME}}/;
export AUDIENCE={{CHANGE_ME}};
export AUTH0_DOMAIN={{CHANGE_ME}};
export AUTH0_CLIENT_ID={{CHANGE_ME}};
export AUTH0_CLIENT_SECRET={{CHANGE_ME}};
export API_URI={{CHANGE_ME}};
export AUTH0_DEFAULT_CONNECTION={{CHANGE_ME}};
```

## Remote debugging the dev docker container
- Simply add the code below to your 
```
{
	"type": "node",
	"request": "attach",
	"name": "Node: Nodemon",
	"restart": true,
	"protocol": "inspector",
	"address": "127.0.0.1",
	"port": 9229,
	"localRoot": "${workspaceRoot}/",
	"remoteRoot": "/usr/src/app/"
}
```
## TODO
