export function hostWildcardToRegExpSource(pattern) {
	if (typeof pattern !== "string") {
		throw new TypeError("host wildcard pattern must be a string");
	}

	const normalized = pattern.trim().toLowerCase();

	if (normalized.startsWith("**.")) {
		const domain = normalized.slice(3);
		return `^.+\\.${escapeRegExp(domain)}$`;
	}

	if (normalized.startsWith("*.")) {
		return domainAndSubdomainsSource(normalized.slice(2));
	}

	if (normalized.startsWith(".")) {
		return domainAndSubdomainsSource(normalized.slice(1));
	}

	return `^${wildcardToRegExp(normalized)}$`;
}

export function matchesHostWildcard(pattern, host) {
	const normalizedHost = String(host ?? "").toLowerCase();
	return new RegExp(hostWildcardToRegExpSource(pattern)).test(normalizedHost);
}

function domainAndSubdomainsSource(domain) {
	const escapedDomain = escapeRegExp(domain);
	return `^(?:${escapedDomain}|.+\\.${escapedDomain})$`;
}

function wildcardToRegExp(pattern) {
	let source = "";

	for (const char of pattern) {
		if (char === "*") {
			source += ".*";
		} else if (char === "?") {
			source += ".";
		} else {
			source += escapeRegExp(char);
		}
	}

	return source;
}

function escapeRegExp(value) {
	return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}
