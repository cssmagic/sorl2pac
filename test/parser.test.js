import assert from "node:assert/strict";
import { test } from "node:test";

import { parseSorl } from "../src/parser.js";

test("parseSorl parses supported SwitchyOmega host wildcard rules", () => {
	const source = [
		"[SwitchyOmega Conditions]",
		"",
		"; comment",
		"@note local domains",
		"*.example.com",
		"!*.blocked.example.com",
		"!Host: abc.com",
		"HostWildcard: static.example.net",
	].join("\n");

	assert.deepEqual(parseSorl(source), [
		{ pattern: "*.example.com", exclusive: false, line: 5 },
		{ pattern: "*.blocked.example.com", exclusive: true, line: 6 },
		{ pattern: "abc.com", exclusive: true, line: 7 },
		{ pattern: "static.example.net", exclusive: false, line: 8 },
	]);
});

test("parseSorl accepts empty rule lists", () => {
	const source = [
		"[SwitchyOmega Conditions]",
		"; comment",
		"@note no rules yet",
	].join("\r\n");

	assert.deepEqual(parseSorl(source), []);
});

test("parseSorl rejects missing SwitchyOmega header", () => {
	assert.throws(
		() => parseSorl("*.example.com"),
		(error) => error instanceof SyntaxError && /line 1/i.test(error.message),
	);
});

test("parseSorl rejects unsupported syntax with line numbers", () => {
	const cases = [
		["old format", "[SwitchyOmega Conditions]\n#BEGIN", /line 2/i],
		["result mode", "[SwitchyOmega Conditions]\n@with result", /line 2/i],
		["result profile", "[SwitchyOmega Conditions]\n*.example.com +direct", /line 2/i],
		["unsupported condition", "[SwitchyOmega Conditions]\nUrlWildcard: https://example.com/*", /line 2/i],
		["bare exclusive marker", "[SwitchyOmega Conditions]\n!", /line 2/i],
		["empty host pattern", "[SwitchyOmega Conditions]\nHost:", /line 2/i],
	];

	for (const [name, source, expectedMessage] of cases) {
		assert.throws(
			() => parseSorl(source),
			(error) => error instanceof SyntaxError && expectedMessage.test(error.message),
			name,
		);
	}
});
