const globals = require("globals");
const pluginJs = require("@eslint/js");
const stylistic = require("./config/eslint/stylistic.cjs");

module.exports = [
	{
		ignores: ["**/dist/*"],
	},

	pluginJs.configs.recommended,

	// Default: CommonJS (VS Code extension + utilities)
	{
		files: ["**/*.js", "**/*.mjs"],
		languageOptions: {
			sourceType: "commonjs",
			globals: {
				...globals.node,
				...globals.browser,
			},
		},
	},

	// Tests: ESM (Vitest)
	{
		files: ["**/*.test.js"],
		languageOptions: {
			sourceType: "module",
			globals: {
				...globals.node,
			},
		},
	},

	stylistic,
];
