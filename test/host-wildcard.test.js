import assert from "node:assert/strict";
import { test } from "node:test";

import { hostWildcardToRegExpSource, matchesHostWildcard } from "../src/host-wildcard.js";

test("matchesHostWildcard treats leading star-dot as main domain plus subdomains", () => {
	assert.equal(matchesHostWildcard("*.example.com", "example.com"), true);
	assert.equal(matchesHostWildcard("*.example.com", "a.example.com"), true);
	assert.equal(matchesHostWildcard("*.example.com", "a.b.example.com"), true);
	assert.equal(matchesHostWildcard("*.example.com", "anotherexample.com"), false);
	assert.equal(matchesHostWildcard("*.abc.com", "abc.com"), true);
	assert.equal(matchesHostWildcard("*.abc.com", "sub.abc.com"), true);
});

test("matchesHostWildcard treats leading dot as main domain plus subdomains", () => {
	assert.equal(matchesHostWildcard(".example.com", "example.com"), true);
	assert.equal(matchesHostWildcard(".example.com", "a.example.com"), true);
	assert.equal(matchesHostWildcard(".example.com", "example.com.test"), false);
});

test("matchesHostWildcard treats leading double-star-dot as subdomains only", () => {
	assert.equal(matchesHostWildcard("**.example.com", "example.com"), false);
	assert.equal(matchesHostWildcard("**.example.com", "a.example.com"), true);
	assert.equal(matchesHostWildcard("**.example.com", "a.b.example.com"), true);
});

test("matchesHostWildcard supports exact and generic wildcard patterns", () => {
	assert.equal(matchesHostWildcard("example.com", "example.com"), true);
	assert.equal(matchesHostWildcard("example.com", "a.example.com"), false);
	assert.equal(matchesHostWildcard("10.*.*.*", "10.1.2.3"), true);
	assert.equal(matchesHostWildcard("10.*.*.*", "11.1.2.3"), false);
	assert.equal(matchesHostWildcard("*.cn", "example.cn"), true);
});

test("matchesHostWildcard lowercases hosts and escapes regex metacharacters", () => {
	assert.equal(matchesHostWildcard("*.Example.com", "A.EXAMPLE.COM"), true);
	assert.equal(matchesHostWildcard("*.a+b.com", "x.a+b.com"), true);
	assert.equal(matchesHostWildcard("*.a+b.com", "x.aaab.com"), false);
	assert.equal(matchesHostWildcard("literal$.example.com", "literal$.example.com"), true);
});

test("hostWildcardToRegExpSource returns anchored expressions", () => {
	const source = hostWildcardToRegExpSource("*.example.com");
	const regexp = new RegExp(source);

	assert.equal(regexp.test("example.com"), true);
	assert.equal(regexp.test("a.example.com"), true);
	assert.equal(regexp.test("a.example.com.test"), false);
});
