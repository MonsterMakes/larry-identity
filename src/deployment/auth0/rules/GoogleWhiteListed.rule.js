function googleWhiteListedRule(user, context, callback) {
	var whitelist = [{{authorizedDomains}}]; //authorized domains
	var emailSplit = user.email.split('@');
	var usersDomain = emailSplit[emailSplit.length - 1].toLowerCase();
	var userHasAccess = whitelist.some(
		function (domain) {
			return usersDomain === domain;
		});

	if (!userHasAccess) {
		return callback(new UnauthorizedError(`The domain (${usersDomain}) is not an authorized domain, access denied.`));
	}

	return callback(null, user, context);
}