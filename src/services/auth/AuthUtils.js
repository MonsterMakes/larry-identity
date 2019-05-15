'use strict';
const crypto = require('crypto');

class AuthUtils{
	static base64UrlEncode(str){
		return str.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	}
	static createStateParam(){
		return AuthUtils.createCodeVerifier();
	}
	static createCodeVerifier(){
		let randStr = crypto.randomBytes(32);
		return AuthUtils.base64UrlEncode(randStr);
	}

	static createCodeChallenge(codeVerifier){
		const hmac = crypto.createHmac('sha256',codeVerifier);
		return AuthUtils.base64UrlEncode(hmac.digest());
	}
}
module.exports=AuthUtils;

//TODO IS THIS CLASS NEEDED?