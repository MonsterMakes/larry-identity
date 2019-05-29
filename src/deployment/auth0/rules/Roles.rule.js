function rolesRule(user, context, callback) {
	const namespace = '{{namespace}}';
	const assignedRoles = (context.authorization || {}).roles;

	let idTokenClaims = context.idToken || {};

	idTokenClaims[`${namespace}/roles`] = assignedRoles;

	context.idToken = idTokenClaims;
	callback(null, user, context);
}