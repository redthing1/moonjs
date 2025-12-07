import compiler from "moon-compiler/src/index";

function expectParseOk(input) {
	const result = compiler.parse(input);
	expect(result.constructor.name).not.toBe("ParseError");
}

test("parses basic elements and text", () => {
	expectParseOk(`<div>test text</div>`);
	expectParseOk(`<div>test \\{ escaped</div>`);
	expectParseOk(`<div>test \\< escaped</div>`);
});

test("parses nodes and data/attributes", () => {
	expectParseOk(`<div*>`);
	expectParseOk(`<"div"*>`);
	expectParseOk(`<{dynamic}*>`);
	expectParseOk(`<div foo="bar" bar={1 + 2 + 3} baz="test"/>`);
	expectParseOk(`<div {foo}/>`);
	expectParseOk(`<"div" {foo}/>`);
	expectParseOk(`<{div} {foo}/>`);
});

test("parses children and blocks", () => {
	expectParseOk(`
		<div dynamic={true}>
			<h1>Title</h1>
			<p color="blue">Text</p>
		</div>
	`);

	expectParseOk(`
		<{div} dynamic={true}>
			<h1>Title</h1>
			<p color="blue">Text</p>
		</>
	`);
});

test("parses regex and escapes", () => {
	expectParseOk(`/\\//`);
	expectParseOk(`/\\\\/`);
	expectParseOk(`/test\\\n`);
});

test("parses fragments and interpolations", () => {
	expectParseOk(`<><span>A</span><p>{message}</p></>`);
});
