/**
 * Moon Web v1.0.0-beta.7
 * Copyright 2016-2020 Kabir Shah
 * Released under the MIT License
 * https://moonjs.org
 */
(function(root, factory) {
	if (typeof module === "undefined") {
		root.Moon = factory();
	} else {
		module.exports = factory();
	}
}(this, function() {
	"use strict";

	/**
	 * View Node Constructor
	 *
	 * @param {string} name
	 * @param {object} data
	 */
	function ViewNode(name, data) {
		this.name = name;
		this.data = data;
	}

	/**
	 * Global old view.
	 */
	var viewOld = null;

	/**
	 * Global old view element.
	 */
	var viewOldElement = null;

	/**
	 * Update the old view.
	 *
	 * @param {object} viewOldNew
	 */
	function viewOldUpdate(viewOldNew) {
		viewOld = viewOldNew;
	}

	/**
	 * Update the old view element.
	 *
	 * @param {object} viewOldElementNew
	 */
	function viewOldElementUpdate(viewOldElementNew) {
		viewOldElement = viewOldElementNew;
	}

	/**
	 * Mount to a DOM element.
	 */
	function mount(element) {
		viewOldElementUpdate(element);

		// Capture old data from the element's attributes.
		var viewOldElementAttributes = viewOldElement.attributes;
		var viewOldData = {};
		for (var i = 0; i < viewOldElementAttributes.length; i++) {
			var viewOldElementAttribute = viewOldElementAttributes[i];
			viewOldData[viewOldElementAttribute.name] = viewOldElementAttribute.value;
		}

		// Create a node from the root element.
		viewOldUpdate(new ViewNode(viewOldElement.tagName.toLowerCase(), viewOldData));
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
	 * Components
	 *
	 * Each component generates a corresponding view node based on the data it is
	 * passed as input. This data includes attributes and children.
	 */
	var components = {
		node: function node(name) {
			return function (data) {
				return new ViewNode(name, data);
			};
		}
	};
	var _loop = function _loop() {
		var name = names[i];
		components[name] = function (data) {
			return new ViewNode(name, data);
		};
	};
	for (var i = 0; i < names.length; i++) {
		_loop();
	}

	var view = {
		components: components,
		mount: mount
	};

	/**
	 * Returns a view given routes that map to views and the current route.
	 *
	 * @param {object} input
	 * @returns {object} view
	 */
	function router(input) {
		var route = input.route;
		var routeSegment = "/";
		var routes = input.routes;
		for (var i = 1; i < route.length; i++) {
			var routeCharacter = route[i];
			if (routeCharacter === "/") {
				routes = (routeSegment in routes ? routes[routeSegment] : routes["/*"])[1];
				routeSegment = "/";
			} else {
				routeSegment += routeCharacter;
			}
		}
		return (routeSegment in routes ? routes[routeSegment] : routes["/*"])[0](input);
	}

	var route = {
		router: router
	};

	var data = {};

	/**
	 * Cache for default property values
	 */
	var removeDataPropertyCache = {};

	/**
	 * Modify the prototype of a node to include special Moon view properties.
	 */
	Node.prototype.MoonChildren = null;

	/**
	 * Creates an element from a node.
	 *
	 * @param {object} node
	 * @returns {object} element
	 */
	function viewCreate(node) {
		var nodeName = node.name;
		if (nodeName === "text") {
			// Create a text node using the text content from the default key.
			return document.createTextNode(node.data.data);
		} else {
			// Create a DOM element.
			var element = document.createElement(nodeName);

			// Set data.
			var nodeData = node.data;
			for (var key in nodeData) {
				var value = nodeData[key];
				if (key[0] === "o" && key[1] === "n") {
					// Set an event listener.
					element[key.toLowerCase()] = value;
				} else {
					switch (key) {
						case "attributes":
							{
								// Set attributes.
								for (var valueKey in value) {
									element.setAttribute(valueKey, value[valueKey]);
								}
								break;
							}
						case "style":
							{
								// Set style properties.
								var elementStyle = element.style;
								for (var _valueKey in value) {
									elementStyle[_valueKey] = value[_valueKey];
								}
								break;
							}
						case "focus":
							{
								// Set focus if needed. Blur isn't set because it's the
								// default.
								if (value) {
									element.focus();
								}
								break;
							}
						case "class":
							{
								// Set a className property.
								element.className = value;
								break;
							}
						case "for":
							{
								// Set an htmlFor property.
								element.htmlFor = value;
								break;
							}
						case "children":
							{
								// Recursively append children.
								var elementMoonChildren = element.MoonChildren = [];
								for (var i = 0; i < value.length; i++) {
									var elementChild = viewCreate(value[i]);
									elementMoonChildren.push(elementChild);
									element.appendChild(elementChild);
								}
								break;
							}
						default:
							{
								// Set a DOM property.
								element[key] = value;
							}
					}
				}
			}
			return element;
		}
	}

	/**
	 * Patches an old element's data to match a new node, using an old node as
	 * reference.
	 *
	 * @param {object} nodeOld
	 * @param {object} nodeOldElement
	 * @param {object} nodeNew
	 */
	function viewPatch(nodeOld, nodeOldElement, nodeNew) {
		var nodeOldData = nodeOld.data;
		var nodeNewData = nodeNew.data;

		// First, go through all new data and update all of the existing data to
		// match.
		for (var keyNew in nodeNewData) {
			var valueOld = nodeOldData[keyNew];
			var valueNew = nodeNewData[keyNew];
			if (valueOld !== valueNew) {
				if (keyNew[0] === "o" && keyNew[1] === "n") {
					// Update an event.
					nodeOldElement[keyNew.toLowerCase()] = valueNew;
				} else {
					switch (keyNew) {
						case "attributes":
							{
								// Update attributes.
								if (valueOld === undefined) {
									for (var valueNewKey in valueNew) {
										nodeOldElement.setAttribute(valueNewKey, valueNew[valueNewKey]);
									}
								} else {
									for (var _valueNewKey in valueNew) {
										var valueNewValue = valueNew[_valueNewKey];
										if (valueOld[_valueNewKey] !== valueNewValue) {
											nodeOldElement.setAttribute(_valueNewKey, valueNewValue);
										}
									}

									// Remove attributes from the old value that are not in
									// the new value.
									for (var valueOldKey in valueOld) {
										if (!(valueOldKey in valueNew)) {
											nodeOldElement.removeAttribute(valueOldKey);
										}
									}
								}
								break;
							}
						case "style":
							{
								// Update style properties.
								var nodeOldElementStyle = nodeOldElement.style;
								if (valueOld === undefined) {
									for (var _valueNewKey2 in valueNew) {
										nodeOldElementStyle[_valueNewKey2] = valueNew[_valueNewKey2];
									}
								} else {
									for (var _valueNewKey3 in valueNew) {
										var _valueNewValue = valueNew[_valueNewKey3];
										if (valueOld[_valueNewKey3] !== _valueNewValue) {
											nodeOldElementStyle[_valueNewKey3] = _valueNewValue;
										}
									}

									// Remove style properties from the old value that are not
									// in the new value.
									for (var _valueOldKey in valueOld) {
										if (!(_valueOldKey in valueNew)) {
											nodeOldElementStyle[_valueOldKey] = "";
										}
									}
								}
								break;
							}
						case "focus":
							{
								// Update focus/blur.
								if (valueNew) {
									nodeOldElement.focus();
								} else {
									nodeOldElement.blur();
								}
								break;
							}
						case "class":
							{
								// Update a className property.
								nodeOldElement.className = valueNew;
								break;
							}
						case "for":
							{
								// Update an htmlFor property.
								nodeOldElement.htmlFor = valueNew;
								break;
							}
						case "children":
							{
								// Update children.
								var valueNewLength = valueNew.length;
								if (valueOld === undefined) {
									// If there were no old children, create new children.
									var nodeOldElementMoonChildren = nodeOldElement.MoonChildren = [];
									for (var i = 0; i < valueNewLength; i++) {
										var nodeOldElementChild = viewCreate(valueNew[i]);
										nodeOldElementMoonChildren.push(nodeOldElementChild);
										nodeOldElement.appendChild(nodeOldElementChild);
									}
								} else {
									var valueOldLength = valueOld.length;
									if (valueOldLength === valueNewLength) {
										// If the children have the same length then update
										// both as usual.
										var _nodeOldElementMoonChildren = nodeOldElement.MoonChildren;
										for (var _i = 0; _i < valueOldLength; _i++) {
											var valueOldNode = valueOld[_i];
											var valueNewNode = valueNew[_i];
											if (valueOldNode !== valueNewNode) {
												if (valueOldNode.name === valueNewNode.name) {
													viewPatch(valueOldNode, _nodeOldElementMoonChildren[_i], valueNewNode);
												} else {
													var valueOldElementNew = viewCreate(valueNewNode);
													nodeOldElement.replaceChild(valueOldElementNew, _nodeOldElementMoonChildren[_i]);
													_nodeOldElementMoonChildren[_i] = valueOldElementNew;
												}
											}
										}
									} else if (valueOldLength > valueNewLength) {
										// If there are more old children than new children,
										// update the corresponding ones and remove the extra
										// old children.
										var _nodeOldElementMoonChildren2 = nodeOldElement.MoonChildren;
										for (var _i2 = 0; _i2 < valueNewLength; _i2++) {
											var _valueOldNode = valueOld[_i2];
											var _valueNewNode = valueNew[_i2];
											if (_valueOldNode !== _valueNewNode) {
												if (_valueOldNode.name === _valueNewNode.name) {
													viewPatch(_valueOldNode, _nodeOldElementMoonChildren2[_i2], _valueNewNode);
												} else {
													var _valueOldElementNew = viewCreate(_valueNewNode);
													nodeOldElement.replaceChild(_valueOldElementNew, _nodeOldElementMoonChildren2[_i2]);
													_nodeOldElementMoonChildren2[_i2] = _valueOldElementNew;
												}
											}
										}
										for (var _i3 = valueNewLength; _i3 < valueOldLength; _i3++) {
											nodeOldElement.removeChild(_nodeOldElementMoonChildren2.pop());
										}
									} else {
										// If there are more new children than old children,
										// update the corresponding ones and append the extra
										// new children.
										var _nodeOldElementMoonChildren3 = nodeOldElement.MoonChildren;
										for (var _i4 = 0; _i4 < valueOldLength; _i4++) {
											var _valueOldNode2 = valueOld[_i4];
											var _valueNewNode2 = valueNew[_i4];
											if (_valueOldNode2 !== _valueNewNode2) {
												if (_valueOldNode2.name === _valueNewNode2.name) {
													viewPatch(_valueOldNode2, _nodeOldElementMoonChildren3[_i4], _valueNewNode2);
												} else {
													var _valueOldElementNew2 = viewCreate(_valueNewNode2);
													nodeOldElement.replaceChild(_valueOldElementNew2, _nodeOldElementMoonChildren3[_i4]);
													_nodeOldElementMoonChildren3[_i4] = _valueOldElementNew2;
												}
											}
										}
										for (var _i5 = valueOldLength; _i5 < valueNewLength; _i5++) {
											var _nodeOldElementChild = viewCreate(valueNew[_i5]);
											_nodeOldElementMoonChildren3.push(_nodeOldElementChild);
											nodeOldElement.appendChild(_nodeOldElementChild);
										}
									}
								}
								break;
							}
						default:
							{
								// Update a DOM property.
								nodeOldElement[keyNew] = valueNew;
							}
					}
				}
			}
		}

		// Next, go through all of the old data and remove data that isn't in the
		// new data.
		for (var keyOld in nodeOldData) {
			if (!(keyOld in nodeNewData)) {
				if (keyOld[0] === "o" && keyOld[1] === "n") {
					// Remove an event.
					nodeOldElement[keyOld.toLowerCase()] = null;
				} else {
					switch (keyOld) {
						case "attributes":
							{
								// Remove attributes.
								var _valueOld = nodeOldData.attributes;
								for (var _valueOldKey2 in _valueOld) {
									nodeOldElement.removeAttribute(_valueOldKey2);
								}
								break;
							}
						case "focus":
							{
								// Remove focus.
								nodeOldElement.blur();
								break;
							}
						case "class":
							{
								// Remove a className property.
								nodeOldElement.className = "";
								break;
							}
						case "for":
							{
								// Remove an htmlFor property.
								nodeOldElement.htmlFor = "";
								break;
							}
						case "children":
							{
								// Remove children.
								var _valueOldLength = nodeOldData.children.length;
								var _nodeOldElementMoonChildren4 = nodeOldElement.MoonChildren;
								for (var _i6 = 0; _i6 < _valueOldLength; _i6++) {
									nodeOldElement.removeChild(_nodeOldElementMoonChildren4.pop());
								}
								break;
							}
						default:
							{
								// Remove a DOM property.
								var nodeOldName = nodeOld.name;
								nodeOldElement[keyOld] = (nodeOldName in removeDataPropertyCache ? removeDataPropertyCache[nodeOldName] : removeDataPropertyCache[nodeOldName] = nodeOldName === "text" ? document.createTextNode("") : document.createElement(nodeOldName))[keyOld];
							}
					}
				}
			}
		}
	}

	/**
	 * The view transformer renderer is responsible for updating the DOM and
	 * rendering views. The patch consists of walking the new tree and finding
	 * differences between the trees. The old tree is used to compare values for
	 * performance. The DOM is updated to reflect these changes as well. Ideally,
	 * the DOM would provide an API for creating lightweight elements and render
	 * directly from a virtual DOM, but Moon uses the imperative API for updating
	 * it instead.
	 *
	 * Since views can easily be cached, Moon skips over patches if the old and new
	 * nodes are equal. This is also why views should be pure and immutable. They
	 * are created every render and stored, so if they are ever mutated, Moon will
	 * skip them anyway because they have the same reference. It can use a little
	 * more memory, but Moon nodes are heavily optimized to work well with
	 * JavaScript engines, and immutability opens up the opportunity to use
	 * standard functional techniques for caching.
	 *
	 * @param {object} viewNew
	 */
	var view$1 = {
		set: function set(viewNew) {
			// When given a new view, patch the old element to match the new node using
			// the old node as reference.
			if (viewOld.name === viewNew.name) {
				// If the root views have the same name, patch their data.
				viewPatch(viewOld, viewOldElement, viewNew);
			} else {
				// If they have different names, create a new old view element.
				var viewOldElementNew = viewCreate(viewNew);

				// Manipulate the DOM to replace the old view.
				viewOldElement.parentNode.replaceChild(viewOldElementNew, viewOldElement);

				// Update the reference to the old view element.
				viewOldElementUpdate(viewOldElementNew);
			}

			// Store the new view as the old view to be used as reference during a
			// patch.
			viewOldUpdate(viewNew);
		}
	};

	var time = {
		get: function get() {
			return Date.now();
		},
		set: function set(input) {
			setTimeout(input[1], input[0] * 1000);
		}
	};

	var storage = {
		get: function get() {
			return localStorage;
		},
		set: function set(localStorageNew) {
			for (var keyNew in localStorageNew) {
				var valueNew = localStorageNew[keyNew];
				if (localStorage[keyNew] !== valueNew) {
					localStorage[keyNew] = valueNew;
				}
			}
			for (var keyOld in localStorage) {
				if (!(keyOld in localStorageNew)) {
					delete localStorage[keyOld];
				}
			}
		}
	};

	/*
	 * Match HTTP headers.
	 */
	var headerRE = /^([^:]+):\s*([^]*?)\s*$/gm;
	var http = {
		set: function set(request) {
			var xhr = new XMLHttpRequest();

			// Handle response types.
			xhr.responseType = "responseType" in request ? request.responseType : "text";

			// Handle load event.
			if ("onLoad" in request) {
				xhr.onload = function () {
					var responseHeaders = {};
					var responseHeadersText = xhr.getAllResponseHeaders();
					var responseHeader;

					// Parse headers to object.
					while ((responseHeader = headerRE.exec(responseHeadersText)) !== null) {
						responseHeaders[responseHeader[1]] = responseHeader[2];
					}

					// Run load event handler.
					request.onLoad({
						status: xhr.status,
						headers: responseHeaders,
						body: xhr.response
					});
				};
			}

			// Handle error event.
			if ("onError" in request) {
				xhr.onerror = request.onError;
			}

			// Open the request with the given method and URL.
			xhr.open("method" in request ? request.method : "GET", request.url);

			// Set request headers.
			if ("headers" in request) {
				var requestHeaders = request.headers;
				for (var requestHeader in requestHeaders) {
					xhr.setRequestHeader(requestHeader, requestHeaders[requestHeader]);
				}
			}

			// Send the request with the given body.
			xhr.send("body" in request ? request.body : null);
		}
	};

	var route$1 = {
		get: function get() {
			return location.pathname;
		},
		set: function set(routeNew) {
			history.pushState(null, "", routeNew);
		}
	};

	var m = {};
	m.data = data;
	Object.defineProperty(m, "view", view$1);
	Object.defineProperty(m, "time", time);
	Object.defineProperty(m, "storage", storage);
	Object.defineProperty(m, "http", http);
	Object.defineProperty(m, "route", route$1);

	var Moon = {
		m: m,
		route: route,
		version: "1.0.0-beta.7",
		view: view
	};

	/**
	 * Matches an identifier character.
	 */
	var identifierRE = /[$\w.]/;

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
			return parser.type("nodeDataChildren", parser.sequence([parser.character("<"), grammar.separator, grammar.value, grammar.separator, grammar.attributes, parser.character(">"), parser.many(parser.alternates([parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren), grammar.text, grammar.interpolation])), parser.string("</"), parser.many(parser.not([">"])), parser.character(">")]))(input, index);
		},
		expression: function expression(input, index) {
			return parser.many(parser.alternates([
			// Single line comment
			parser.sequence([parser.string("//"), parser.many(parser.not(["\n"]))]),
			// Multi-line comment
			parser.sequence([parser.string("/*"), parser.many(parser.not(["*/"])), parser.string("*/")]),
			// Regular expression
			parser["try"](parser.sequence([parser.character("/"), parser.many1(parser.or(parser.and(parser.character("\\"), parser.not(["\n"])), parser.not(["/", "\n"]))), parser.character("/")])), grammar.comment, grammar.value, parser["try"](grammar.node), parser["try"](grammar.nodeData), parser["try"](grammar.nodeDataChildren),
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
		return name;
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
			var _output = "";
			var separator = "";
			for (var _i = 0; _i < value.length; _i++) {
				var pair = value[_i];
				var attributeName = normalizeAttributeName(generate(unwrapBraces(pair[0])));
				var pairValue = pair[1];
				if (attributeName.slice(0, 3) === "...") {
					var spreadExpr = attributeName.slice(3) || generate(unwrapBraces(pairValue && pairValue[1] || []));
					_output += separator + "..." + spreadExpr + generate(pair[2]);
				} else {
					var attributeValue = pairValue === null ? "true" : generate(unwrapBraces(pairValue[1]));
					_output += separator + "\"" + attributeName + "\":" + attributeValue + generate(pair[2]);
				}
				separator = ",";
			}
			return {
				output: _output,
				separator: separator
			};
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
			var dataGenerated = generate(data);
			return "" + generate(_value2[1]) + generateName(_value2[2]) + generate(_value2[3]) + "(" + (data.type === "attributes" ? "{" + dataGenerated.output + "}" : dataGenerated) + ")";
		} else if (type === "nodeDataChildren") {
			// Data and children nodes represent calling a function with a data
			// object using attribute syntax and children.
			var _value3 = tree.value;
			var _data = generate(_value3[4]);
			var children = _value3[6];
			var childrenLength = children.length;
			var childrenGenerated;
			if (childrenLength === 0) {
				childrenGenerated = "";
			} else {
				var _separator = "";
				childrenGenerated = _data.separator + "children:[";
				for (var _i2 = 0; _i2 < childrenLength; _i2++) {
					var child = children[_i2];
					var childGenerated = generate(child);
					if (child.type === "text") {
						if (childGenerated.isWhitespace) {
							childrenGenerated += childGenerated.output;
						} else {
							childrenGenerated += _separator + childGenerated.output;
							_separator = ",";
						}
					} else {
						childrenGenerated += _separator + childGenerated;
						_separator = ",";
					}
				}
				childrenGenerated += "]";
			}
			return "" + generate(_value3[1]) + generateName(_value3[2]) + generate(_value3[3]) + "({" + _data.output + childrenGenerated + "})";
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
	 * Compiles a JavaScript file with Moon syntax.
	 *
	 * @param {string} input
	 * @returns {string} file code
	 */
	function compile(input) {
		var parseOutput = parse(input);
		if ("development" === "development" && parseOutput.constructor.name === "ParseError") {
			error("Invalid input to parser.\n\nAttempted to parse input.\n\nExpected " + parseOutput.expected + ".\n\nReceived:\n\n" + format(input, parseOutput.index));
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

	return Moon;
}));
