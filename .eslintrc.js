module.exports = {
	"plugins": [
	],
	"parserOptions": {
		"sourceType": "module"
	},
	"env": {
		"es6": true,
		"node": true,
		"mocha": true
	},
	"extends": "eslint:recommended",
	"rules": {
		"no-console": ["error"],
		"indent": [
			"warn",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"warn",
			"single", 
			{ "allowTemplateLiterals": true }
		],
		"semi": [
			"error",
			"always"
		]
	}
};