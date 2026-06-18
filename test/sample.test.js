import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

import { sorl2pac } from "../src/index.js";

test("sorl2pac converts the checked-in basic fixture", async () => {
	const fixtureUrl = new URL("./fixtures/basic.sorl", import.meta.url);
	const sorl = await readFile(fixtureUrl, "utf8");
	const results = {
		matched: "DIRECT",
		unmatched: "PROXY 127.0.0.1:7890",
	};
	const source = sorl2pac(sorl, results);
	const { FindProxyForURL, __sorl2pacRules } = vm.runInNewContext(`${source}\n({ FindProxyForURL, __sorl2pacRules })`);

	assertFixtureRuleCoverage(sorl);
	assert.equal(FindProxyForURL("https://example.test/", "example.test"), results.matched);
	assert.equal(FindProxyForURL("https://sub.example.test/", "sub.example.test"), results.matched);
	assert.equal(FindProxyForURL("https://10.1.2.3/", "10.1.2.3"), results.matched);
	assert.equal(FindProxyForURL("https://172.16.2.3/", "172.16.2.3"), results.matched);
	assert.equal(FindProxyForURL("https://172.30.1.25/", "172.30.1.25"), results.matched);
	assert.equal(FindProxyForURL("https://foobar.com/", "foobar.com"), results.matched);
	assert.equal(FindProxyForURL("https://api.foobar.com/", "api.foobar.com"), results.matched);
	assert.equal(FindProxyForURL("https://blocked.test/", "blocked.test"), results.unmatched);
	assert.equal(FindProxyForURL("https://11.1.2.3/", "11.1.2.3"), results.unmatched);
	assert.equal(FindProxyForURL("https://172.17.2.3/", "172.17.2.3"), results.unmatched);
	assert.equal(FindProxyForURL("https://172.30.2.25/", "172.30.2.25"), results.unmatched);
	assert.equal(FindProxyForURL("https://bar.com/", "bar.com"), results.unmatched);
	assert.equal(FindProxyForURL("https://api.bar.com/", "api.bar.com"), results.unmatched);
	assert.equal(FindProxyForURL("https://anotherfoobar.com/", "anotherfoobar.com"), results.unmatched);
	assert.equal(FindProxyForURL("https://unmatched.invalid/", "unmatched.invalid"), results.unmatched);

	assert.equal(firstMatchedRule(__sorl2pacRules, "example.test").exclusive, false);
	assert.equal(firstMatchedRule(__sorl2pacRules, "10.1.2.3").exclusive, false);
	assert.equal(firstMatchedRule(__sorl2pacRules, "172.16.2.3").exclusive, false);
	assert.equal(firstMatchedRule(__sorl2pacRules, "172.30.1.25").exclusive, false);
	assert.equal(firstMatchedRule(__sorl2pacRules, "foobar.com").exclusive, false);
	assert.equal(firstMatchedRule(__sorl2pacRules, "api.foobar.com").exclusive, false);
	assert.equal(firstMatchedRule(__sorl2pacRules, "blocked.test").exclusive, true);
	assert.equal(firstMatchedRule(__sorl2pacRules, "11.1.2.3").exclusive, true);
	assert.equal(firstMatchedRule(__sorl2pacRules, "172.17.2.3").exclusive, true);
	assert.equal(firstMatchedRule(__sorl2pacRules, "172.30.2.25").exclusive, true);
	assert.equal(firstMatchedRule(__sorl2pacRules, "bar.com").exclusive, true);
	assert.equal(firstMatchedRule(__sorl2pacRules, "api.bar.com").exclusive, true);
});

function assertFixtureRuleCoverage(sorl) {
	const rules = sorl
		.split(/\r\n?|\n/)
		.map((line) => line.trim())
		.filter((line) => line !== "" && !line.startsWith(";") && !line.startsWith("@") && !line.startsWith("["));
	const positiveRules = new Set(rules.filter((rule) => !rule.startsWith("!")));
	const exclusiveRules = new Set(rules.filter((rule) => rule.startsWith("!")).map((rule) => rule.slice(1)));

	assert.deepEqual(rules, [...new Set(rules)], "fixture rules must not be duplicated");
	assert.equal(
		rules.findIndex((rule) => rule.startsWith("!")),
		rules.findLastIndex((rule) => !rule.startsWith("!")) + 1,
		"positive and exclusive fixture rules must be grouped",
	);

	for (const rule of ["*.example.test", "10.*.*.*", "172.16.*.*", "172.30.1.*", "foobar.com", "**.foobar.com"]) {
		assert.equal(positiveRules.has(rule), true, `${rule} must be covered by the fixture`);
	}

	for (const rule of ["*.blocked.test", "11.*.*.*", "172.17.*.*", "172.30.2.*", "bar.com", "**.bar.com"]) {
		assert.equal(exclusiveRules.has(rule), true, `!${rule} must be covered by the fixture`);
	}
}

function firstMatchedRule(rules, host) {
	for (const rule of rules) {
		if (rule.regexp.test(host)) {
			return rule;
		}
	}

	return null;
}
