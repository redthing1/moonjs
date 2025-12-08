import { viewOld, viewOldUpdate, viewOldElement, viewOldElementUpdate } from "moon/src/view/state";

/**
 * Cache for default property values
 */
const removeDataPropertyCache = {};

export function cls() {
	let out = "";
	for (let i = 0; i < arguments.length; i++) {
		const arg = arguments[i];
		if (!arg) continue;
		const type = typeof arg;
		if (type === "string" || type === "number") {
			out += (out ? " " : "") + arg;
		} else if (Array.isArray(arg)) {
			const nested = cls.apply(null, arg);
			if (nested) out += (out ? " " : "") + nested;
		} else if (type === "object") {
			for (const key in arg) {
				if (arg[key]) out += (out ? " " : "") + key;
			}
		}
	}
	return out;
}

export function mergeProps() {
	const target = {};
	for (let i = 0; i < arguments.length; i++) {
		const source = arguments[i];
		if (!source || typeof source !== "object") continue;
		for (const key in source) {
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
	const keys = Object.keys(style);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (key === null || key === undefined) continue;
		if (key.indexOf("-") !== -1) {
			const parts = key.split("-");
			let next = parts[0];
			for (let j = 1; j < parts.length; j++) {
				const part = parts[j];
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
		case "onChange": return "oninput";
		case "onDoubleClick": return "ondblclick";
		case "onFocus": return "onfocus";
		case "onBlur": return "onblur";
		case "onSubmit": return "onsubmit";
		case "onMouseEnter": return "onmouseenter";
		case "onMouseLeave": return "onmouseleave";
		case "onMouseOver": return "onmouseover";
		case "onMouseOut": return "onmouseout";
		case "onKeyDown": return "onkeydown";
		case "onKeyUp": return "onkeyup";
		case "onKeyPress": return "onkeypress";
		case "onInput": return "oninput";
	default: return key.toLowerCase();
	}
}

function assertStyleObject(value, nodeName) {
	const valueType = value === null ? "null" : (Array.isArray(value) ? "array" : typeof value);
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`[Moon] Style on <${nodeName}> must be a plain object, received ${valueType}.`);
	}
}

function assertEventHandler(value, key, nodeName) {
	if (typeof value !== "function") {
		throw new Error(`[Moon] Event handler ${key} on <${nodeName}> must be a function.`);
	}
}

function assertValidKey(key, nodeName) {
	if (key === undefined) return;
	const type = typeof key;
	if (key === null || (type !== "string" && type !== "number") || key === "") {
		throw new Error(`[Moon] Key on <${nodeName}> must be a string or number, received ${key === null ? "null" : type}.`);
	}
}

function assertRefValue(ref, nodeName) {
	if (ref === undefined) return;
	if (typeof ref === "function") return;
	if (ref && typeof ref === "object") return;
	throw new Error(`[Moon] Ref on <${nodeName}> must be a function or ref object.`);
}

function assertChildrenArray(children, nodeName) {
	if (!Array.isArray(children)) {
		throw new Error(`[Moon] Children on <${nodeName}> must be an array.`);
	}
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child || typeof child !== "object" || !child.name) {
			throw new Error(`[Moon] Child ${i} of <${nodeName}> is not a valid view node.`);
		}
	}
}

function assertPlainObject(value, nodeName, propName) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
		throw new Error(`[Moon] ${propName} on <${nodeName}> must be a plain object, received ${type}.`);
	}
}

function assertBooleanProp(value, nodeName, propName) {
	if (typeof value !== "boolean") {
		throw new Error(`[Moon] ${propName} on <${nodeName}> must be a boolean.`);
	}
}

function normalizeStringLikeProp(value, nodeName, propName) {
	if (typeof value === "string" || typeof value === "number") return value;
	throw new Error(`[Moon] ${propName} on <${nodeName}> must be a string or number.`);
}

function assertStyleValue(value, nodeName, styleKey) {
	const type = typeof value;
	if (type === "number" && Number.isFinite(value)) return;
	if (type === "string") return;
	throw new Error(`[Moon] Style "${styleKey}" on <${nodeName}> must be a finite number or string, received ${type}.`);
}

