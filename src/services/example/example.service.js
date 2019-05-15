'use strict';

class Example {
	constructor(context){
		this._apiServer = context.apiServer;
	}
	/**
	 * @swagger
	 * /example-public:
	 *   get:
	 *     serviceMethod: Example.public
	 *     description: Public endpoint to check the current health of the application.
	 *     tags: [example]
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: Server is alive, and here is the current application status.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               required:
	 *                 - status
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                   enum:
	 *                     - INITIALIZING
	 *                     - UNKNOWN
	 *                     - STARTING
	 *                     - LISTENING
	 *                     - CONNECTED
	 *                     - ERRORD
	 */
	public(requestHelper,responseHelper){//eslint-disable-line
		return {
			status: this._apiServer.getStatus()
		};
	}
	/**
	 * @swagger
	 * /example-private:
	 *   get:
	 *     serviceMethod: Example.private
	 *     serviceMiddlewares: 
	 *       - AuthorizationMiddleware.validateAccessToken
	 *       - AuthorizationMiddleware.authorizeAccessToken
	 *     description: Private endpoint with no required scopes to check the current health of the application.
	 *     tags: [example]
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: Server is alive, and here is the current application status.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               required:
	 *                 - status
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                   enum:
	 *                     - INITIALIZING
	 *                     - UNKNOWN
	 *                     - STARTING
	 *                     - LISTENING
	 *                     - CONNECTED
	 *                     - ERRORD
	 */
	private(requestHelper,responseHelper){//eslint-disable-line
		return {
			status: this._apiServer.getStatus()
		};
	}
	/**
	 * @swagger
	 * /example-private-scoped:
	 *   get:
	 *     serviceMethod: Example.privateScoped
	 *     serviceMiddlewares: 
	 *       - AuthorizationMiddleware.validateAccessToken
	 *       - AuthorizationMiddleware.authorizeAccessToken
	 *     requiredScopes:
	 *       - read:things
	 *     description: Private endpoint with no required scopes to check the current health of the application.
	 *     tags: [example]
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: Server is alive, and here is the current application status.
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               required:
	 *                 - status
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                   enum:
	 *                     - INITIALIZING
	 *                     - UNKNOWN
	 *                     - STARTING
	 *                     - LISTENING
	 *                     - CONNECTED
	 *                     - ERRORD
	 */
	privateScoped(requestHelper,responseHelper){//eslint-disable-line
		return {
			status: this._apiServer.getStatus()
		};
	}
}
module.exports = Example;