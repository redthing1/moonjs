<p align="center">
	<a href="https://moonjs.org" target="_blank">
		<img width="125" src="https://raw.githubusercontent.com/kbrsh/moon/gh-pages/img/logo.png">
	</a>
</p>
<h1 align="center">Moon</h1>
<p align="center">The minimal & fast library for functional user interfaces</p>
<p align="center">
	<a href="https://travis-ci.org/kbrsh/moon"><img src="https://travis-ci.org/kbrsh/moon.svg?branch=master" alt="Build Status"></a>
	<a href="https://codecov.io/gh/kbrsh/moon"><img src="https://codecov.io/gh/kbrsh/moon/branch/master/graph/badge.svg" alt="Code Coverage"></a>
	<a href="https://moon-slack.herokuapp.com"><img src="https://moon-slack.herokuapp.com/badge.svg" alt="Slack"></a>
	<a href="https://license.kabir.sh"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>

## Offline docs

- All docs are vendored in `docs/` (copied from `gh-pages/src`) for offline reference.

## Browser-only usage (single file)

- Build once: `npm run build`, then vendor `packages/moon-web/dist/moon-web.min.js` into your project. That one file is all you need for offline/browser-only usage.
- Include it with a plain script tag; it exposes a global `Moon` and compiles `<script type="text/moon">` inline (works over `file://`).
- Mount once: `Moon.view.mount(element)` binds a root. Render with `Moon.m.view = (<div>…</div>)`; handlers can be inline arrows or named functions.
- If you want smaller pieces: `packages/moon/dist/moon.min.js` (runtime only) or `packages/moon-browser/dist/moon-browser.min.js` (runtime + inline compiler).
- To sanity check the bundle offline: run `npm run build`, open `examples/moon-web-dashboard.html` directly from disk, and confirm the sample workspace renders and responds (tabs, filters, add/toggle/remove, priority bump). No CDN, no npm installs needed at runtime.

### Browser bundle workflow (no CDN, no npm at runtime)

1. Install deps once: `npm install`.
2. Test locally: `npm test -- --runInBand` (optional).
3. Build: `npm run build` (outputs `packages/moon-web/dist/moon-web.min.js`).
4. Vendor that single file into your project and reference it with `<script src="/path/to/moon-web.min.js"></script>`.
5. Author views in plain HTML using `<script type="text/moon">…</script>`; open the page directly via `file://` or any static server.
6. Examples: `examples/moon-web.html` (counter), `examples/moon-web-dashboard.html` (tabs/search/filter/add/toggle/remove/priority), and `examples/moon-web-kanban.html` (multi-column Kanban with filters/move) run offline once the bundle is vendored.

### JSX-ish language notes

- Attributes: `className`/`htmlFor` normalize to `class`/`for`; `dangerouslySetInnerHTML` maps to `innerHTML`.
- Hyphenated attributes (`aria-label`, `data-foo`) now pass through without hacks.
- Booleans: shorthand works (`disabled`, `autoFocus`, etc.).
- Handlers: JSX-style handlers (`onClick={() => ...}`) compile as expected.
- Spreads: `{...props}` is merged with explicit props via `Object.assign`.
- Keys: `key` on children triggers keyed diffing for more stable list updates (all siblings must have a `key` to enable keyed mode).
- Escape hatch: `innerHTML` is supported (use sparingly).
- Event aliases: `onChange` maps to `oninput`, `onDoubleClick` maps to `ondblclick`.
- Errors: compiler reports line/column with a caret to pinpoint parse issues.
- Fragments: `<>…</>` flatten into children.
- Object literals: attribute values like `style={color: "red"}` stay object literals.
- Children normalization: `{expr}` inside children can be a string/number, a node, or an array of nodes; everything is flattened via `Moon.view.normalizeChildren` so arrays from `map` render as expected and falsy values disappear.
- Styles: style objects accept hyphenated keys (`{"background-color": "#000"}` is normalized to `backgroundColor`) and camelCase keys.
- Refs: pass `ref={fnOrRefObj}` to get the underlying element in the browser bundle.
- Dev warnings: missing-key mixed siblings and unknown DOM props warn in development builds to catch JSX mistakes early.
- Helper: `Moon.view.cls()` merges class names from strings/arrays/objects (truthy entries only).
- Helper: `Moon.view.mergeProps()` shallow-merges objects, handy for combining spreads/defaults.
- Dev strictness: non-function event handlers, non-object `style`, unknown DOM props, mixed/duplicate keys all throw in development to keep JSX usage clean.

### Minimal examples

- One-file counter: see snippet below or `examples/moon-web.html`.
- Minimal dashboard (tabs/search/filter/add/toggle/remove/priority) using the single-file bundle and JSX-ish syntax: `examples/moon-web-dashboard.html` (works via file:// after `npm run build`).

### One-file snippet (works via file://)

```html
<div id="root"></div>
<script src="/path/to/moon-web.min.js"></script>
<script type="text/moon">
	// Bind Moon to the root element once.
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

Example (works via file://; also see `examples/moon-web.html`):

```html
<div id="root"></div>
<script src="/path/to/moon-web.min.js"></script>
<script type="text/moon">
	// Bind Moon to the root element once.
	Moon.view.mount(document.getElementById("root"));

	var count = 0;
	function render() {
		Moon.m.view = (
			<div class="app">
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

For a richer browser-only example (search/sort/filter/new item UI), open `examples/moon-web-dashboard.html` after a build.

### Summary

- :tada: Small file size (2kb minified + gzip)
- :zap: Blazing fast view rendering
- :hammer: Purely functional driver-based design
- :rocket: Intuitive & consistent API

### About

See [the about page](https://moonjs.org/about) for more information on why Moon was created.

### Usage

See [the documentation.](https://moonjs.org)

### Contributing

Check the [CONTRIBUTING](/CONTRIBUTING.md) file for more information about this project and how to help.

### Support

Support Moon [on Patreon](https://patreon.com/kbrsh) to help sustain the development of the project. The maker of the project works on open source for free. If you or your company depend on this project, then it makes sense to donate to ensure that the project is maintained.

### License

Licensed under the [MIT License](https://license.kabir.sh) by [kbrsh](https://kabir.sh)
