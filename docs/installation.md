---
title: Installation
order: 1
---

Moon can be used either as a **single vendored browser bundle** or as an npm package compiled ahead of time. This fork is biased toward the browser-first, single-file workflow.

The view layer uses a JSX-like language embedded in JavaScript for creating views.

## Browser (single-file bundle)

The simplest way to use Moon in a browser is to build the `moon-web` bundle once and copy it into your project:

```sh
npm install
npm test -- --runInBand   # optional but recommended
npm run build             # produces packages/moon-web/dist/moon-web.min.js
```

Then reference the bundle from any static HTML page:

```html
<div id="root"></div>
<script src="/static/moon-web.min.js"></script>
<script type="text/moon">
	Moon.view.mount(document.getElementById("root"));

	var count = 0;
	function render() {
		Moon.m.view = (
			<div className="app">
				<h1>{'Count: ' + count}</h1>
				<button onClick={() => { count++; render(); }}>
					Increment
				</button>
			</div>
		);
	}

	render();
</script>
```

- All compilation happens in the browser via `<script type="text/moon">`.
- The page works over `file://` or any static server; no CDN is required.
- See [Browser](/browser) for a deeper walkthrough of `Moon.view.mount`, `Moon.m.view`, JSX rules, helpers, and strict mode.

## CLI

Moon CLI can generate a scalable application with support for:

* Moon view language
* Hot module reloading
* Next generation CSS and JavaScript
* Optimized production builds

Moon CLI can be installed through `npm` and ran with `moon`.

```sh
npm install -g moon-cli
moon create my-app
```

## NPM

Moon can be manually installed through `npm`. To use the Moon view language with your build system, Moon provides a `moon-compiler` module along with modules for most bundlers, including Webpack and Rollup.

```sh
npm install moon
npm install moon-compiler
```

#### Webpack

```sh
npm install moon-loader
```

```js
// webpack.config.js
module.exports = {
	module: {
		rules: [
			{ test: /\.js/, use: "moon-loader" }
		]
	}
};
```

#### Rollup

```sh
npm install rollup-plugin-moon
```

```js
// rollup.config.js
import MoonPlugin from "rollup-plugin-moon";

export default {
	plugins: [
		MoonPlugin()
	]
};
```

If you prefer to compile Moon views ahead of time, you can also pair the runtime bundle `packages/moon/dist/moon.min.js` with `packages/moon-browser/dist/moon-browser.min.js` and use the same `<script type="text/moon">` workflow as the single-file bundle.
