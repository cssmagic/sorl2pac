[English](README.md) | 中文

# sorl2pac

> 将 SwitchyOmega 规则列表（`*.sorl`）转换为 PAC 脚本。



## 使用方法

```js
import { sorl2pac } from "sorl2pac";

const pacSource = sorl2pac(sorlText, {
	matched: "DIRECT",
	unmatched: "PROXY 127.0.0.1:7890",
});
```

`pacSource` 是一份完整的 PAC 脚本。它包含一个内部的 `match(host)` 辅助函数，以及标准的 `FindProxyForURL(url, host)` 函数。

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

- `sorl` 必须是一个字符串，内容为受支持的 SwitchyOmega 规则列表。
- 当 `match(host)` 为 `true` 时，`FindProxyForURL()` 会返回 `results.matched`。
- 当 `match(host)` 为 `false` 时，会返回 `results.unmatched`。
- `match(host)` 会生成在 PAC 脚本内部，它不是额外导出的包接口。

如果 API 参数无效，`sorl2pac()` 会抛出 `TypeError`；如果规则列表语法不受支持，则会抛出 `SyntaxError`。



## 支持的语法

这个包有意只支持一小部分 SwitchyOmega 新格式语法：

- `[SwitchyOmega Conditions]`
- 空行
- `;` 注释行
- `@note` 行
- 裸写的 `HostWildcardCondition` 规则，例如 `*.example.com`
- host 通配符前缀：`HostWildcard:`、`HostWildcardCondition:`、`Host:`、`H:`、`W:`、`HW:`
- `!` 排除规则

不受支持的语法会直接失败，而不是被忽略；这包括旧版 `#BEGIN` 规则列表、`@with result`、`+profile`、URL 条件、IP 条件、时间条件以及 AutoProxy 语法。



## 匹配行为

- 规则会从上到下依次检查。
- 普通规则命中时返回 `true`。
- 排除规则命中时返回 `false`。
- 没有规则命中时返回 `false`。
- 空规则列表是有效的，并且始终返回 `false`。
- `*.abc.com` 同时匹配 `abc.com` 和 `sub.abc.com`。
- `**.abc.com` 匹配 `sub.abc.com`，但不匹配 `abc.com`。

由于 `results` 可配置，调用方可以用同一份规则实现白名单或黑名单行为。

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



***

## License

> Any code contributed to this project is considered authorized for commercial use by the project authors and their affiliated companies and distributed under this project's license.
>
> 任何贡献到本项目的代码，均视为授权本项目作者及其关联公司用于商业用途，并可按本项目协议进行分发。

MIT
