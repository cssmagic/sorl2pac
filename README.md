# sorl2pac

Convert SwitchyOmega rule lists (`*.sorl`) to PAC scripts.

## Usage

```js
import { sorl2pac } from "sorl2pac";

const pacSource = sorl2pac(sorlText, {
	matched: "DIRECT",
	unmatched: "PROXY 127.0.0.1:7890",
});
```

`pacSource` is a complete PAC script. It contains an internal `match(host)` helper and a standard `FindProxyForURL(url, host)` function.

```js
function FindProxyForURL(url, host) {
	return match(host) ? "DIRECT" : "PROXY 127.0.0.1:7890";
}
```

## API

```ts
function sorl2pac(
	sorl: string,
	results: {
		matched: string;
		unmatched: string;
	},
): string;
```

- `sorl` must be a string containing a supported SwitchyOmega rule list.
- `results.matched` is returned by `FindProxyForURL()` when `match(host)` is `true`.
- `results.unmatched` is returned when `match(host)` is `false`.
- `match(host)` is generated inside the PAC script. It is not an extra package export.

`sorl2pac()` throws `TypeError` for invalid API arguments and `SyntaxError` for unsupported rule-list syntax.

## Supported Syntax

This package intentionally supports a small SwitchyOmega new-format subset:

- `[SwitchyOmega Conditions]`
- blank lines
- `;` comment lines
- `@note` lines
- bare `HostWildcardCondition` rules, such as `*.example.com`
- host wildcard prefixes: `HostWildcard:`, `HostWildcardCondition:`, `Host:`, `H:`, `W:`, `HW:`
- `!` exclusive rules

Unsupported syntax fails instead of being ignored, including old `#BEGIN` rule lists, `@with result`, `+profile`, URL conditions, IP conditions, time conditions, and AutoProxy syntax.

## Matching Behavior

- Rules are checked from top to bottom.
- A normal rule match returns `true`.
- An exclusive rule match returns `false`.
- No match returns `false`.
- An empty rule list is valid and always returns `false`.
- `*.abc.com` matches both `abc.com` and `sub.abc.com`.
- `**.abc.com` matches `sub.abc.com` but not `abc.com`.

Because `results` is configurable, callers can use the same rules for whitelist or blacklist behavior.

```js
const whitelistPac = sorl2pac(sorlText, {
	matched: "DIRECT",
	unmatched: "PROXY 127.0.0.1:7890",
});

const blacklistPac = sorl2pac(sorlText, {
	matched: "PROXY 127.0.0.1:7890",
	unmatched: "DIRECT",
});
```
