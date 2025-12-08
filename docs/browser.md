---
title: Browser
order: 6
---

This fork of Moon is designed to work well as a **single vendored file** in plain HTML. You build once, copy a `.min.js` file into your project, and write views inline using a JSX‑like language.

This page focuses on that browser‑only workflow. It assumes you are using the `moon-web` bundle and that you are not relying on the original `Moon.use` / `Moon.run` driver runner.

## Bundles and build

The repo ships several browser bundles:

- `packages/moon-web/dist/moon-web.min.js`  
  Full browser bundle: Moon runtime + inline compiler for `<script type="text/moon">`. This is the easiest way to use Moon in static HTML.
- `packages/moon/dist/moon.min.js`  
  Runtime only. Use this if you compile your Moon view files ahead of time with `moon-compiler`.
- `packages/moon-browser/dist/moon-browser.min.js`  
  Inline compiler for `<script type="text/moon">` without bundling the runtime.

To build the bundles once on your machine:

```sh
npm install
npm test -- --runInBand   # optional but recommended
npm run build
```

You can then vendor `moon-web.min.js` into any project and reference it with a normal `<script src>` tag. No CDN or runtime npm install is required after that.

## Mounting and rendering

The browser bundle exposes a global `Moon`. You bind it to a root DOM element once, and then assign to `Moon.m.view` whenever your UI changes.

```html
<div id="root"></div>
<script src="/static/moon-web.min.js"></script>
<script type="text/moon">
	// Attach Moon to an existing DOM node.
	Moon.view.mount(document.getElementById("root"));

	var state = { count: 0 };

	function setState(next) {
		// Accept either a value or an updater function.
		state = typeof next === "function" ? next(state) : next;
		render();
	}

	function render() {
		Moon.m.view = (
			<div className="counter">
				<h1>Count: {state.count}</h1>
				<button onClick={() => setState(s => ({ count: s.count + 1 }))}>
					Increment
				</button>
			</div>
		);
	}

	render();
</script>
```

Key ideas:

- `Moon.view.mount(element)` tells Moon where to attach. It reads the existing element and uses it as the virtual‑DOM root.
- `Moon.m.view` is the live view. Any time you assign a new value, Moon diffs it against the previous one and updates the DOM.
- State is just JavaScript. Use whatever patterns you prefer (simple variables, `setState`, small state machines).

## JSX‑ish view language in the browser

Moon’s view language is a JSX‑like extension that compiles down to calls into `Moon.view.components`. When you are working inside `<script type="text/moon">`, you can treat it as JSX with a few Moon‑specific rules.

### Tags and components

- HTML tags become calls into `Moon.view.components` under the hood (`<div>` → `Moon.view.components.div({ ... })`), but you never have to call them directly.
- Functions that return views are components:

```js
function Card(props) {
	return (
		<div className="card">
			<h2>{props.title}</h2>
			<p>{props.body}</p>
		</div>
	);
}

function render() {
	Moon.m.view = (
		<div>
			<Card title="Hello" body="From Moon."/>
			<Card title="Second" body="This is another card."/>
		</div>
	);
}
```

### Props, attributes, and style

Moon follows JSX conventions and adds a few rules:

- Use `className` / `htmlFor` in JSX. Moon normalizes these to `class` / `for` on the DOM.
- `style` must be an object. Hyphenated keys are normalized to camelCase before applying:

```js
<button
	style={{
		"background-color": "#111319",
		borderRadius: "3px"
	}}
>
	Save
</button>
```

- Use `attributes={{ "data-id": "123", "aria-label": "Save" }}` when you need to set raw attributes.
- `focus={true}` will focus an element when the view is applied.
- `ref` accepts either:
	- a function: `ref={el => { node = el; }}`, or
	- an object: `ref={nodeRef}` where `nodeRef.current` will be assigned.

### Events

Event handlers must be functions. In development builds, Moon throws if you pass anything else.

Common patterns:

