'use strict';

class Test {
	constructor(context){
		this._apiServer = context.ApiServer;
		this._testInjectible = context.TestInjectable;
		this._testInjectible.sayHi();
	}
	/**
	 * @swagger
	 * /test-query:
	 *   get:
	 *     serviceMethod: Test.testQuery
	 *     description: testQuery
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - name: id
	 *         in: query
	 *         description: ID of the object to fetch
	 *         required: true
	 *         schema:
	 *           type: array
	 *           style: simple
	 *           items:
	 *             type: string 
	 *     responses:
	 *       200:
	 *         description: testQuery
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
	testQuery(requestHelper,responseHelper){//eslint-disable-line
		return {
			status: this._apiServer.getStatus()
		};
	}
	/**
	 * @swagger
	 * /test-500-response:
	 *   get:
	 *     serviceMethod: Test.testQuery500
	 *     description: testQuery500
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: testQuery500
	 */
	testQuery500(requestHelper,responseHelper){//eslint-disable-line
		responseHelper.respondWithError('Bad things',{},500);
	}
	/**
	 * @swagger
	 * /test-throw:
	 *   get:
	 *     serviceMethod: Test.testThrow
	 *     description: testThrow
	 *     produces:
	 *       - application/json
	 *     responses:
	 *       200:
	 *         description: testThrow
	 */
	testThrow(requestHelper,responseHelper){//eslint-disable-line
		throw new Error('Another way to send a 400');
	}
	/**
	 * @swagger
	 * /test-post:
	 *	 post:
	 *     serviceMethod: Test.testPost
	 *     description: Example to demonstrate a post with a payload
	 *     requestBody:
	 *       description: Example Post
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - foo
	 *             properties:
	 *               foo:
	 *                 type: string
	 *               bar:
	 *                 type: object
	 *     responses:
	 *       '200':
	 *         description: pet response
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               required:
	 *                 - hi
	 *                 - data
	 *               properties:
	 *                 hi:
	 *                   type: string
	 *                 data:
	 *                   type: object
	 */
	testPost(requestHelper,responseHelper){//eslint-disable-line
		return {
			hi: 'Mom',
			data: requestHelper.getPayload()
		};
	}
	/**
	 * @swagger
	 * /test-param/{id}:
	 *	 get:
	 *     serviceMethod: Test.testPathParam
	 *     description: Example to demonstrate a post with a payload
	 *     parameters:
	 *       - name: id
     *         in: path
     *         description: ID of pet to use
     *         required: true
     *         schema:
     *           items:
     *             type: string
	 *     responses:
	 *       '200':
	 *         description: pet response
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               required:
	 *                 - id
	 *                 - requestHelper
	 *               properties:
	 *                 hi:
	 *                   type: string
	 *                 requestHelper:
	 *                   type: object
	 */
	testPathParam(requestHelper,responseHelper){//eslint-disable-line
		return {
			id: requestHelper.params.id,
			requestHelper: requestHelper
		};
	}
	/**
	 * @swagger
	 * /test-middleware:
	 *	 get:
	 *     serviceMethod: Test.testMiddlewareServiceMethod
	 *     serviceMiddlewares:
	 *       - Test.testMiddleware
	 *     description: Example to demonstrate middleware that mutates the request
	 */
	testMiddlewareServiceMethod(requestHelper,responseHelper){//eslint-disable-line
		return {
			oldRequest: requestHelper._request.__oldRequest,
			newRequest: requestHelper
		};
	}
}

Test.$context = {
	'ApiServer': true,
	'TestInjectable': {}
};
module.exports = Test;