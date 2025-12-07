import parse from "moon-compiler/src/parse";
import generate from "moon-compiler/src/generate";
import { format, formatDetailed } from "moon-compiler/src/util";
import { error } from "util/index";

/**
 * Compiles a JavaScript file with Moon syntax.
 *
 * @param {string} input
 * @returns {string} file code
 */
export default function compile(input) {
	const parseOutput = parse(input);

	if (parseOutput.constructor.name === "ParseError") {
		const message = `Invalid Moon view syntax.\n${formatDetailed(input, parseOutput.index, parseOutput.expected)}\n\nContext:\n${format(input, parseOutput.index)}`;
		error(message);
		throw new Error(message);
	}

	return generate(parseOutput[0][0]);
}
