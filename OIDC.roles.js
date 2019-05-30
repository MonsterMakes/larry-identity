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
				read: true
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