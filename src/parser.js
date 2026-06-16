const HEADER = "[SwitchyOmega Conditions]";
const HOST_WILDCARD_PREFIXES = new Set([
	"h",
	"w",
	"hw",
	"host",
	"hostwildcard",
	"hostwildcardcondition",
]);

export function parseSorl(source) {
	if (typeof source !== "string") {
		throw new TypeError("sorl source must be a string");
	}

	const lines = source.split(/\r\n?|\n/);
	const headerIndex = lines.findIndex((line) => line.trim() !== "");
	if (headerIndex === -1 || lines[headerIndex].trim() !== HEADER) {
		throw syntaxError(headerIndex === -1 ? 1 : headerIndex + 1, "Expected [SwitchyOmega Conditions] header");
	}

	const rules = [];
	for (let index = headerIndex + 1; index < lines.length; index += 1) {
		const lineNumber = index + 1;
		const line = lines[index].trim();

		if (line === "" || line.startsWith(";")) {
			continue;
		}

		if (line.startsWith("@note")) {
			continue;
		}

		if (line === "#BEGIN" || line.startsWith("#BEGIN")) {
			throw syntaxError(lineNumber, "Old Switchy rule-list format is not supported");
		}

		if (line === "@with result" || line.includes(" +")) {
			throw syntaxError(lineNumber, "Result-profile mode is not supported");
		}

		rules.push(parseRuleLine(line, lineNumber));
	}

	return rules;
}

function parseRuleLine(line, lineNumber) {
	let exclusive = false;
	let rest = line;

	if (rest.startsWith("!")) {
		exclusive = true;
		rest = rest.slice(1).trim();
		if (rest === "") {
			throw syntaxError(lineNumber, "Exclusive rule must include a pattern");
		}
	}

	const prefixed = rest.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
	if (prefixed) {
		const [, rawPrefix, rawPattern] = prefixed;
		const prefix = rawPrefix.toLowerCase();
		if (!HOST_WILDCARD_PREFIXES.has(prefix)) {
			throw syntaxError(lineNumber, `Unsupported condition type: ${rawPrefix}`);
		}

		const pattern = rawPattern.trim();
		if (pattern === "") {
			throw syntaxError(lineNumber, "Host wildcard pattern must not be empty");
		}

		return { pattern, exclusive, line: lineNumber };
	}

	if (/^[A-Za-z]+:/.test(rest)) {
		const [rawPrefix] = rest.split(":", 1);
		throw syntaxError(lineNumber, `Unsupported condition type: ${rawPrefix}`);
	}

	if (/\s/.test(rest)) {
		throw syntaxError(lineNumber, "Rule pattern must not contain whitespace");
	}

	return { pattern: rest, exclusive, line: lineNumber };
}

function syntaxError(line, message) {
	return new SyntaxError(`line ${line}: ${message}`);
}
