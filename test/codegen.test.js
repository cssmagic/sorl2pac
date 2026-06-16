import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";

import { sorl2pac } from "../src/index.js";

const results = {
	matched: "DIRECT",
	unmatched: "PROXY 127.0.0.1:7890",
};

test("sorl2pac generates match and FindProxyForURL functions", () => {
	const source = sorl2pac("[SwitchyOmega Conditions]\n*.example.com", results);

	assert.match(source, /function match\(host\)/);
	assert.match(source, /function FindProxyForURL\(url, host\)/);

	const { match, FindProxyForURL } = evaluatePac(source);
	assert.equal(match("EXAMPLE.COM"), true);
	assert.equal(FindProxyForURL("https://example.com/", "example.com"), "DIRECT");
});

test("generated match respects exclusive rules and non-matches", () => {
	const source = sorl2pac(
		[
			"[SwitchyOmega Conditions]",
			"!blocked.example.com",
			"*.example.com",
		].join("\n"),
		results,
	);
	const { match, FindProxyForURL } = evaluatePac(source);

	assert.equal(match("blocked.example.com"), false);
	assert.equal(FindProxyForURL("https://blocked.example.com/", "blocked.example.com"), results.unmatched);
	assert.equal(match("www.example.com"), true);
	assert.equal(FindProxyForURL("https://www.example.com/", "www.example.com"), results.matched);
	assert.equal(match("example.net"), false);
	assert.equal(FindProxyForURL("https://example.net/", "example.net"), results.unmatched);
});

test("generated match uses first-match order", () => {
	const source = sorl2pac(
		[
			"[SwitchyOmega Conditions]",
			"*.example.com",
			"!a.example.com",
		].join("\n"),
		results,
	);
	const { match, FindProxyForURL } = evaluatePac(source);

	assert.equal(match("a.example.com"), true);
	assert.equal(FindProxyForURL("https://a.example.com/", "a.example.com"), results.matched);
});

test("sorl2pac supports empty rule lists", () => {
	const source = sorl2pac("[SwitchyOmega Conditions]\n; no rules", results);
	const { match, FindProxyForURL } = evaluatePac(source);

	assert.equal(match("example.com"), false);
	assert.equal(FindProxyForURL("https://example.com/", "example.com"), results.unmatched);
});

test("sorl2pac does not bind results to a fixed whitelist scenario", () => {
	const source = sorl2pac("[SwitchyOmega Conditions]\n*.example.com", {
		matched: "PROXY 127.0.0.1:7890",
		unmatched: "DIRECT",
	});
	const { FindProxyForURL } = evaluatePac(source);

	assert.equal(FindProxyForURL("https://example.com/", "example.com"), "PROXY 127.0.0.1:7890");
	assert.equal(FindProxyForURL("https://example.net/", "example.net"), "DIRECT");
});

test("sorl2pac embeds PAC return values as safe string literals", () => {
	const matched = "DIRECT \"quoted\"\nNEXT";
	const unmatched = "PROXY 127.0.0.1:7890\\fallback";
	const source = sorl2pac("[SwitchyOmega Conditions]\n*.example.com", {
		matched,
		unmatched,
	});
	const { FindProxyForURL } = evaluatePac(source);

	assert.equal(FindProxyForURL("https://example.com/", "example.com"), matched);
	assert.equal(FindProxyForURL("https://example.net/", "example.net"), unmatched);
});

test("sorl2pac validates public API arguments", () => {
	assert.throws(() => sorl2pac(null, results), TypeError);
	assert.throws(() => sorl2pac("[SwitchyOmega Conditions]", null), TypeError);
	assert.throws(() => sorl2pac("[SwitchyOmega Conditions]", "DIRECT"), TypeError);
	assert.throws(() => sorl2pac("[SwitchyOmega Conditions]", { unmatched: "DIRECT" }), TypeError);
	assert.throws(() => sorl2pac("[SwitchyOmega Conditions]", { matched: "DIRECT" }), TypeError);
	assert.throws(
		() => sorl2pac("[SwitchyOmega Conditions]", { matched: "DIRECT", unmatched: 1 }),
		TypeError,
	);
});

function evaluatePac(source) {
	return vm.runInNewContext(`${source}\n({ match, FindProxyForURL })`);
}
