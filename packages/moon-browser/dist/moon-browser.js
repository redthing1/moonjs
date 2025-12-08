/**
 * Moon Browser v1.0.0-beta.7
 * Copyright 2016-2020 kbrsh
 * Released under the MIT License
 * https://moonjs.org
 */
(function () {
	"use strict";

	/**
	 * Matches an identifier character.
	 */
	var identifierRE = /[-$\w.]/;

	/**
	 * Stores an error message, a slice of tokens associated with the error, and a
	 * related error for later reporting.
	 */
	function ParseError(expected, index) {
		this.expected = expected;
		this.index = index;
	}

	/**
	 * Parser combinators
	 */
	var parser = {
		type: function type(_type, parse) {
			return function (input, index) {
				var output = parse(input, index);
				return output instanceof ParseError ? output : [{
					type: _type,
					value: output[0]
				}, output[1]];
			};
		},
		EOF: function EOF(input, index) {
			// EOF errors should be unreachable because the expression parser should
			// never error after looking ahead one character and stop consuming input
			// before reaching the end.
			return index === input.length ? ["EOF", index] : /* istanbul ignore next */
			new ParseError("EOF", index);
		},
		any: function any(input, index) {
			return index < input.length ? [input[index], index + 1] : new ParseError("any", index);
		},
		character: function character(_character) {
			return function (input, index) {
				var head = input[index];
				return head === _character ? [head, index + 1] : new ParseError("\"" + _character + "\"", index);
			};
		},
		regex: function regex(_regex) {
			return function (input, index) {
				var head = input[index];
				return head !== undefined && _regex.test(head) ? [head, index + 1] : new ParseError(_regex.toString(), index);
			};
		},
		string: function string(_string) {
			return function (input, index) {
				var indexNew = index + _string.length;
				return input.slice(index, indexNew) === _string ? [_string, indexNew] : new ParseError("\"" + _string + "\"", index);
			};
		},
		not: function not(strings) {
			return function (input, index) {
				if (index < input.length) {
					for (var i = 0; i < strings.length; i++) {
						var string = strings[i];
						if (input.slice(index, index + string.length) === string) {
							return new ParseError("not \"" + string + "\"", index);
						}
					}
					return [input[index], index + 1];
				} else {
					return new ParseError("not " + strings.map(JSON.stringify).join(", "), index);
				}
			};
		},
		or: function or(parse1, parse2) {
			return function (input, index) {
				var output1 = parse1(input, index);
				if (output1 instanceof ParseError && output1.index === index) {
					// If the first parser has an error and consumes no input, then try
					// the second parser.
					return parse2(input, index);
				} else {
					return output1;
				}
			};
		},
		and: function and(parse1, parse2) {
			return function (input, index) {
				var output1 = parse1(input, index);
				if (output1 instanceof ParseError) {
					return output1;
				} else {
					var output2 = parse2(input, output1[1]);
					return output2 instanceof ParseError ? output2 : [[output1[0], output2[0]], output2[1]];
				}
			};
		},
		sequence: function sequence(parses) {
			return function (input, index) {
				var values = [];
				for (var i = 0; i < parses.length; i++) {
					var output = parses[i](input, index);
					if (output instanceof ParseError) {
						return output;
					} else {
						values.push(output[0]);
						index = output[1];
					}
				}
				return [values, index];
			};
		},
		alternates: function alternates(parses) {
			return function (input, index) {
				var alternatesError = new ParseError("alternates", -1);
				for (var i = 0; i < parses.length; i++) {
					var output = parses[i](input, index);
					if (output instanceof ParseError && output.index === index) {
						if (output.index > alternatesError.index) {
							alternatesError = output;
						}
					} else {
						return output;
					}
				}
				return alternatesError;
			};
		},
		many: function many(parse) {
			return function (input, index) {
				var values = [];
				var output;
				while (!((output = parse(input, index)) instanceof ParseError)) {
					values.push(output[0]);
					index = output[1];
				}
				if (output.index === index) {
					return [values, index];
				} else {
					return output;
				}
			};
		},
		many1: function many1(parse) {
			return function (input, index) {
				var values = [];
				var output = parse(input, index);
				if (output instanceof ParseError) {
					return output;
				}
				values.push(output[0]);
				index = output[1];
				while (!((output = parse(input, index)) instanceof ParseError)) {
					values.push(output[0]);
					index = output[1];
				}
				if (output.index === index) {
					return [values, index];
				} else {
					return output;
				}
			};
		},
		"try": function _try(parse) {
			return function (input, index) {
				var output = parse(input, index);
				if (output instanceof ParseError) {
					output.index = index;
				}
				return output;
			};
		},
		optional: function optional(parse) {
			return function (input, index) {
				var output = parse(input, index);
				return output instanceof ParseError && output.index === index ? [null, index] : output;
			};
		}
	};

	/**
	 * Moon View Language Grammar
	 */
	var grammar = {
		comment: parser.type("comment", parser.sequence([parser.character("#"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["#"]))), parser.character("#")])),
		separator: function separator(input, index) {
			return parser.many(parser.or(parser.alternates([parser.character(" "), parser.character("\t"), parser.character("\n")]), grammar.comment))(input, index);
		},
		value: function value(input, index) {
			return parser.alternates([parser.many1(parser.regex(identifierRE)), parser.sequence([parser.character("\""), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["\""]))), parser.character("\"")]), parser.sequence([parser.character("'"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["'"]))), parser.character("'")]), parser.sequence([parser.character("`"), parser.many(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["`"]))), parser.character("`")]), parser.sequence([parser.character("("), grammar.expression, parser.character(")")]), parser.sequence([parser.character("["), grammar.expression, parser.character("]")]), parser.sequence([parser.character("{"), grammar.expression, parser.character("}")])])(input, index);
		},
		attributes: function attributes(input, index) {
			return parser.type("attributes", parser.many(parser.sequence([grammar.value, parser.optional(parser.sequence([parser.character("="), grammar.value])), grammar.separator])))(input, index);
		},
		text: parser.type("text", parser.many1(parser.or(parser.and(parser.character("\\"), parser.any), parser.not(["{", "<"])))),
		fragment: function fragment(input, index) {
			return parser.type("fragment", parser.sequence([parser.string("<>"), parser.many(parser.alternates([parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren), parser["try"](grammar.fragment), grammar.text, grammar.interpolation])), parser.string("</>")]))(input, index);
		},
		interpolation: function interpolation(input, index) {
			return parser.type("interpolation", parser.sequence([parser.character("{"), grammar.expression, parser.character("}")]))(input, index);
		},
		node: function node(input, index) {
			return parser.type("node", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, parser.string("*>")]))(input, index);
		},
		nodeData: function nodeData(input, index) {
			return parser.type("nodeData", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, parser.or(parser["try"](grammar.attributes), grammar.value), parser.string("/>")]))(input, index);
		},
		nodeDataChildren: function nodeDataChildren(input, index) {
			return parser.type("nodeDataChildren", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, grammar.attributes, parser.character(">"), parser.many(parser.alternates([parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren), parser["try"](grammar.fragment), grammar.text, grammar.interpolation])), parser.string("</"), parser.many(parser.not([">"])), parser.character(">")]))(input, index);
		},
		expression: function expression(input, index) {
			return parser.many(parser.alternates([
			// Single line comment
			parser.sequence([parser.string("//"), parser.many(parser.not(["\n"]))]),
			// Multi-line comment
			parser.sequence([parser.string("/*"), parser.many(parser.not(["*/"])), parser.string("*/")]),
			// Regular expression
			parser["try"](parser.sequence([parser.character("/"), parser.many1(parser.or(parser.and(parser.character("\\"), parser.not(["\n"])), parser.not(["/", "\n"]))), parser.character("/")])), grammar.comment, grammar.value, parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren), parser["try"](grammar.fragment),
			// Allow failed regular expression or view parses to be interpreted as
			// operators.
			parser.character("/"), parser.character("<"),
			// Anything up to a comment, regular expression, string, parenthetical,
			// array, object, or view. Only matches to the opening bracket of a view
			// because the view parsers do not require an expression to finish
			// parsing before consuming the closing bracket. Parentheticals, arrays,
			// and objects, however, parse expressions before their closing
			// delimiter, depending on the expression parser to stop before it.
			parser.many1(parser.not(["/", "#", "\"", "'", "`", "(", ")", "[", "]", "{", "}", "<"]))]))(input, index);
		},
		main: function main(input, index) {
			return parser.and(grammar.expression, parser.EOF)(input, index);
		}
	};

	/**
	 * Parser
	 *
	 * The parser is responsible for taking a list of tokens to return an abstract
	 * syntax tree of a JavaScript file using the Moon View Language. It is built
	 * up of smaller parsers, which each take an input and a start index. They
	 * either return a parser node and an end index signifying the consumed input
	 * or a parser error.
	 *
	 * @param {string} input
	 * @returns {object} abstract syntax tree and end index or ParseError
	 */
	function parse(input) {
		return grammar.main(input, 0);
	}

	/**
	 * HTML tag names
	 */
	var names = ["a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "bgsound", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "content", "data", "datalist", "dd", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "image", "img", "input", "ins", "isindex", "kbd", "keygen", "label", "legend", "li", "link", "listing", "main", "map", "mark", "marquee", "math", "menu", "menuitem", "meta", "meter", "multicol", "nav", "nextid", "nobr", "noembed", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "picture", "plaintext", "pre", "progress", "q", "rb", "rbc", "rp", "rt", "rtc", "ruby", "s", "samp", "script", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td", "template", "text", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr", "xmp"];

	/**
	 * Logs an error message to the console.
	 * @param {string} message
	 */
	function error(message) {
		console.error("[Moon] ERROR: " + message);
	}

	/**
	 * Pads a string with spaces on the left to match a certain length.
	 *
	 * @param {string} string
	 * @param {number} length
	 * @returns {string} padded string
	 */
	function pad(string, length) {
		var remaining = length - string.length;
		for (var i = 0; i < remaining; i++) {
			string = " " + string;
		}
		return string;
	}

	/**
	 * Matches whitespace.
	 */
	var whitespaceRE = /^\s+$/;

	/**
	 * Matches unescaped special characters in text.
	 */
	var textSpecialRE = /(^|[^\\])("|\n)/g;

	/**
	 * If a parse value is wrapped in braces (e.g., `{ expression }`), return the
	 * inner expression node so we don't emit the braces verbatim.
	 *
	 * @param {any} value
	 * @returns {any} unwrapped value
	 */
	function unwrapBraces(value) {
		return Array.isArray(value) && value.length === 3 && value[0] === "{" && value[2] === "}" ? value[1] : value;
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
		var attr = attributes[0];
		var nameNode = attr[0];
		var valueMaybe = attr[1];
		var nameGenerated = generate(nameNode);
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
		var inner = valueNode[1];
		if (!Array.isArray(inner)) {
			return false;
		}
		var hasColon = false;
		var hasQuestion = false;
		for (var i = 0; i < inner.length; i++) {
			var part = inner[i];
			if (part === "?") {
				hasQuestion = true;
			} else if (Array.isArray(part)) {
				for (var j = 0; j < part.length; j++) {
					var piece = part[j];
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
	function generateChildList(children) {
		var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
		var output = "";
		var currentSeparator = separator;
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			if (child.type === "text") {
				var childGenerated = generate(child);
				if (childGenerated.isWhitespace) {
					output += childGenerated.output;
				} else {
					output += currentSeparator + childGenerated.output;
					currentSeparator = ",";
				}
			} else if (child.type === "fragment") {
				var fragmentChildren = generateChildList(child.value[1], currentSeparator);
				output += fragmentChildren.output;
				currentSeparator = fragmentChildren.separator;
			} else if (child.type === "interpolation") {
				output += currentSeparator + "...Moon.view.normalizeChildren(" + generate(child.value[1]) + ")";
				currentSeparator = ",";
			} else {
				output += currentSeparator + generate(child);
				currentSeparator = ",";
			}
		}
		return {
			output: output,
			separator: currentSeparator
		};
	}

	/**
	 * Generates a name for a function call.
	 *
	 * @param {string} nameTree
	 * @returns {string} function name
	 */
	function generateName(nameTree) {
		var name = generate(nameTree);
		return names.indexOf(name) === -1 ? name : "Moon.view.components." + name;
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
	function generate(tree) {
		var type = tree.type;
		if (typeof tree === "string") {
			return tree;
		} else if (Array.isArray(tree)) {
			var output = "";
			for (var i = 0; i < tree.length; i++) {
				output += generate(tree[i]);
			}
			return output;
		} else if (type === "comment") {
			return "/*" + generate(tree.value[1]) + "*/";
		} else if (type === "attributes") {
			var value = tree.value;
			var spreads = [];
			var entries = [];
			for (var _i = 0; _i < value.length; _i++) {
				var pair = value[_i];
				var rawName = generate(unwrapBraces(pair[0]));
				var attributeName = normalizeAttributeName(rawName);
				var pairValue = pair[1];
				var valueNode = Array.isArray(pairValue) && pairValue[0] === "=" ? pairValue[1] : pairValue;
				var isObjectLiteral = valueNode && isLikelyObjectLiteral(valueNode);
				if (attributeName.slice(0, 3) === "...") {
					var spreadExpr = attributeName.slice(3) || generate(unwrapBraces(valueNode || []));
					spreads.push(spreadExpr);
				} else {
					var attributeValue = pairValue === null ? "true" : isObjectLiteral ? "{" + generate(valueNode[1]) + "}" : generate(unwrapBraces(valueNode));
					entries.push("\"" + attributeName + "\":" + attributeValue);
				}
			}
			if (spreads.length === 0) {
				return {
					output: entries.join(","),
					separator: entries.length === 0 ? "" : ",",
					isExpression: false
				};
			} else {
				var propsObject = entries.length === 0 ? "{}" : "{" + entries.join(",") + "}";
				return {
					output: "Object.assign({}, " + spreads.join(",") + (entries.length ? ", " + propsObject : "") + ")",
					separator: entries.length || spreads.length ? "," : "",
					isExpression: true
				};
			}
		} else if (type === "text") {
			var textGenerated = generate(tree.value);
			var textGeneratedIsWhitespace = whitespaceRE.test(textGenerated) && textGenerated.indexOf("\n") !== -1;

			// Text that is only whitespace with at least one newline is ignored and
			// added only to preserve newlines in the generated code.
			return {
				output: textGeneratedIsWhitespace ? textGenerated : "Moon.view.components.text({data:\"" + textGenerated.replace(textSpecialRE, function (match, character, characterSpecial) {
					return character + (characterSpecial === "\"" ? "\\\"" : "\\n\\\n");
				}) + "\"})",
				isWhitespace: textGeneratedIsWhitespace
			};
		} else if (type === "interpolation") {
			return "Moon.view.components.text({data:" + generate(tree.value[1]) + "})";
		} else if (type === "node") {
			// Nodes represent a variable reference.
			var _value = tree.value;
			return generate(_value[1]) + generateName(_value[2]) + generate(_value[3]);
		} else if (type === "nodeData") {
			// Data nodes represent calling a function with either a custom data
			// expression or an object using attribute syntax.
			var _value2 = tree.value;
			var data = _value2[4];
			if (data.type === "attributes") {
				var dataExpr = attributesToDataExpression(data.value);
				if (dataExpr !== null) {
					return "" + generate(_value2[1]) + generateName(_value2[2]) + generate(_value2[3]) + "(" + dataExpr + ")";
				}
			}
			var dataGenerated = generate(data);
			return "" + generate(_value2[1]) + generateName(_value2[2]) + generate(_value2[3]) + "(" + (data.type === "attributes" ? dataGenerated.isExpression ? dataGenerated.output : "{" + dataGenerated.output + "}" : dataGenerated) + ")";
		} else if (type === "nodeDataChildren") {
			// Data and children nodes represent calling a function with a data
			// object using attribute syntax and children.
			var _value3 = tree.value;
			var _data = generate(_value3[4]);
			var children = _value3[6];
			var hasChildren = children.length > 0;
			var childList = hasChildren ? generateChildList(children) : {
				output: ""
			};
			var propsExpression;
			if (_data.isExpression) {
				propsExpression = hasChildren ? "Object.assign({}, " + _data.output + ", {children:[" + childList.output + "]})" : _data.output;
			} else {
				var childrenGenerated = hasChildren ? (_data.separator || "") + "children:[" + childList.output + "]" : "";
				propsExpression = "{" + _data.output + childrenGenerated + "}";
			}
			return "" + generate(_value3[1]) + generateName(_value3[2]) + generate(_value3[3]) + "(" + propsExpression + ")";
		} else if (type === "fragment") {
			var _children = tree.value[1];
			var fragmentChildren = generateChildList(_children);
			return "[" + fragmentChildren.output + "]";
		}
	}

	/**
	 * Formats lines surrounding a certain index in a string.
	 *
	 * @param {string} input
	 * @param {number} index
	 * @returns {string} formatted lines
	 */
	function format(input, index) {
		// Pad input to account for indexes after the end.
		for (var i = input.length; i <= index; i++) {
			input += " ";
		}
		var lines = input.split("\n");
		var lineNumber = 1;
		var columnNumber = 1;
		for (var _i = 0; _i < input.length; _i++) {
			var character = input[_i];
			if (_i === index) {
				var lineNumberPrevious = lineNumber - 1;
				var lineNumberNext = lineNumber + 1;
				var lineNumberLength = Math.max(Math.floor(Math.log10(lineNumberPrevious) + 1), Math.floor(Math.log10(lineNumber) + 1), Math.floor(Math.log10(lineNumberNext) + 1)) + 2;
				var linePrevious = lines[lineNumberPrevious - 1];
				var line = lines[lineNumber - 1];
				var lineNext = lines[lineNumberNext - 1];
				var formatted = "";
				if (linePrevious !== undefined) {
					formatted += pad(lineNumberPrevious + "| ", lineNumberLength) + linePrevious + "\n";
				}
				formatted += pad(lineNumber + "| ", lineNumberLength) + line + "\n" + pad("| ", lineNumberLength) + pad("^", columnNumber);
				if (lineNext !== undefined) {
					formatted += "\n" + pad(lineNumberNext + "| ", lineNumberLength) + lineNext;
				}
				return formatted;
			}
			if (character === "\n") {
				lineNumber += 1;
				columnNumber = 1;
			} else {
				columnNumber += 1;
			}
		}
	}

	/**
	 * Formats a detailed error message with line/column and a caret.
	 *
	 * @param {string} input
	 * @param {number} index
	 * @param {string} expected
	 * @returns {string}
	 */
	function formatDetailed(input, index, expected) {
		// Pad input to account for indexes after the end.
		for (var i = input.length; i <= index; i++) {
			input += " ";
		}
		var lines = input.split("\n");
		var lineNumber = 1;
		var columnNumber = 1;
		for (var _i2 = 0; _i2 < input.length; _i2++) {
			var character = input[_i2];
			if (_i2 === index) {
				var line = lines[lineNumber - 1] || "";
				var prefix = lineNumber + ":" + columnNumber;
				return "Parse error: expected " + expected + " at " + lineNumber + ":" + columnNumber + "\n" + prefix + " " + line + "\n" + " ".repeat(prefix.length + 1 + columnNumber - 1) + "^";
			}
			if (character === "\n") {
				lineNumber += 1;
				columnNumber = 1;
			} else {
				columnNumber += 1;
			}
		}
		return "Parse error: expected " + expected + " at end of input";
	}

	/**
	 * Compiles a JavaScript file with Moon syntax.
	 *
	 * @param {string} input
	 * @returns {string} file code
	 */
	function compile(input) {
		var parseOutput = parse(input);
		if (parseOutput.constructor.name === "ParseError") {
			var message = "Invalid Moon view syntax.\n" + formatDetailed(input, parseOutput.index, parseOutput.expected) + "\n\nContext:\n" + format(input, parseOutput.index);
			error(message);
			throw new Error(message);
		}
		return generate(parseOutput[0][0]);
	}

	/**
	 * Script elements
	 */
	var scripts = [];

	/**
	 * Load scripts in the order they appear.
	 */
	function load() {
		if (scripts.length !== 0) {
			var script = scripts.shift();
			var src = script.src;
			if (src.length === 0) {
				var scriptNew = document.createElement("script");
				scriptNew.type = "text/javascript";
				scriptNew.text = compile(script.text);
				script.parentNode.replaceChild(scriptNew, script);
				load();
			} else {
				var xhr = new XMLHttpRequest();
				xhr.responseType = "text";
				xhr.onload = function () {
					if (xhr.status === 0 || xhr.status === 200) {
						var _scriptNew = document.createElement("script");
						_scriptNew.type = "text/javascript";
						_scriptNew.text = compile(xhr.response);
						script.parentNode.replaceChild(_scriptNew, script);
					} else {
						error("Invalid script HTTP response.\n\nAttempted to download script:\n\t" + src + "\n\nReceived error HTTP status code:\n\t" + xhr.status + "\n\nExpected OK HTTP status code 0 or 200.");
					}
					load();
				};
				xhr.onerror = function () {
					error("Failed script HTTP request.\n\nAttempted to download script:\n\t" + src + "\n\nReceived error.\n\nExpected successful HTTP request.");
					load();
				};
				xhr.open("GET", src, true);
				xhr.send(null);
			}
		}
	}
	document.addEventListener("DOMContentLoaded", function () {
		var scriptsAll = document.querySelectorAll("script");
		for (var i = 0; i < scriptsAll.length; i++) {
			var script = scriptsAll[i];
			if (script.type === "text/moon") {
				scripts.push(script);
			}
		}
		load();
	});

}());
