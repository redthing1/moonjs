import Moon from "moon/src/index";

const { normalizeChildren, components } = Moon.view;

function textContents(nodes) {
	return nodes.map(node => node.name === "text" ? node.data.data : `[${node.name}]`);
}

test("ignores nullish and booleans", () => {
	expect(normalizeChildren(null)).toEqual([]);
	expect(normalizeChildren(undefined)).toEqual([]);
	expect(normalizeChildren(false)).toEqual([]);
});

test("wraps primitives as text nodes", () => {
	const nodes = normalizeChildren(["hi", 42, 7n]);
	expect(nodes).toHaveLength(3);
	expect(textContents(nodes)).toEqual(["hi", "42", "7"]);
});

test("passes through existing view nodes", () => {
	const node = components.div({});
	const nodes = normalizeChildren(node);
	expect(nodes).toHaveLength(1);
	expect(nodes[0]).toBe(node);
});

test("flattens nested arrays and mixes node types", () => {
	const nodes = normalizeChildren([
		"one",
		[components.span({}), ["two", [3]]],
	]);
	expect(textContents(nodes)).toEqual(["one", "[span]", "two", "3"]);
});
