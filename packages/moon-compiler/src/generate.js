import { names } from "util/index";

/**
 * Matches whitespace.
 */
const whitespaceRE = /^\s+$/;

/**
 * Matches unescaped special characters in text.
 */
const textSpecialRE = /(^|[^\\])("|\n)/g;

/**
 * If a parse value is wrapped in braces (e.g., `{ expression }`), return the
 * inner expression node so we don't emit the braces verbatim.
 *
 * @param {any} value
 * @returns {any} unwrapped value
 */
function unwrapBraces(value) {
	return (
		Array.isArray(value) &&
		value.length === 3 &&
		value[0] === "{" &&
		value[2] === "}"
	) ? value[1] : value;
}

function normalizeAttributeName(name) {
	if (name === "className") return "class";
	if (name === "htmlFor") return "for";
	if (name === "onChange") return "oninput";
	if (name === "onDoubleClick") return "ondblclick";
	if (name === "dangerouslySetInnerHTML") return "innerHTML";
	return name;
}

function attributesToDataExpression(attributes) {
	if (!attributes || attributes.length !== 1) {
		return null;
	}

	const attr = attributes[0];
	const nameNode = attr[0];
	const valueMaybe = attr[1];
	const nameGenerated = generate(nameNode);

	if (valueMaybe === null && (nameGenerated[0] === "{" || nameGenerated[0] === "(" || nameGenerated[0] === "[")) {
		if (nameGenerated.slice(0, 4) === "{...") {
			return null;
		}

		return generate(unwrapBraces(nameNode));
	}

	return null;
}

/**
 * Heuristically determine if a braced value is an object literal (and not a ternary).
 *
 * @param {any} valueNode
 * @returns {boolean}
 */
function isLikelyObjectLiteral(valueNode) {
	if (!(Array.isArray(valueNode) && valueNode[0] === "{" && valueNode[valueNode.length - 1] === "}")) {
		return false;
	}

	const inner = valueNode[1];
	if (!Array.isArray(inner)) {
		return false;
	}

	let hasColon = false;
	let hasQuestion = false;

	for (let i = 0; i < inner.length; i++) {
		const part = inner[i];

		if (part === "?") {
			hasQuestion = true;
		} else if (Array.isArray(part)) {
			for (let j = 0; j < part.length; j++) {
				const piece = part[j];
				if (piece === "?") hasQuestion = true;
				if (piece === ":") hasColon = true;
			}
		} else if (typeof part === "string") {
			if (part.indexOf("?") !== -1) hasQuestion = true;
			if (part.indexOf(":") !== -1) hasColon = true;
		}
	}

	return hasColon && !hasQuestion;
}

/**
 * Generates child output for a list of nodes, flattening fragments inline.
 *
 * @param {Array} children
 * @param {string} separator
 * @returns {{output: string, separator: string}}
 */
function generateChildList(children, separator = "") {
	let output = "";
	let currentSeparator = separator;

	for (let i = 0; i < children.length; i++) {
		const child = children[i];

		if (child.type === "text") {
			const childGenerated = generate(child);

			if (childGenerated.isWhitespace) {
				output += childGenerated.output;
			} else {
				output += currentSeparator + childGenerated.output;
				currentSeparator = ",";
			}
		} else if (child.type === "fragment") {
			const fragmentChildren = generateChildList(child.value[1], currentSeparator);
			output += fragmentChildren.output;
			currentSeparator = fragmentChildren.separator;
		} else if (child.type === "interpolation") {
			output += `${currentSeparator}...Moon.view.normalizeChildren(${generate(child.value[1])})`;
			currentSeparator = ",";
		} else {
			output += currentSeparator + generate(child);
			currentSeparator = ",";
		}
	}

	return { output, separator: currentSeparator };
}

/**
 * Generates a name for a function call.
 *
 * @param {string} nameTree
 * @returns {string} function name
 */
function generateName(nameTree) {
	const name = generate(nameTree);

	return names.indexOf(name) === -1 ?
		name :
		`Moon.view.components.${name}`;
}

/**
 * Generator
 *
 * The generator takes parse nodes and converts them to strings representing
 * JavaScript code. All code is generated the same, but Moon view expressions
 * are converted to function calls or variable references.
 *
 * @param {object} tree
 * @returns {string} generator result
 */
export default function generate(tree) {
	const type = tree.type;

	if (typeof tree === "string") {
		return tree;
	} else if (Array.isArray(tree)) {
		let output = "";

		for (let i = 0; i < tree.length; i++) {
			output += generate(tree[i]);
		}

		return output;
	} else if (type === "comment") {
		return `/*${generate(tree.value[1])}*/`;
	} else if (type === "attributes") {
		const value = tree.value;
		const spreads = [];
		const entries = [];

		for (let i = 0; i < value.length; i++) {
			const pair = value[i];
			const rawName = generate(unwrapBraces(pair[0]));
			const attributeName = normalizeAttributeName(rawName);
			const pairValue = pair[1];
			const valueNode = Array.isArray(pairValue) && pairValue[0] === "=" ? pairValue[1] : pairValue;
			const isObjectLiteral = valueNode && isLikelyObjectLiteral(valueNode);

			if (attributeName.slice(0, 3) === "...") {
				const spreadExpr = attributeName.slice(3) || generate(unwrapBraces(valueNode || []));
				spreads.push(spreadExpr);
			} else {
				const attributeValue = pairValue === null ?
					"true" :
					(isObjectLiteral ? `{${generate(valueNode[1])}}` : generate(unwrapBraces(valueNode)));
				entries.push(`"${attributeName}":${attributeValue}`);
			}
		}

		if (spreads.length === 0) {
			return {
				output: entries.join(","),
				separator: entries.length === 0 ? "" : ",",
				isExpression: false
			};
		} else {
			const propsObject = entries.length === 0 ? "{}" : `{${entries.join(",")}}`;
			return {
				output: `Object.assign({}, ${spreads.join(",")}${entries.length ? `, ${propsObject}` : ""})`,
				separator: entries.length || spreads.length ? "," : "",
				isExpression: true
			};
		}
	} else if (type === "text") {
		const textGenerated = generate(tree.value);
		const textGeneratedIsWhitespace = whitespaceRE.test(textGenerated) && textGenerated.indexOf("\n") !== -1;

		// Text that is only whitespace with at least one newline is ignored and
		// added only to preserve newlines in the generated code.
		return {
			output: textGeneratedIsWhitespace ?
				textGenerated :
				`Moon.view.components.text({data:"${
					textGenerated.replace(textSpecialRE, (match, character, characterSpecial) =>
						character + (characterSpecial === "\"" ? "\\\"" : "\\n\\\n")
					)
				}"})`,
			isWhitespace: textGeneratedIsWhitespace
		};
	} else if (type === "interpolation") {
		return `Moon.view.components.text({data:${generate(tree.value[1])}})`;
	} else if (type === "node") {
		// Nodes represent a variable reference.
		const value = tree.value;

		return generate(value[1]) + generateName(value[2]) + generate(value[3]);
	} else if (type === "nodeData") {
		// Data nodes represent calling a function with either a custom data
		// expression or an object using attribute syntax.
		const value = tree.value;
		const data = value[4];

		if (data.type === "attributes") {
			const dataExpr = attributesToDataExpression(data.value);

			if (dataExpr !== null) {
				return `${generate(value[1])}${generateName(value[2])}${generate(value[3])}(${dataExpr})`;
			}
		}

		const dataGenerated = generate(data);

	return `${generate(value[1])}${generateName(value[2])}${generate(value[3])}(${
		data.type === "attributes" ?
			(dataGenerated.isExpression ? dataGenerated.output : `{${dataGenerated.output}}`) :
			dataGenerated
	})`;
	} else if (type === "nodeDataChildren") {
		// Data and children nodes represent calling a function with a data
		// object using attribute syntax and children.
		const value = tree.value;
		const data = generate(value[4]);
		const children = value[6];
		const hasChildren = children.length > 0;
		const childList = hasChildren ? generateChildList(children) : { output: "" };

		let propsExpression;

		if (data.isExpression) {
			propsExpression = hasChildren ?
				`Object.assign({}, ${data.output}, {children:[${childList.output}]})` :
				data.output;
		} else {
			const childrenGenerated = hasChildren ?
				(`${data.separator || ""}children:[${childList.output}]`) :
				"";
			propsExpression = `{${data.output}${childrenGenerated}}`;
		}

		return `${generate(value[1])}${generateName(value[2])}${generate(value[3])}(${propsExpression})`;
	} else if (type === "fragment") {
		const children = tree.value[1];
		const fragmentChildren = generateChildList(children);

		return `[${fragmentChildren.output}]`;
	}
}