function assertStyleKey(styleKey, nodeName) {
	if (typeof styleKey !== "string" || styleKey.length === 0 || styleKey === "null" || styleKey === "undefined") {
		throw new Error(`[Moon] Style key on <${nodeName}> must be a non-empty string.`);
	}
}

function validateAttributesObject(attributes, nodeName) {
	for (const attrKey in attributes) {
		if (attrKey === "" || attrKey === null || attrKey === undefined || typeof attrKey !== "string") {
			throw new Error(`[Moon] Attribute key on <${nodeName}> must be a non-empty string.`);
		}
		const value = attributes[attrKey];
		const type = typeof value;
		if (value === null || value === undefined) {
			throw new Error(`[Moon] Attribute "${attrKey}" on <${nodeName}> must not be null/undefined.`);
		}
		if (type === "number" && !Number.isFinite(value)) {
			throw new Error(`[Moon] Attribute "${attrKey}" on <${nodeName}> must be a finite number, received ${value}.`);
		}
		if (type !== "string" && type !== "number" && type !== "boolean") {
			throw new Error(`[Moon] Attribute "${attrKey}" on <${nodeName}> must be a string, number, or boolean, received ${type}.`);
		}
	}
}

function validatePropsShape(nodeData, nodeName) {
	if (!nodeData || typeof nodeData !== "object") {
		throw new Error(`[Moon] Props on <${nodeName}> must be an object.`);
	}
	for (const key in nodeData) {
		const value = nodeData[key];
		if (value === undefined) {
			throw new Error(`[Moon] Prop "${key}" on <${nodeName}> is undefined; pass null to intentionally clear.`);
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
			for (const styleKey in value) {
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
				throw new Error(`[Moon] innerHTML on <${nodeName}> must be a string.`);
			}
		}
	}
}

function describeChildShape(children) {
	if (!Array.isArray(children) || children.length === 0) return "";
	let shape = "";
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		const childName = child && child.name ? child.name : "unknown";
		const keyed = child && child.data && child.data.key !== undefined ? "#keyed" : "#unkeyed";
		shape += `${childName}${keyed};`;
	}
	return shape;
}

