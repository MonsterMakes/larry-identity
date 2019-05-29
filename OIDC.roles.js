module.exports = { 
	support: {
		description: 'Support Role',
		scopes: {
			include: {
				ALL: true
			}
		}
	},
	owner: {
		description: 'Owner Role',
		scopes: {
			include: {
				ALL: true
			},
			exclude:{
				things: true
			}
		}
	},
	admin: {
		description: 'Admin Role',
		scopes: {
			include: {
				ALL: true
			},
			exclude:{
				things: {
					read: true,
					write: true
				},
				account: {
					write: true
				}
			}
		}
	},
	operator: {
		description: 'Operator Role',
		scopes: {
			include: {
				user: {
					read: true
				},
				account: {
					read: true
				}
			}
		}
	},
	attendant: {
		description: 'Attendant Role',
		scopes: {
			include: {
				read: true
			}
		}
	}
};