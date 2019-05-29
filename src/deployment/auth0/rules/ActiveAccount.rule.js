function activeAccountRule(user, context, callback) {
	const namespace = '{{namespace}}';
	function base64UrlDecode(urlSafeStr) {
		let b64d = urlSafeStr
			.replace(/_/g, '/')
			.replace(/-/g, '+');
		let str = Buffer.from(b64d, 'base64').toString('binary');

		return str;
	}
	if (context.request.query.state) {
		try {
			let stateJsonStr = base64UrlDecode(context.request.query.state);
			try {
				let stateObj = JSON.parse(stateJsonStr);
				if (stateObj.activeAccountId) {
					//TODO check if they have permissions for this account
					let accessTokenClaims = context.accessToken || {};
				
					accessTokenClaims[`${namespace}/activeAccountId`] = stateObj.activeAccountId;
					context.accessToken = accessTokenClaims;
				}
			}
			catch (jsonError) {
				console.debug('State param is not a valid json object, state property must be a valid json string.', { base64UrlStateStr: context.request.query.state, error: jsonError });
				throw jsonError;
			}
		}
		catch(e){
			console.debug('Could not decode state param, state param must be a valid base64url json string.', { base64UrlStateStr: context.request.query.state, error: e });
			throw e;
		}
		callback(null, user, context);
	}
}