/**
 * Moon Web v1.0.0-beta.7
 * Copyright 2016-2020 kbrsh
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

	/**
	 * Cache for default property values
	 */
	var removeDataPropertyCache = {};
	function cls() {
		var out = "";
		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;
			var type = typeof arg;
			if (type === "string" || type === "number") {
				out += (out ? " " : "") + arg;
			} else if (Array.isArray(arg)) {
				var nested = cls.apply(null, arg);
				if (nested) out += (out ? " " : "") + nested;
			} else if (type === "object") {
				for (var key in arg) {
					if (arg[key]) out += (out ? " " : "") + key;
				}
			}
		}
		return out;
	}
	function mergeProps() {
		var target = {};
		for (var i = 0; i < arguments.length; i++) {
			var source = arguments[i];
			if (!source || typeof source !== "object") continue;
			for (var key in source) {
				target[key] = source[key];
			}
		}
		return target;
	}
	function warnOnce(category, message) {
		throw new Error(message);
	}
	function setRef(ref, value) {
		assertRefValue(ref, value && value.nodeName ? value.nodeName.toLowerCase() : "node");
		if (!ref) return;
		if (typeof ref === "function") {
			ref(value);
		} else if (typeof ref === "object") {
			ref.current = value;
		} else {
			throw new Error("[Moon] Unsupported ref type; refs must be functions or ref objects.");
		}
	}
	function normalizeStyleInline(style) {
		if (!style || typeof style !== "object") return style;
		var keys = Object.keys(style);
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key === null || key === undefined) continue;
			if (key.indexOf("-") !== -1) {
				var parts = key.split("-");
				var next = parts[0];
				for (var j = 1; j < parts.length; j++) {
					var part = parts[j];
					if (part.length > 0) {
						next += part[0].toUpperCase() + part.slice(1);
					}
				}
				if (!(next in style)) {
					style[next] = style[key];
				}
				delete style[key];
			}
		}
		return style;
	}
	function isUnknownDomProp(element, key) {
		if (!element || typeof element !== "object") return false;
		if (key === "key" || key === "ref") return false;
		if (key === "attributes" || key === "style" || key === "innerHTML" || key === "focus" || key === "class" || key === "for" || key === "children") return false;
		if (key[0] === "o" && key[1] === "n") return false;
		if (key.indexOf("data-") === 0 || key.indexOf("aria-") === 0) return false;
		return !(key in element);
	}
	function normalizeEventKey(key) {
		switch (key) {
			case "onChange":
				return "oninput";
			case "onDoubleClick":
				return "ondblclick";
			case "onFocus":
				return "onfocus";
			case "onBlur":
				return "onblur";
			case "onSubmit":
				return "onsubmit";
			case "onMouseEnter":
				return "onmouseenter";
			case "onMouseLeave":
				return "onmouseleave";
			case "onMouseOver":
				return "onmouseover";
			case "onMouseOut":
				return "onmouseout";
			case "onKeyDown":
				return "onkeydown";
			case "onKeyUp":
				return "onkeyup";
			case "onKeyPress":
				return "onkeypress";
			case "onInput":
				return "oninput";
			default:
				return key.toLowerCase();
		}
	}
	function assertStyleObject(value, nodeName) {
		var valueType = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			throw new Error("[Moon] Style on <" + nodeName + "> must be a plain object, received " + valueType + ".");
		}
	}
	function assertEventHandler(value, key, nodeName) {
		if (typeof value !== "function") {
			throw new Error("[Moon] Event handler " + key + " on <" + nodeName + "> must be a function.");
		}
	}
	function assertValidKey(key, nodeName) {
		if (key === undefined) return;
		var type = typeof key;
		if (key === null || type !== "string" && type !== "number" || key === "") {
			throw new Error("[Moon] Key on <" + nodeName + "> must be a string or number, received " + (key === null ? "null" : type) + ".");
		}
	}
	function assertRefValue(ref, nodeName) {
		if (ref === undefined) return;
		if (typeof ref === "function") return;
		if (ref && typeof ref === "object") return;
		throw new Error("[Moon] Ref on <" + nodeName + "> must be a function or ref object.");
	}
	function assertChildrenArray(children, nodeName) {
		if (!Array.isArray(children)) {
			throw new Error("[Moon] Children on <" + nodeName + "> must be an array.");
		}
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			if (!child || typeof child !== "object" || !child.name) {
				throw new Error("[Moon] Child " + i + " of <" + nodeName + "> is not a valid view node.");
			}
		}
	}
	function assertPlainObject(value, nodeName, propName) {
		if (!value || typeof value !== "object" || Array.isArray(value)) {
			var type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
			throw new Error("[Moon] " + propName + " on <" + nodeName + "> must be a plain object, received " + type + ".");
		}
	}
	function assertBooleanProp(value, nodeName, propName) {
		if (typeof value !== "boolean") {
			throw new Error("[Moon] " + propName + " on <" + nodeName + "> must be a boolean.");
		}
	}
	function normalizeStringLikeProp(value, nodeName, propName) {
		if (typeof value === "string" || typeof value === "number") return value;
		throw new Error("[Moon] " + propName + " on <" + nodeName + "> must be a string or number.");
	}
	function assertStyleValue(value, nodeName, styleKey) {
		var type = typeof value;
		if (type === "number" && Number.isFinite(value)) return;
		if (type === "string") return;
		throw new Error("[Moon] Style \"" + styleKey + "\" on <" + nodeName + "> must be a finite number or string, received " + type + ".");
	}
	function assertStyleKey(styleKey, nodeName) {
		if (typeof styleKey !== "string" || styleKey.length === 0 || styleKey === "null" || styleKey === "undefined") {
			throw new Error("[Moon] Style key on <" + nodeName + "> must be a non-empty string.");
		}
	}
	function validateAttributesObject(attributes, nodeName) {
		for (var attrKey in attributes) {
			if (attrKey === "" || attrKey === null || attrKey === undefined || typeof attrKey !== "string") {
				throw new Error("[Moon] Attribute key on <" + nodeName + "> must be a non-empty string.");
			}
			var value = attributes[attrKey];
			var type = typeof value;
			if (value === null || value === undefined) {
				throw new Error("[Moon] Attribute \"" + attrKey + "\" on <" + nodeName + "> must not be null/undefined.");
			}
			if (type === "number" && !Number.isFinite(value)) {
				throw new Error("[Moon] Attribute \"" + attrKey + "\" on <" + nodeName + "> must be a finite number, received " + value + ".");
			}
			if (type !== "string" && type !== "number" && type !== "boolean") {
				throw new Error("[Moon] Attribute \"" + attrKey + "\" on <" + nodeName + "> must be a string, number, or boolean, received " + type + ".");
			}
		}
	}
	function validatePropsShape(nodeData, nodeName) {
		if (!nodeData || typeof nodeData !== "object") {
			throw new Error("[Moon] Props on <" + nodeName + "> must be an object.");
		}
		for (var key in nodeData) {
			var value = nodeData[key];
			if (value === undefined) {
				throw new Error("[Moon] Prop \"" + key + "\" on <" + nodeName + "> is undefined; pass null to intentionally clear.");
			}
			if (key[0] === "o" && key[1] === "n") {
				assertEventHandler(value, key, nodeName);
			}
			if (key === "children") {
				assertChildrenArray(value, nodeName);
			}
			if (key === "attributes") {
				assertPlainObject(value, nodeName, "Attributes");
				validateAttributesObject(value, nodeName);
			}
			if (key === "style") {
				assertStyleObject(value, nodeName);
				normalizeStyleInline(value);
				for (var styleKey in value) {
					assertStyleKey(styleKey, nodeName);
					assertStyleValue(value[styleKey], nodeName, styleKey);
				}
			}
			if (key === "ref") {
				assertRefValue(value, nodeName);
			}
			if (key === "key") {
				assertValidKey(value, nodeName);
			}
			if (key === "class" || key === "for") {
				normalizeStringLikeProp(value, nodeName, key);
			}
			if (key === "focus") {
				assertBooleanProp(value, nodeName, "focus");
			}
			if (key === "innerHTML") {
				if (typeof value !== "string") {
					throw new Error("[Moon] innerHTML on <" + nodeName + "> must be a string.");
				}
			}
		}
	}
	function describeChildShape(children) {
		if (!Array.isArray(children) || children.length === 0) return "";
		var shape = "";
		for (var i = 0; i < children.length; i++) {
			var child = children[i];
			var childName = child && child.name ? child.name : "unknown";
			var keyed = child && child.data && child.data.key !== undefined ? "#keyed" : "#unkeyed";
			shape += "" + childName + keyed + ";";
		}
		return shape;
	}
	function assertStableKeyedChildShape(nodeOld, nodeNew) {
		var keyOld = nodeOld && nodeOld.data ? nodeOld.data.key : undefined;
		var keyNew = nodeNew && nodeNew.data ? nodeNew.data.key : undefined;
		if (keyOld === undefined || keyNew === undefined || keyOld !== keyNew) return;
		var oldChildren = nodeOld.data && nodeOld.data.children;
		var newChildren = nodeNew.data && nodeNew.data.children;
		if (!oldChildren || !newChildren) return;
		var oldShape = describeChildShape(oldChildren);
		var newShape = describeChildShape(newChildren);
		if (oldShape !== newShape) {
			throw new Error("[Moon] Key \"" + keyNew + "\" on <" + nodeNew.name + "> was reused but its child shape changed; change the key when swapping layouts to avoid DOM corruption.");
		}
	}

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
			validatePropsShape(nodeData, nodeName);
			for (var key in nodeData) {
				var value = nodeData[key];
				if (key[0] === "o" && key[1] === "n") {
					// Set an event listener.
					assertEventHandler(value, key, nodeName);
					element[normalizeEventKey(key)] = value;
				} else {
					switch (key) {
						case "attributes":
							{
								// Set attributes.
								assertPlainObject(value, nodeName, "Attributes");
								validateAttributesObject(value, nodeName);
								for (var valueKey in value) {
									element.setAttribute(valueKey, value[valueKey]);
								}
								break;
							}
						case "style":
							{
								// Set style properties.
								assertStyleObject(value, nodeName);
								var elementStyle = element.style;
								normalizeStyleInline(value);
								for (var _valueKey in value) {
									assertStyleKey(_valueKey, nodeName);
									assertStyleValue(value[_valueKey], nodeName, _valueKey);
									elementStyle[_valueKey] = value[_valueKey];
								}
								break;
							}
						case "innerHTML":
							{
								// Set raw HTML content.
								if (typeof value !== "string") {
									throw new Error("[Moon] innerHTML on <" + nodeName + "> must be a string.");
								}
								element.innerHTML = value;
								break;
							}
						case "focus":
							{
								// Set focus if needed. Blur isn't set because it's the
								// default.
								assertBooleanProp(value, nodeName, "focus");
								if (value === true) {
									element.focus();
								}
								break;
							}
						case "class":
							{
								// Set a className property.
								element.className = normalizeStringLikeProp(value, nodeName, "class");
								break;
							}
						case "for":
							{
								// Set an htmlFor property.
								element.htmlFor = normalizeStringLikeProp(value, nodeName, "for");
								break;
							}
						case "ref":
							{
								setRef(value, element);
								break;
							}
						case "children":
							{
								// Recursively append children.
								assertChildrenArray(value, nodeName);
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
								if (isUnknownDomProp(element, key)) {
									warnOnce("unknownProp", "[Moon] Unknown DOM prop \"" + key + "\" on <" + nodeName + ">; it will be set as a property.");
								}
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
		validatePropsShape(nodeNewData, nodeOld.name);

		// First, go through all new data and update all of the existing data to
		// match.
		for (var keyNew in nodeNewData) {
			var valueOld = nodeOldData[keyNew];
			var valueNew = nodeNewData[keyNew];
			if (valueOld !== valueNew) {
				if (keyNew[0] === "o" && keyNew[1] === "n") {
					// Update an event.
					assertEventHandler(valueNew, keyNew, nodeOld.name);
					nodeOldElement[normalizeEventKey(keyNew)] = valueNew;
				} else {
					switch (keyNew) {
						case "attributes":
							{
								// Update attributes.
								assertPlainObject(valueNew, nodeOld.name, "Attributes");
								validateAttributesObject(valueNew, nodeOld.name);
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
								assertStyleObject(valueNew, nodeOld.name);
								normalizeStyleInline(valueNew);
								if (valueOld) normalizeStyleInline(valueOld);
								if (valueOld === undefined) {
									for (var _valueNewKey2 in valueNew) {
										assertStyleKey(_valueNewKey2, nodeOld.name);
										assertStyleValue(valueNew[_valueNewKey2], nodeOld.name, _valueNewKey2);
										nodeOldElementStyle[_valueNewKey2] = valueNew[_valueNewKey2];
									}
								} else {
									for (var _valueNewKey3 in valueNew) {
										var _valueNewValue = valueNew[_valueNewKey3];
										assertStyleKey(_valueNewKey3, nodeOld.name);
										assertStyleValue(_valueNewValue, nodeOld.name, _valueNewKey3);
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
								assertBooleanProp(valueNew, nodeOld.name, "focus");
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
								nodeOldElement.className = normalizeStringLikeProp(valueNew, nodeOld.name, "class");
								break;
							}
						case "for":
							{
								// Update an htmlFor property.
								nodeOldElement.htmlFor = normalizeStringLikeProp(valueNew, nodeOld.name, "for");
								break;
							}
						case "ref":
							{
								assertRefValue(valueNew, nodeOld.name);
								setRef(valueNew, nodeOldElement);
								break;
							}
						case "children":
							{
								// Update children.
								var nodeOldElementMoonChildren = nodeOldElement.MoonChildren || [];
								var valueNewLength = valueNew.length;
								assertChildrenArray(valueNew, nodeOld.name);
								if (valueOld !== undefined) {
									assertChildrenArray(valueOld, nodeOld.name);
								}
								for (var i = 0; i < valueNewLength; i++) {
									var childNode = valueNew[i];
									assertValidKey(childNode && childNode.data && childNode.data.key, childNode && childNode.name ? childNode.name : "node");
									var childRef = childNode && childNode.data && childNode.data.ref;
									assertRefValue(childRef, childNode && childNode.name ? childNode.name : "node");
								}
								if (valueOld !== undefined) {
									assertStableKeyedChildShape(nodeOld, nodeNew);
								}

								// Keyed diff if keys exist on new nodes.
								var keyed = [];
								var hasKeys = true;
								var hasAnyKey = false;
								var keySet = Object.create(null);
								var dupKeyDetected = false;
								for (var _i = 0; _i < valueNewLength; _i++) {
									var key = valueNew[_i].data && valueNew[_i].data.key;
									assertValidKey(key, valueNew[_i].name);
									if (key === undefined) {
										hasKeys = false;
									} else {
										hasAnyKey = true;
										if (keySet[key]) {
											dupKeyDetected = true;
										} else {
											keySet[key] = true;
										}
									}
									keyed.push(key);
								}
								if (hasAnyKey && !hasKeys) {
									warnOnce("mixedKeys", "[Moon] Some children have a key and some do not; keyed children must be consistently keyed.");
								}
								if (dupKeyDetected) {
									warnOnce("dupKeys", "[Moon] Duplicate keys detected among siblings; keys must be unique.");
								}
								if (valueOld === undefined) {
									for (var _i2 = 0; _i2 < valueNewLength; _i2++) {
										var childEl = viewCreate(valueNew[_i2]);
										nodeOldElementMoonChildren.push(childEl);
										nodeOldElement.appendChild(childEl);
									}
									nodeOldElement.MoonChildren = nodeOldElementMoonChildren;
								} else if (hasKeys) {
									var oldKeyMap = {};
									for (var _i3 = 0; _i3 < valueOld.length; _i3++) {
										var _key = valueOld[_i3].data && valueOld[_i3].data.key;
										assertValidKey(_key, valueOld[_i3].name);
										if (_key !== undefined) {
											if (oldKeyMap[_key]) {
												throw new Error("[Moon] Duplicate keys detected among existing siblings under <" + nodeOld.name + ">; keys must be unique.");
											}
											oldKeyMap[_key] = {
												node: valueOld[_i3],
												el: nodeOldElementMoonChildren[_i3],
												used: false
											};
										}
									}
									var newChildrenEls = [];
									for (var _i4 = 0; _i4 < valueNewLength; _i4++) {
										var newNode = valueNew[_i4];
										var _key2 = keyed[_i4];
										var existing = oldKeyMap[_key2];
										if (existing) {
											viewPatch(existing.node, existing.el, newNode);
											existing.used = true;
											newChildrenEls.push(existing.el);
										} else {
											var _childEl = viewCreate(newNode);
											newChildrenEls.push(_childEl);
										}
									}

									// Remove unused old keyed elements.
									for (var _key3 in oldKeyMap) {
										if (!oldKeyMap[_key3].used) {
											nodeOldElement.removeChild(oldKeyMap[_key3].el);
										}
									}

									// Reorder/mount in the new order to avoid stale DOM positions.
									var reference = nodeOldElement.firstChild;
									for (var _i5 = 0; _i5 < valueNewLength; _i5++) {
										var desired = newChildrenEls[_i5];
										if (reference === desired) {
											reference = reference.nextSibling;
										} else {
											nodeOldElement.insertBefore(desired, reference);
											reference = desired.nextSibling;
										}
									}
									while (reference) {
										var next = reference.nextSibling;
										nodeOldElement.removeChild(reference);
										reference = next;
									}
									nodeOldElement.MoonChildren = newChildrenEls;
								} else {
									var valueOldLength = valueOld.length;
									if (valueOldLength === valueNewLength) {
										for (var _i6 = 0; _i6 < valueOldLength; _i6++) {
											var valueOldNode = valueOld[_i6];
											var valueNewNode = valueNew[_i6];
											if (valueOldNode !== valueNewNode) {
												if (valueOldNode.name === valueNewNode.name) {
													viewPatch(valueOldNode, nodeOldElementMoonChildren[_i6], valueNewNode);
												} else {
													var valueOldElementNew = viewCreate(valueNewNode);
													nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[_i6]);
													nodeOldElementMoonChildren[_i6] = valueOldElementNew;
												}
											}
										}
									} else if (valueOldLength > valueNewLength) {
										for (var _i7 = 0; _i7 < valueNewLength; _i7++) {
											var _valueOldNode = valueOld[_i7];
											var _valueNewNode = valueNew[_i7];
											if (_valueOldNode !== _valueNewNode) {
												if (_valueOldNode.name === _valueNewNode.name) {
													viewPatch(_valueOldNode, nodeOldElementMoonChildren[_i7], _valueNewNode);
												} else {
													var _valueOldElementNew = viewCreate(_valueNewNode);
													nodeOldElement.replaceChild(_valueOldElementNew, nodeOldElementMoonChildren[_i7]);
													nodeOldElementMoonChildren[_i7] = _valueOldElementNew;
												}
											}
										}
										for (var _i8 = valueNewLength; _i8 < valueOldLength; _i8++) {
											nodeOldElement.removeChild(nodeOldElementMoonChildren.pop());
										}
									} else {
										for (var _i9 = 0; _i9 < valueOldLength; _i9++) {
											var _valueOldNode2 = valueOld[_i9];
											var _valueNewNode2 = valueNew[_i9];
											if (_valueOldNode2 !== _valueNewNode2) {
												if (_valueOldNode2.name === _valueNewNode2.name) {
													viewPatch(_valueOldNode2, nodeOldElementMoonChildren[_i9], _valueNewNode2);
												} else {
													var _valueOldElementNew2 = viewCreate(_valueNewNode2);
													nodeOldElement.replaceChild(_valueOldElementNew2, nodeOldElementMoonChildren[_i9]);
													nodeOldElementMoonChildren[_i9] = _valueOldElementNew2;
												}
											}
										}
										for (var _i0 = valueOldLength; _i0 < valueNewLength; _i0++) {
											var nodeOldElementChild = viewCreate(valueNew[_i0]);
											nodeOldElementMoonChildren.push(nodeOldElementChild);
											nodeOldElement.appendChild(nodeOldElementChild);
										}
									}
								}
								break;
							}
						default:
							{
								if (isUnknownDomProp(nodeOldElement, keyNew)) {
									warnOnce("unknownProp", "[Moon] Unknown DOM prop \"" + keyNew + "\" on <" + nodeOld.name + ">; use a valid DOM prop or data-/aria-.");
								}
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
								for (var _i1 = 0; _i1 < _valueOldLength; _i1++) {
									nodeOldElement.removeChild(_nodeOldElementMoonChildren.pop());
								}
								break;
							}
						case "ref":
							{
								// Clear ref on removal.
								setRef(nodeOldData.ref, null);
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
	var view = {
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

	var view$1 = {
		components: components,
		mount: mount,
		normalizeChildren: normalizeChildren,
		cls: cls,
		mergeProps: mergeProps
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
	Object.defineProperty(m, "view", view);
	Object.defineProperty(m, "time", time);
	Object.defineProperty(m, "storage", storage);
	Object.defineProperty(m, "http", http);
	Object.defineProperty(m, "route", route$1);

	var Moon = {
		m: m,
		route: route,
		version: "1.0.0-beta.7",
		view: view$1
	};

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

	return Moon;
}));
