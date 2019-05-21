'use strict';

class Environment {
	constructor(context){
		this._apiServer = context.apiServer;
	}
	/**
	 * @swagger
	 * /environment/details:
	 *   get:
	 *     serviceMethod: Environment.details
	 *     description: Check the current health of the application.
	 *     tags: [health]
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
	 *                 - apiUrl
	 *                 - clientId
	 *                 - roleClaim
	 *               properties:
	 *                 apiUrl:
	 *                   type: string
	 *                 clientId:
	 *                   type: string
	 *                 roleClaim:
	 *                   type: string
	 */
	details(requestHelper,responseHelper){//eslint-disable-line
		return {
			uam: {
				apiUrl: process.env['API_URI'],
				clientId: process.env['AUTH0_CLIENT_ID'],
				roleClaim: process.env['AUTH0_ROLE_CLAIM']
			}
		};
	}
}
module.exports = Environment;