import Moon from "moon/src/index";

describe("Moon JSX ergonomics", () => {
	test("event aliases map to DOM handlers", () => {
		let root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		const handler = jest.fn();
		const focusHandler = jest.fn();
		const enterHandler = jest.fn();

		Moon.m.view = (
			<Moon.view.components.div>
				<Moon.view.components.input onChange={handler} onFocus={focusHandler}/>
				<Moon.view.components.div onMouseEnter={enterHandler}>hi</Moon.view.components.div>
			</Moon.view.components.div>
		);

		const input = root.firstChild;
		expect(typeof input.oninput).toBe("function");
		expect(input.oninput).toBe(handler);
		expect(typeof input.onfocus).toBe("function");
		expect(input.onfocus).toBe(focusHandler);

		const div = input.nextSibling;
		expect(typeof div.onmouseenter).toBe("function");
		expect(div.onmouseenter).toBe(enterHandler);
	});

	test("hyphenated style keys normalize to camelCase", () => {
		let root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		Moon.m.view = (
			<Moon.view.components.div style={{ "background-color": "rgb(1, 2, 3)" }}>box</Moon.view.components.div>
		);

		const el = root;
		expect(el.style.backgroundColor).toBe("rgb(1, 2, 3)");
	});

	test("cls helper merges classes", () => {
		const cls = Moon.view.cls;
		const out = cls("a", { b: true, c: false }, ["d", ["e", { f: true, g: false }]], 0, null, undefined);
		expect(out).toBe("a b d e f");
	});

	test("unknown DOM props throw in dev", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div bogusProp="x"/>
			);
		}).toThrow();
	});

	test("mixed keyed/unkeyed siblings throw", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.span key="a">A</Moon.view.components.span>
					<Moon.view.components.span>B</Moon.view.components.span>
				</Moon.view.components.div>
			);
		}).toThrow();
	});

	test("duplicate keys throw", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.span key="a">A</Moon.view.components.span>
					<Moon.view.components.span key="a">B</Moon.view.components.span>
				</Moon.view.components.div>
			);
		}).toThrow();
	});
});
