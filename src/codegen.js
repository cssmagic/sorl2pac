import { hostWildcardToRegExpSource } from "./host-wildcard.js";

export function generatePac(rules, results) {
	const ruleEntries = rules.map((rule) => {
		const regexpLiteral = toRegExpLiteral(hostWildcardToRegExpSource(rule.pattern));
		return `\t{ regexp: ${regexpLiteral}, exclusive: ${rule.exclusive ? "true" : "false"} }`;
	});

	const matched = JSON.stringify(results.matched);
	const unmatched = JSON.stringify(results.unmatched);
	const rulesSource = ruleEntries.length > 0 ? `\n${ruleEntries.join(",\n")}\n` : "";

	return [
		`var __sorl2pacRules = [${rulesSource}];`,
		"",
		"function match(host) {",
		"\tvar value = String(host == null ? \"\" : host).toLowerCase();",
		"\tfor (var index = 0; index < __sorl2pacRules.length; index += 1) {",
		"\t\tvar rule = __sorl2pacRules[index];",
		"\t\tif (rule.regexp.test(value)) {",
		"\t\t\treturn !rule.exclusive;",
		"\t\t}",
		"\t}",
		"\treturn false;",
		"}",
		"",
		"function FindProxyForURL(url, host) {",
		`\treturn match(host) ? ${matched} : ${unmatched};`,
		"}",
		"",
	].join("\n");
}

function toRegExpLiteral(source) {
	return `/${source.replaceAll("/", "\\/")}/`;
}
