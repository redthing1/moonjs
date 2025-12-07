import compiler from "moon-compiler/src/index";

console.error = jest.fn(() => {});

test("report parse errors", () => {
	expect(() => compiler.compile(`<div test="/>`).constructor.name).toThrow();
	expect(console.error).toBeCalledWith(`[Moon] ERROR: Invalid Moon view syntax.\nParse error: expected \"\"\" at 1:14\n1:14 <div test=\"/> \n                  ^\n\nContext:\n1| <div test=\"/> \n |              ^`);
});
