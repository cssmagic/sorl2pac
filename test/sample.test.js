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
	const { FindProxyForURL } = vm.runInNewContext(`${source}\n({ FindProxyForURL })`);

	assert.equal(FindProxyForURL("https://example.test/", "example.test"), results.matched);
	assert.equal(FindProxyForURL("https://sub.example.test/", "sub.example.test"), results.matched);
	assert.equal(FindProxyForURL("https://blocked.example.test/", "blocked.example.test"), results.unmatched);
	assert.equal(FindProxyForURL("https://10.1.2.3/", "10.1.2.3"), results.matched);
	assert.equal(FindProxyForURL("https://unmatched.invalid/", "unmatched.invalid"), results.unmatched);
});
