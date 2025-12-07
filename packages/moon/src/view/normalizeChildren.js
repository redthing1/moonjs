import components from "moon/src/view/components";

/**
 * Normalize arbitrary child values into an array of Moon view nodes.
 *
 * - Strings/numbers/bigints become text nodes.
 * - Arrays are flattened recursively.
 * - Existing view nodes are passed through.
 * - Null/undefined/booleans are ignored.
 */
export default function normalizeChildren(value) {
	if (value === null || value === undefined || typeof value === "boolean") {
		return [];
	}

	if (Array.isArray(value)) {
		const normalized = [];

		for (let i = 0; i < value.length; i++) {
			const children = normalizeChildren(value[i]);

			for (let j = 0; j < children.length; j++) {
				normalized.push(children[j]);
			}
		}

		return normalized;
	}

	const valueType = typeof value;

	if (valueType === "string" || valueType === "number" || valueType === "bigint") {
		return [components.text({ data: String(value) })];
	}

	if (value && value.name !== undefined) {
		return [value];
	}

	return [components.text({ data: String(value) })];
}