```js
<input
	value={state.query}
	onInput={event => setState(prev => ({ ...prev, query: event.target.value }))}
/>

<form onSubmit={event => { event.preventDefault(); save(); }}>
	<button type="submit">Save</button>
</form>
```

Moon normalizes several JSX‑style handler names to DOM event properties:

- `onChange` → `oninput`
- `onInput` → `oninput`
- `onDoubleClick` → `ondblclick`
- `onFocus` / `onBlur`
- `onSubmit`
- `onMouseEnter` / `onMouseLeave` / `onMouseOver` / `onMouseOut`
- `onKeyDown` / `onKeyUp` / `onKeyPress`

You can also use `innerHTML` as an escape hatch when absolutely necessary:

```js
<div innerHTML={"<strong>Raw HTML</strong>"}/>
```

## Children, lists, and keys

Children behave like React’s JSX in most cases:

- Strings, numbers, and bigints become text nodes.
- Arrays are flattened.
- `null`, `undefined`, and booleans are ignored.

For lists, you should provide keys:

```js
<ul>
	{items.map(item => (
		<li key={item.id}>{item.label}</li>
	))}
</ul>
```

The browser bundle enforces a few rules in development:

- If any sibling has a `key`, all siblings must have a `key`.
- Keys must be unique among siblings.

Mixed keyed/unkeyed lists or duplicate keys throw in development builds to catch subtle diffing bugs early.

If you are constructing nodes manually, `Moon.view.normalizeChildren(value)` is exported and turns primitives/arrays/components into a normalized array of Moon view nodes.

## Helper utilities (`cls`, `mergeProps`)

The browser bundle exposes additional helpers on `Moon.view`.

### `Moon.view.cls`

`cls` is a small utility for composing class names from strings, arrays, and objects:

```js
var cls = Moon.view.cls;

var className = cls(
	"tab",
	active && "tab-active",
	{ "tab-disabled": disabled },
	["density-compact", { "is-first": index === 0 }]
);
// => "tab tab-active density-compact is-first"
```

This is used heavily in the HTML examples for tabs and badges to keep markup readable.

### `Moon.view.mergeProps`

`mergeProps` shallow‑merges props objects; later objects win:

```js
var baseButton = { type: "button", className: "button" };
var danger = { className: "button button-danger" };

var props = Moon.view.mergeProps(baseButton, danger, { disabled: isSaving });

<button {...props}>Delete</button>;
```

This is useful when you want to combine default props with caller‑provided overrides without writing a lot of `Object.assign` boilerplate.

## Development strictness

In this fork, development builds intentionally behave like a strict JSX renderer. This keeps mistakes from slipping into production:

- **Unknown DOM props**: accessing a property that does not exist on the DOM element (and is not `data-*` / `aria-*` / `attributes` / `class` / `style` / `focus` / `children` / `ref`) throws. Use valid DOM props or `attributes` instead.
- **Event handlers**: values for `onClick`, `onInput`, etc. must be functions.
- **Style**: `style` must be an object. Strings or other types throw.
- **Keys**: mixed keyed/unkeyed siblings or duplicate keys throw.
- **Refs**: only function refs and `{ current: ... }` objects are supported; other shapes are rejected.

Production builds strip these checks for size and speed, but the shapes you use in development should be considered canonical usage for the library.

## Putting it together: small workspace example

The examples in the repo show fuller UIs using these pieces:

- `examples/moon-web.html` – minimal counter.
- `examples/moon-web-dashboard.html` – workspace dashboard with tabs, search, filters, and priority bumping.
- `examples/moon-web-kanban.html` – multi‑column Kanban board with drag‑like moves via buttons and filters.

All of them:

- Vendor `moon-web.min.js`.
- Mount once with `Moon.view.mount`.
- Use plain JavaScript for state.
- Render via assignments to `Moon.m.view` with JSX‑ish syntax and the helpers above.

Reading those files alongside this page gives you a concrete reference for how a non‑trivial browser‑only Moon UI is structured.