function assertStableKeyedChildShape(nodeOld, nodeNew) {
	const keyOld = nodeOld && nodeOld.data ? nodeOld.data.key : undefined;
	const keyNew = nodeNew && nodeNew.data ? nodeNew.data.key : undefined;
	if (keyOld === undefined || keyNew === undefined || keyOld !== keyNew) return;

	const oldChildren = nodeOld.data && nodeOld.data.children;
	const newChildren = nodeNew.data && nodeNew.data.children;

	if (!oldChildren || !newChildren) return;

	const oldShape = describeChildShape(oldChildren);
	const newShape = describeChildShape(newChildren);

	if (oldShape !== newShape) {
		throw new Error(`[Moon] Key "${keyNew}" on <${nodeNew.name}> was reused but its child shape changed; change the key when swapping layouts to avoid DOM corruption.`);
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
	const nodeName = node.name;

	if (nodeName === "text") {
		// Create a text node using the text content from the default key.
		return document.createTextNode(node.data.data);
	} else {
		// Create a DOM element.
		const element = document.createElement(nodeName);
		element.MoonChildren = element.MoonChildren || [];

		// Set data.
		const nodeData = node.data;
		validatePropsShape(nodeData, nodeName);

		for (const key in nodeData) {
			const value = nodeData[key];

			if (key[0] === "o" && key[1] === "n") {
				// Set an event listener.
				assertEventHandler(value, key, nodeName);
				element[normalizeEventKey(key)] = value;
			} else {
				switch (key) {
					case "attributes": {
						// Set attributes.
						assertPlainObject(value, nodeName, "Attributes");
						validateAttributesObject(value, nodeName);
						for (const valueKey in value) {
							element.setAttribute(valueKey, value[valueKey]);
						}

						break;
					}
					case "style": {
						// Set style properties.
						assertStyleObject(value, nodeName);
						const elementStyle = element.style;
						normalizeStyleInline(value);

						for (const valueKey in value) {
							assertStyleKey(valueKey, nodeName);
							assertStyleValue(value[valueKey], nodeName, valueKey);
							elementStyle[valueKey] = value[valueKey];
						}

						break;
					}
					case "innerHTML": {
						// Set raw HTML content.
						if (typeof value !== "string") {
							throw new Error(`[Moon] innerHTML on <${nodeName}> must be a string.`);
						}
						element.innerHTML = value;

						break;
					}
					case "focus": {
						// Set focus if needed. Blur isn't set because it's the
						// default.
						assertBooleanProp(value, nodeName, "focus");
						if (value === true) {
							element.focus();
						}

						break;
					}
					case "class": {
						// Set a className property.
						element.className = normalizeStringLikeProp(value, nodeName, "class");

						break;
					}
					case "for": {
						// Set an htmlFor property.
						element.htmlFor = normalizeStringLikeProp(value, nodeName, "for");

						break;
					}
					case "ref": {
						setRef(value, element);
						break;
					}
					case "children": {
						// Recursively append children.
						assertChildrenArray(value, nodeName);
						const elementMoonChildren = element.MoonChildren = [];

						for (let i = 0; i < value.length; i++) {
							const elementChild = viewCreate(value[i]);

							elementMoonChildren.push(elementChild);
							element.appendChild(elementChild);
						}

						break;
					}
					default: {
						if (isUnknownDomProp(element, key)) {
							warnOnce("unknownProp", `[Moon] Unknown DOM prop "${key}" on <${nodeName}>; it will be set as a property.`);
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
	const nodeOldData = nodeOld.data;
	const nodeNewData = nodeNew.data;
	validatePropsShape(nodeNewData, nodeOld.name);

	// First, go through all new data and update all of the existing data to
	// match.
	for (const keyNew in nodeNewData) {
		const valueOld = nodeOldData[keyNew];
			const valueNew = nodeNewData[keyNew];

			if (valueOld !== valueNew) {
				if (keyNew[0] === "o" && keyNew[1] === "n") {
					// Update an event.
					assertEventHandler(valueNew, keyNew, nodeOld.name);
					nodeOldElement[normalizeEventKey(keyNew)] = valueNew;
				} else {
					switch (keyNew) {
						case "attributes": {
							// Update attributes.
						assertPlainObject(valueNew, nodeOld.name, "Attributes");
						validateAttributesObject(valueNew, nodeOld.name);
						if (valueOld === undefined) {
							for (const valueNewKey in valueNew) {
								nodeOldElement.setAttribute(valueNewKey, valueNew[valueNewKey]);
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];

								if (valueOld[valueNewKey] !== valueNewValue) {
									nodeOldElement.setAttribute(valueNewKey, valueNewValue);
								}
							}

							// Remove attributes from the old value that are not in
							// the new value.
							for (const valueOldKey in valueOld) {
								if (!(valueOldKey in valueNew)) {
									nodeOldElement.removeAttribute(valueOldKey);
								}
							}
						}

						break;
					}
					case "style": {
						// Update style properties.
						const nodeOldElementStyle = nodeOldElement.style;
						assertStyleObject(valueNew, nodeOld.name);
						normalizeStyleInline(valueNew);
						if (valueOld) normalizeStyleInline(valueOld);

						if (valueOld === undefined) {
							for (const valueNewKey in valueNew) {
								assertStyleKey(valueNewKey, nodeOld.name);
								assertStyleValue(valueNew[valueNewKey], nodeOld.name, valueNewKey);
								nodeOldElementStyle[valueNewKey] = valueNew[valueNewKey];
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];
								assertStyleKey(valueNewKey, nodeOld.name);
								assertStyleValue(valueNewValue, nodeOld.name, valueNewKey);

								if (valueOld[valueNewKey] !== valueNewValue) {
									nodeOldElementStyle[valueNewKey] = valueNewValue;
								}
							}

							// Remove style properties from the old value that are not
							// in the new value.
							for (const valueOldKey in valueOld) {
								if (!(valueOldKey in valueNew)) {
									nodeOldElementStyle[valueOldKey] = "";
								}
							}
						}

						break;
					}
					case "focus": {
						// Update focus/blur.
						assertBooleanProp(valueNew, nodeOld.name, "focus");
						if (valueNew) {
							nodeOldElement.focus();
						} else {
							nodeOldElement.blur();
						}

						break;
					}
					case "class": {
						// Update a className property.
						nodeOldElement.className = normalizeStringLikeProp(valueNew, nodeOld.name, "class");

						break;
					}
					case "for": {
						// Update an htmlFor property.
						nodeOldElement.htmlFor = normalizeStringLikeProp(valueNew, nodeOld.name, "for");

						break;
					}
					case "ref": {
						assertRefValue(valueNew, nodeOld.name);
						setRef(valueNew, nodeOldElement);

						break;
					}
					case "children": {
						// Update children.
						const nodeOldElementMoonChildren = nodeOldElement.MoonChildren || [];
						const valueNewLength = valueNew.length;

						assertChildrenArray(valueNew, nodeOld.name);
						if (valueOld !== undefined) {
							assertChildrenArray(valueOld, nodeOld.name);
						}

						for (let i = 0; i < valueNewLength; i++) {
							const childNode = valueNew[i];
							assertValidKey(childNode && childNode.data && childNode.data.key, childNode && childNode.name ? childNode.name : "node");
							const childRef = childNode && childNode.data && childNode.data.ref;
							assertRefValue(childRef, childNode && childNode.name ? childNode.name : "node");
						}

						if (valueOld !== undefined) {
							assertStableKeyedChildShape(nodeOld, nodeNew);
						}

						// Keyed diff if keys exist on new nodes.
						const keyed = [];
						let hasKeys = true;
						let hasAnyKey = false;
						const keySet = Object.create(null);
						let dupKeyDetected = false;
						for (let i = 0; i < valueNewLength; i++) {
							const key = valueNew[i].data && valueNew[i].data.key;
							assertValidKey(key, valueNew[i].name);
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
							for (let i = 0; i < valueNewLength; i++) {
								const childEl = viewCreate(valueNew[i]);
								nodeOldElementMoonChildren.push(childEl);
								nodeOldElement.appendChild(childEl);
							}
							nodeOldElement.MoonChildren = nodeOldElementMoonChildren;
						} else if (hasKeys) {
							const oldKeyMap = {};
							for (let i = 0; i < valueOld.length; i++) {
								const key = valueOld[i].data && valueOld[i].data.key;
								assertValidKey(key, valueOld[i].name);
								if (key !== undefined) {
									if (oldKeyMap[key]) {
										throw new Error(`[Moon] Duplicate keys detected among existing siblings under <${nodeOld.name}>; keys must be unique.`);
									}
									oldKeyMap[key] = { node: valueOld[i], el: nodeOldElementMoonChildren[i], used: false };
								}
							}

							const newChildrenEls = [];

							for (let i = 0; i < valueNewLength; i++) {
								const newNode = valueNew[i];
								const key = keyed[i];
								const existing = oldKeyMap[key];

								if (existing) {
									viewPatch(existing.node, existing.el, newNode);
									existing.used = true;
									newChildrenEls.push(existing.el);
								} else {
									const childEl = viewCreate(newNode);
									newChildrenEls.push(childEl);
								}
							}

							// Remove unused old keyed elements.
							for (const key in oldKeyMap) {
								if (!oldKeyMap[key].used) {
									nodeOldElement.removeChild(oldKeyMap[key].el);
								}
							}

							// Reorder/mount in the new order to avoid stale DOM positions.
							let reference = nodeOldElement.firstChild;
							for (let i = 0; i < valueNewLength; i++) {
								const desired = newChildrenEls[i];
								if (reference === desired) {
									reference = reference.nextSibling;
								} else {
									nodeOldElement.insertBefore(desired, reference);
									reference = desired.nextSibling;
								}
							}
							while (reference) {
								const next = reference.nextSibling;
								nodeOldElement.removeChild(reference);
								reference = next;
							}

							nodeOldElement.MoonChildren = newChildrenEls;
						} else {
							const valueOldLength = valueOld.length;

							if (valueOldLength === valueNewLength) {
								for (let i = 0; i < valueOldLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementMoonChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = viewCreate(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[i]);

											nodeOldElementMoonChildren[i] = valueOldElementNew;
										}
									}
								}
							} else if (valueOldLength > valueNewLength) {
								for (let i = 0; i < valueNewLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementMoonChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = viewCreate(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[i]);

											nodeOldElementMoonChildren[i] = valueOldElementNew;
										}
									}
								}

								for (let i = valueNewLength; i < valueOldLength; i++) {
									nodeOldElement.removeChild(nodeOldElementMoonChildren.pop());
								}
							} else {
								for (let i = 0; i < valueOldLength; i++) {
									const valueOldNode = valueOld[i];
									const valueNewNode = valueNew[i];

									if (valueOldNode !== valueNewNode) {
										if (valueOldNode.name === valueNewNode.name) {
											viewPatch(valueOldNode, nodeOldElementMoonChildren[i], valueNewNode);
										} else {
											const valueOldElementNew = viewCreate(valueNewNode);

											nodeOldElement.replaceChild(valueOldElementNew, nodeOldElementMoonChildren[i]);

											nodeOldElementMoonChildren[i] = valueOldElementNew;
										}
									}
								}

								for (let i = valueOldLength; i < valueNewLength; i++) {
									const nodeOldElementChild = viewCreate(valueNew[i]);

									nodeOldElementMoonChildren.push(nodeOldElementChild);
									nodeOldElement.appendChild(nodeOldElementChild);
								}
							}
						}

						break;
					}
					default: {
						if (isUnknownDomProp(nodeOldElement, keyNew)) {
							warnOnce("unknownProp", `[Moon] Unknown DOM prop "${keyNew}" on <${nodeOld.name}>; use a valid DOM prop or data-/aria-.`);
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
	for (const keyOld in nodeOldData) {
		if (!(keyOld in nodeNewData)) {
			if (keyOld[0] === "o" && keyOld[1] === "n") {
				// Remove an event.
				nodeOldElement[keyOld.toLowerCase()] = null;
			} else {
				switch (keyOld) {
					case "attributes": {
						// Remove attributes.
						const valueOld = nodeOldData.attributes;

						for (const valueOldKey in valueOld) {
							nodeOldElement.removeAttribute(valueOldKey);
						}

						break;
					}
					case "focus": {
						// Remove focus.
						nodeOldElement.blur();

						break;
					}
					case "class": {
						// Remove a className property.
						nodeOldElement.className = "";

						break;
					}
					case "for": {
						// Remove an htmlFor property.
						nodeOldElement.htmlFor = "";

						break;
					}
					case "children": {
						// Remove children.
						const valueOldLength = nodeOldData.children.length;
						const nodeOldElementMoonChildren = nodeOldElement.MoonChildren || [];

						for (let i = 0; i < valueOldLength; i++) {
							nodeOldElement.removeChild(nodeOldElementMoonChildren.pop());
						}

						break;
					}
					case "ref": {
						// Clear ref on removal.
						setRef(nodeOldData.ref, null);
						break;
					}
					default: {
						// Remove a DOM property.
						const nodeOldName = nodeOld.name;
						nodeOldElement[keyOld] = (
							nodeOldName in removeDataPropertyCache ?
								removeDataPropertyCache[nodeOldName] :
								(
									removeDataPropertyCache[nodeOldName] =
										nodeOldName === "text" ?
											document.createTextNode("") :
											document.createElement(nodeOldName)
								)
						)[keyOld];
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
export default {
	set(viewNew) {
		// When given a new view, patch the old element to match the new node using
		// the old node as reference.
		if (viewOld.name === viewNew.name) {
			// If the root views have the same name, patch their data.
			viewPatch(viewOld, viewOldElement, viewNew);
		} else {
			// If they have different names, create a new old view element.
			const viewOldElementNew = viewCreate(viewNew);

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
