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

- Build once: `npm run build`, then vendor `packages/moon-web/dist/moon-web.min.js` into your project.
- Include it with a plain script tag; it exposes a global `Moon` and compiles `<script type="text/moon">` inline.
- Use `Moon.view.mount(element)` once to bind to a root, and set `Moon.m.view = (<div>…</div>)` to render. Handlers can be named functions or inline arrows (e.g., `onClick={() => ...}`) now that the compiler unwraps `{}` in attribute values.
- If you prefer smaller pieces, use `packages/moon/dist/moon.min.js` alone, or add `packages/moon-browser/dist/moon-browser.min.js` for inline Moon scripts.
- JSX parity notes: `className`/`htmlFor` map to `class`/`for`, boolean shorthand works (`disabled`, `autoFocus`), JSX-style handlers are supported, and prop spread (`{...props}`) is allowed. Fragments (`<>…</>`) are not yet implemented.
- Extras: top-level spreads are merged (Object.assign), `innerHTML` is supported as an escape hatch, and children with `key` are diffed in a keyed mode when all siblings provide a `key`.

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

Licensed under the [MIT License](https://license.kabir.sh) by [Kabir Shah](https://kabir.sh)
