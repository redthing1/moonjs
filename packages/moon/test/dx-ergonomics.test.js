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

	test("event handler must be function", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.button onClick="notFn">hi</Moon.view.components.button>
			);
		}).toThrow();
	});

	test("style must be object", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style="color:red">hi</Moon.view.components.div>
			);
		}).toThrow();
	});

	test("style must not be null", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={null}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style on/);
	});

	test("style must not be array or primitive", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={["color:red"]}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style on/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={1}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style on/);
	});

	test("style values must be finite primitive", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={{ color: true }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style "color"/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={{ color: () => {} }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style "color"/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={{ opacity: Infinity }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style "opacity"/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={{ "": "red" }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style key/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div style={{ [null]: "red" }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Style key/);
	});

	test("unsupported ref types throw", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div ref="notAllowed">hi</Moon.view.components.div>
			);
		}).toThrow(/Ref on/);
	});

	test("keyed containers must keep child shape stable", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		Moon.m.view = (
			<Moon.view.components.div>
				<Moon.view.components.div key="item">
					<Moon.view.components.span>A</Moon.view.components.span>
				</Moon.view.components.div>
			</Moon.view.components.div>
		);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.div key="item">
						<Moon.view.components.span>A</Moon.view.components.span>
						<Moon.view.components.span>B</Moon.view.components.span>
					</Moon.view.components.div>
				</Moon.view.components.div>
			);
		}).toThrow(/child shape/);
	});

	test("key must be string or number", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.div key={{}}>oops</Moon.view.components.div>
				</Moon.view.components.div>
			);
		}).toThrow(/Key on/);
	});

	test("key must not be empty string", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.div key="">oops</Moon.view.components.div>
				</Moon.view.components.div>
			);
		}).toThrow(/Key on/);
	});

	test("key must not be null", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.div key={null}>oops</Moon.view.components.div>
				</Moon.view.components.div>
			);
		}).toThrow(/Key on/);
	});

	test("attributes must be plain object with primitive values", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div attributes="notObject">hi</Moon.view.components.div>
			);
		}).toThrow(/Attributes/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div attributes={{ ok: true, bad: () => {} }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Attribute "bad"/);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div attributes={{ bad: null }}>hi</Moon.view.components.div>
			);
		}).toThrow(/Attribute "bad"/);
	});

	test("children prop must be array of nodes", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		expect(() => {
			Moon.m.view = Moon.view.components.div({ children: "oops" });
		}).toThrow(/Children on/);

		expect(() => {
			Moon.m.view = Moon.view.components.div({ children: [null] });
		}).toThrow(/Child 0/);
	});

	test("keyed reorder moves DOM into new order", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		Moon.m.view = (
			<Moon.view.components.div>
				<Moon.view.components.div key="a">A</Moon.view.components.div>
				<Moon.view.components.div key="b">B</Moon.view.components.div>
			</Moon.view.components.div>
		);

		Moon.m.view = (
			<Moon.view.components.div>
				<Moon.view.components.div key="b">B</Moon.view.components.div>
				<Moon.view.components.div key="c">C</Moon.view.components.div>
			</Moon.view.components.div>
		);

		const elChildren = root.children;
		expect(elChildren.length).toBe(2);
		expect(elChildren[0].textContent).toBe("B");
		expect(elChildren[1].textContent).toBe("C");
	});

	test("keyed containers can reuse key when child shape is stable", () => {
		const root = document.createElement("div");
		document.body.appendChild(root);
		Moon.view.mount(root);

		Moon.m.view = (
			<Moon.view.components.div>
				<Moon.view.components.div key="item">
					<Moon.view.components.span>A</Moon.view.components.span>
					<Moon.view.components.span>B</Moon.view.components.span>
				</Moon.view.components.div>
			</Moon.view.components.div>
		);

		expect(() => {
			Moon.m.view = (
				<Moon.view.components.div>
					<Moon.view.components.div key="item">
						<Moon.view.components.span>A</Moon.view.components.span>
						<Moon.view.components.span>B</Moon.view.components.span>
					</Moon.view.components.div>
				</Moon.view.components.div>
			);
		}).not.toThrow();
	});
});
