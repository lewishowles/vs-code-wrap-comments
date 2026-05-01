import { describe, it, expect } from "vitest";
import utilities from "./utilities";

const {
	escapeRegex,
	getLanguageConfigForId,
	getCommentMarker,
	isComment,
	wrapCommentText,
	wrapParagraph,
} = utilities;

// Mock calculateLength for testing
function mockCalculateLength(text) {
	if (typeof text !== "string") {
		return 0;
	}

	// Assume tab size of 4 for testing
	return text.replace(/\t/g, "	").length;
}

describe("escapeRegex", () => {
	it("does not escape forward slashes", () => {
		expect(escapeRegex("//")).toBe("//");
	});

	it("escapes asterisks", () => {
		expect(escapeRegex("*")).toBe("\\*");
	});

	it("escapes special regex characters", () => {
		expect(escapeRegex(".+?")).toBe("\\.\\+\\?");
	});

	it("does not escape hash", () => {
		expect(escapeRegex("#")).toBe("#");
	});
});

describe("getLanguageConfigForId", () => {
	it("returns JavaScript config for JavaScript", () => {
		const config = getLanguageConfigForId("javascript");

		expect(config.markers).toContain("//");
		expect(config.markers).toContain("*");
		expect(config.exclusions).toContain("@param");
	});

	it("returns Bash config for shell", () => {
		const config = getLanguageConfigForId("shell");

		expect(config.markers).toContain("#");
		expect(config.exclusions).toHaveLength(0);
	});

	it("returns fallback for unknown language", () => {
		const config = getLanguageConfigForId("unknown");

		expect(config.markers).toContain("//");
		expect(config.markers).toContain("*");
		expect(config.markers).toContain("#");
		expect(config.exclusions).toHaveLength(0);
	});
});

describe("getCommentMarker", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//", "*"],
		exclusions: [],
	};

	const bashConfig = {
		languages: ["shell"],
		markers: ["#"],
		exclusions: [],
	};

	it("extracts // marker", () => {
		expect(getCommentMarker("// comment", jsConfig)).toBe("//");
	});

	it("extracts * marker", () => {
		expect(getCommentMarker("* comment", jsConfig)).toBe("*");
	});

	it("extracts marker with leading spaces", () => {
		expect(getCommentMarker("  // comment", jsConfig)).toBe("  //");
	});

	it("extracts marker with leading tab", () => {
		expect(getCommentMarker("\t// comment", jsConfig)).toBe("\t//");
	});

	it("extracts # marker for bash", () => {
		expect(getCommentMarker("# comment", bashConfig)).toBe("#");
	});

	it("returns null when marker is not at start of line", () => {
		expect(getCommentMarker("code(); // comment", jsConfig)).toBeNull();
	});

	it("returns null for non-comment text", () => {
		expect(getCommentMarker("regular text", jsConfig)).toBeNull();
	});
});

describe("isComment", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//", "*"],
		exclusions: ["@param", "@return", "*/"],
	};

	const bashConfig = {
		languages: ["shell"],
		markers: ["#"],
		exclusions: [],
	};

	it("identifies JavaScript single-line comments", () => {
		expect(isComment("// comment", jsConfig)).toBe(true);
	});

	it("excludes JSDoc @param", () => {
		expect(isComment("// @param test", jsConfig)).toBe(false);
	});

	it("identifies bash comments", () => {
		expect(isComment("# comment", bashConfig)).toBe(true);
	});
});

describe("wrapCommentText", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//"],
		exclusions: [],
	};

	it("wraps text to the specified maximum width", () => {
		const input = "// This is a very long comment that should be wrapped properly";
		const result = wrapCommentText(input, 40, jsConfig, mockCalculateLength);

		result.split("\n").forEach(line => {
			expect(mockCalculateLength(line)).toBeLessThanOrEqual(40);
		});
	});

	it("preserves paragraph breaks", () => {
		const input = [
			"// First paragraph that should wrap",
			"//",
			"// Second paragraph that should also wrap",
		].join("\n");

		const result = wrapCommentText(input, 40, jsConfig, mockCalculateLength);

		expect(result).toContain("\n//\n");
	});

	it("preserves indentation when wrapping", () => {
		const input = "\t// This is a long comment that needs wrapping";
		const result = wrapCommentText(input, 40, jsConfig, mockCalculateLength);

		result.split("\n").forEach(line => {
			expect(line.startsWith("\t//")).toBe(true);
		});
	});

	it("leaves short comments unchanged", () => {
		const input = "// Short comment";
		const result = wrapCommentText(input, 80, jsConfig, mockCalculateLength);

		expect(result).toBe(input);
	});
});

describe("wrapParagraph", () => {
	const jsConfig = {
		languages: ["javascript"],
		markers: ["//"],
		exclusions: [],
	};

	it("wraps paragraph preserving marker", () => {
		const lines = ["// This is a very long comment that needs wrapping"];
		const result = wrapParagraph(lines, 40, jsConfig, mockCalculateLength);

		result.forEach(line => {
			expect(line.startsWith("//")).toBe(true);
		});
	});
});
