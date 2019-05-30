function activeAccountRule(user, context, callback) {
	const namespace = '{{namespace}}';
	function base64UrlDecode(urlSafeStr) {
		let b64d = urlSafeStr
			.replace(/_/g, '/')
			.replace(/-/g, '+');
		let str = Buffer.from(b64d, 'base64').toString('binary');

		return str;
	}
	//TODO
	let activeAccountId = "TODO-DEFAULT";
	if (context.request.query.state) {
		try {
			let stateJsonStr = base64UrlDecode(context.request.query.state);
			try {
				let stateObj = JSON.parse(stateJsonStr);
				if (stateObj.activeAccountId) {
					console.debug(`Found requested activeAccountId (${stateObj.activeAccountId}) in the State param...`);
					//TODO check if they have permissions for this account
					activeAccountId = stateObj.activeAccountId;
				}
			}
			catch (jsonError) {
				console.debug('State param is not a valid json object, state property must be a valid json string.', { base64UrlStateStr: context.request.query.state, error: jsonError });
				//throw jsonError;
			}
		}
		catch(e){
			console.debug('Could not decode state param, state param must be a valid base64url json string.', { base64UrlStateStr: context.request.query.state, error: e });
			//throw e;
		}
	}
	let accessTokenClaims = context.accessToken || {};
				
	accessTokenClaims[`${namespace}/activeAccountId`] = activeAccountId;
	context.accessToken = accessTokenClaims;
	console.debug(`Setting activeAccountId in the token to (${activeAccountId})...`);
	callback(null, user, context);
}
/*
NOTE: There is a bug in Auth0 system where on initial login the state property passed in is totally malformed, this prevents us from passing the activeAccountId via the scope on initial login.
For now this is fine we might have to detect this on the client side and in this weird case immediately re-request the tokens.
*/