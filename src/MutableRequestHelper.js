'use strict';

const RequestHelper = require('./RequestHelper');
class MutableRequestHelper extends RequestHelper {
	constructor(req){
		super(req);
	}
	setParam(paramName,paramValue){
		this._request.params[paramName]=paramValue;
	}
	setPayload(payload){
		this._request.body = payload;
	}
	setQueryParams(params){
		this._request.query = params;
	}
	setQueryParam(queryName,queryValue){
		this._request.query[queryName]=queryValue;
	}
	setSubDomains(subdomains){
		this._request.subdomains = subdomains;
	}
	setHeader(headerName,headerValue){
		this._request.set(headerName,headerValue);
	}
	setBasicAuth(user,pass){
		let base64Str = new Buffer(`${user}:${pass}`, 'base64').toString();
		this.setHeader('Authorization',base64Str);
	}
	setBearerToken(tkn){
		this.setHeader('Authorization', `Bearer ${tkn}`);
	}
}
module.exports = MutableRequestHelper;