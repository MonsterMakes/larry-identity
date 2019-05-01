'use strict';
const _ = require('lodash');

class Test {
	constructor(context){
		this._apiServer = context.apiServer;
	}
	
	testMiddleware(requestHelper,responseHelper){//eslint-disable-line
		let clonedRequest = _.cloneDeep(requestHelper);
		//alter things
		requestHelper.setParam('id','changed');
		//dont do this I am just doing it for testing purposes...
		requestHelper._request.__oldRequest = clonedRequest;
	}
}
module.exports = Test;