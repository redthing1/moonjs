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
	if (process.env.MOON_ENV === "production") return;
	throw new Error(message);
}

function setRef(ref, value) {
	if (!ref) return;
	if (typeof ref === "function") {
		ref(value);
	} else if (typeof ref === "object") {
		ref.current = value;
	} else if (process.env.MOON_ENV !== "production") {
		/* istanbul ignore next */
		console.warn("[Moon] Ignoring unsupported ref type:", ref);
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
	if (process.env.MOON_ENV === "production") return false;
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
	if (process.env.MOON_ENV === "production") return;
	if (!value || typeof value !== "object") {
		throw new Error(`[Moon] Style on <${nodeName}> must be an object, received ${typeof value}.`);
	}
}

function assertEventHandler(value, key, nodeName) {
	if (process.env.MOON_ENV === "production") return;
	if (typeof value !== "function") {
		throw new Error(`[Moon] Event handler ${key} on <${nodeName}> must be a function.`);
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
							elementStyle[valueKey] = value[valueKey];
						}

						break;
					}
					case "innerHTML": {
						// Set raw HTML content.
						element.innerHTML = value;

						break;
					}
					case "focus": {
						// Set focus if needed. Blur isn't set because it's the
						// default.
						if (value) {
							element.focus();
						}

						break;
					}
					case "class": {
						// Set a className property.
						element.className = value;

						break;
					}
					case "for": {
						// Set an htmlFor property.
						element.htmlFor = value;

						break;
					}
					case "ref": {
						setRef(value, element);
						break;
					}
					case "children": {
						// Recursively append children.
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
								nodeOldElementStyle[valueNewKey] = valueNew[valueNewKey];
							}
						} else {
							for (const valueNewKey in valueNew) {
								const valueNewValue = valueNew[valueNewKey];

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
						if (valueNew) {
							nodeOldElement.focus();
						} else {
							nodeOldElement.blur();
						}

						break;
					}
					case "class": {
						// Update a className property.
						nodeOldElement.className = valueNew;

						break;
					}
					case "for": {
						// Update an htmlFor property.
						nodeOldElement.htmlFor = valueNew;

						break;
					}
					case "children": {
						// Update children.
						const nodeOldElementMoonChildren = nodeOldElement.MoonChildren || [];
						const valueNewLength = valueNew.length;

						// Keyed diff if keys exist on new nodes.
						const keyed = [];
						let hasKeys = true;
						let hasAnyKey = false;
						const keySet = Object.create(null);
						let dupKeyDetected = false;
						for (let i = 0; i < valueNewLength; i++) {
							const key = valueNew[i].data && valueNew[i].data.key;
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
								if (key !== undefined) {
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
									nodeOldElement.appendChild(childEl);
								}
							}

							// Remove unused old keyed elements.
							for (const key in oldKeyMap) {
								if (!oldKeyMap[key].used) {
									nodeOldElement.removeChild(oldKeyMap[key].el);
								}
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
