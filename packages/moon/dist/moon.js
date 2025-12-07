/**
 * Moon v1.0.0-beta.7
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

	/**
	 * Normalize arbitrary child values into an array of Moon view nodes.
	 *
	 * - Strings/numbers/bigints become text nodes.
	 * - Arrays are flattened recursively.
	 * - Existing view nodes are passed through.
	 * - Null/undefined/booleans are ignored.
	 */
	function normalizeChildren(value) {
		if (value === null || value === undefined || typeof value === "boolean") {
			return [];
		}
		if (Array.isArray(value)) {
			var normalized = [];
			for (var i = 0; i < value.length; i++) {
				var children = normalizeChildren(value[i]);
				for (var j = 0; j < children.length; j++) {
					normalized.push(children[j]);
				}
			}
			return normalized;
		}
		var valueType = typeof value;
		if (valueType === "string" || valueType === "number" || valueType === "bigint") {
			return [components.text({
				data: String(value)
			})];
		}
		if (value && value.name !== undefined) {
			return [value];
		}
		return [components.text({
			data: String(value)
		})];
	}

	var view = {
		components: components,
		mount: mount,
		normalizeChildren: normalizeChildren
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
			element.MoonChildren = element.MoonChildren || [];

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
						case "innerHTML":
							{
								// Set raw HTML content.
								element.innerHTML = value;
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
								var nodeOldElementMoonChildren = nodeOldElement.MoonChildren || [];
								var valueNewLength = valueNew.length;

								// Keyed diff if keys exist on new nodes.
								var keyed = [];
								var hasKeys = true;
								for (var i = 0; i < valueNewLength; i++) {
									var key = valueNew[i].data && valueNew[i].data.key;
									if (key === undefined) {
										hasKeys = false;
										break;
									}
									keyed.push(key);
								}
								if (valueOld === undefined) {
									for (var _i = 0; _i < valueNewLength; _i++) {
										var childEl = viewCreate(valueNew[_i]);
										nodeOldElementMoonChildren.push(childEl);
										nodeOldElement.appendChild(childEl);
									}
									nodeOldElement.MoonChildren = nodeOldElementMoonChildren;
								} else if (hasKeys) {
									var oldKeyMap = {};
									for (var _i2 = 0; _i2 < valueOld.length; _i2++) {
										var _key = valueOld[_i2].data && valueOld[_i2].data.key;
										if (_key !== undefined) {
											oldKeyMap[_key] = {
												node: valueOld[_i2],
												el: nodeOldElementMoonChildren[_i2],
												used: false
											};
										}
									}
									var newChildrenEls = [];
									for (var _i3 = 0; _i3 < valueNewLength; _i3++) {
										var newNode = valueNew[_i3];
										var _key2 = keyed[_i3];
										var existing = oldKeyMap[_key2];
										if (existing) {
											viewPatch(existing.node, existing.el, newNode);
											existing.used = true;
											newChildrenEls.push(existing.el);
										} else {
											var _childEl = viewCreate(newNode);
											newChildrenEls.push(_childEl);
											nodeOldElement.appendChild(_childEl);
										}
									}

									// Remove unused old keyed elements.
									for (var _key3 in oldKeyMap) {
										if (!oldKeyMap[_key3].used) {
											nodeOldElement.removeChild(oldKeyMap[_key3].el);
										}
									}
									nodeOldElement.MoonChildren = newChildrenEls;
								} else {
									var valueOldLength = valueOld.length;
									if (valueOldLength === valueNewLength) {
										for (var _i4 = 0; _i4 < valueOldLength; _i4++) {
											var valueOldNode = valueOld[_i4];
											var valueNewNode = valueNew[_i4];
											if (valueOldNode !== valueNewNode) {
												if (valueOldNode.name === valueNewNode.name) {
													viewPatch(valueOldNode, nodeOldElementMoonChildren[_i4], valueNewNode);
												} else {
													var valueOldElementNew = viewCreate(valueNewNode);
													nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[_i4]);
													nodeOldElementMoonChildren[_i4] = valueOldElementNew;
												}
											}
										}
									} else if (valueOldLength > valueNewLength) {
										for (var _i5 = 0; _i5 < valueNewLength; _i5++) {
											var _valueOldNode = valueOld[_i5];
											var _valueNewNode = valueNew[_i5];
											if (_valueOldNode !== _valueNewNode) {
												if (_valueOldNode.name === _valueNewNode.name) {
													viewPatch(_valueOldNode, nodeOldElementMoonChildren[_i5], _valueNewNode);
												} else {
													var _valueOldElementNew = viewCreate(_valueNewNode);
													nodeOldElement.replaceChild(_valueOldElementNew, nodeOldElementMoonChildren[_i5]);
													nodeOldElementMoonChildren[_i5] = _valueOldElementNew;
												}
											}
										}
										for (var _i6 = valueNewLength; _i6 < valueOldLength; _i6++) {
											nodeOldElement.removeChild(nodeOldElementMoonChildren.pop());
										}
									} else {
										for (var _i7 = 0; _i7 < valueOldLength; _i7++) {
											var _valueOldNode2 = valueOld[_i7];
											var _valueNewNode2 = valueNew[_i7];
											if (_valueOldNode2 !== _valueNewNode2) {
												if (_valueOldNode2.name === _valueNewNode2.name) {
													viewPatch(_valueOldNode2, nodeOldElementMoonChildren[_i7], _valueNewNode2);
												} else {
													var _valueOldElementNew2 = viewCreate(_valueNewNode2);
													nodeOldElement.replaceChild(_valueOldElementNew2, nodeOldElementMoonChildren[_i7]);
													nodeOldElementMoonChildren[_i7] = _valueOldElementNew2;
												}
											}
										}
										for (var _i8 = valueOldLength; _i8 < valueNewLength; _i8++) {
											var nodeOldElementChild = viewCreate(valueNew[_i8]);
											nodeOldElementMoonChildren.push(nodeOldElementChild);
											nodeOldElement.appendChild(nodeOldElementChild);
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
								var _nodeOldElementMoonChildren = nodeOldElement.MoonChildren || [];
								for (var _i9 = 0; _i9 < _valueOldLength; _i9++) {
									nodeOldElement.removeChild(_nodeOldElementMoonChildren.pop());
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

	var index = {
		m: m,
		route: route,
		version: "1.0.0-beta.7",
		view: view
	};

	return index;
}));
