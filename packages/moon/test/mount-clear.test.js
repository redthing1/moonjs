import Moon from "moon/src/index";

const components = Moon.view.components;

test("mount clears existing DOM children on first render", () => {
	const root = document.createElement("div");
	root.id = "app";
	root.appendChild(document.createTextNode("Loading..."));
	document.body.appendChild(root);

	Moon.view.mount(root);
	Moon.m.view = (
		<components.div>
			<components.p>Rendered</components.p>
		</components.div>
	);

	expect(root.childNodes.length).toBe(1);
	const child = root.firstChild;
	expect(child.tagName).toBe("P");
	expect(root.textContent).toBe("Rendered");

	document.body.removeChild(root);
});
