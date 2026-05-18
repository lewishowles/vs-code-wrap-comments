// Language-specific comment configuration
const languageConfiguration = {
	javascript: {
		languages: ["javascript", "javascriptreact", "typescript", "typescriptreact"],
		markers: ["//", "*"],
		exclusions: ["@param", "@return", "*/"],
	},
	bash: {
		languages: ["shell", "shellscript", "bash", "sh", "zsh", "properties", "ignore", "dotenv"],
		markers: ["#"],
		exclusions: [],
	},
};

/**
 * Get the comment configuration for a given language ID.
 *
 * @param  {string}  languageId
 *     The VS Code language ID.
 */
function getLanguageConfigForId(languageId) {
	for (const config of Object.values(languageConfiguration)) {
		if (config.languages.includes(languageId)) {
			return config;
		}
	}

	return {
		languages: [],
		markers: ["//", "*", "#"],
		exclusions: ["@param", "@return", "*/"],
	};
}

/**
 * Escape special regex characters in a string.
 *
 * @param  {string}  text
 *     The text to escape.
 */
function escapeRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Determine whether the given text represents a comment.
 *
 * @param  {string}  text
 *     The text to check.
 * @param  {object}  config
 *     The language configuration.
 */
function isComment(text, config) {
	const trimmedText = text.trim();

	if (!config.markers.some(marker => trimmedText.startsWith(marker))) {
		return false;
	}

	return !config.exclusions.some(exclusion => text.includes(exclusion));
}

/**
 * Given a string of text, determine the starting comment marker with optional leading space.
 *
 * @param  {string}  text
 *     The text to test.
 * @param  {object}  config
 *     The language configuration.
 */
function getCommentMarker(text, config) {
	const patterns = config.markers.map(marker => {
		const escaped = escapeRegex(marker);

		return new RegExp(`^\\s*${escaped}`);
	});

	for (const pattern of patterns) {
		const match = text.match(pattern);

		if (match) {
			return match[0];
		}
	}

	return null;
}

/**
 * Wrap the given text to the provided maximum length, taking into account any
 * indentation and comment marker that exists.
 *
 * We treat lines between sections of a comment as a paragraph, which are
 * wrapped separately.
 *
 * @param  {string}  text
 *     The text to wrap.
 * @param  {number}  maxLength
 *     The line-length to wrap the comment to.
 * @param  {object}  config
 *     The language configuration.
 * @param  {Function}  calculateLengthFunction
 *     Function to calculate text length accounting for tabs.
 */
function wrapCommentText(text, maxLength, config, calculateLengthFunction) {
	const textLines = text.split("\n");
	// Our newly wrapped lines.
	const wrappedLines = [];

	// The current paragraph, denoted by a gap in the comment.
	let currentParagraph = [];

	textLines.forEach(line => {
		const trimmedLine = line.trim();

		// Some lines are excluded from wrapping, such as JSDoc blocks and
		// "end-comment" markers.
		if (config.exclusions.some(exclusion => line.includes(exclusion))) {
			if (currentParagraph.length > 0) {
				wrappedLines.push(...wrapParagraph(currentParagraph, maxLength, config, calculateLengthFunction));
			}

			wrappedLines.push(line);

			currentParagraph = [];

			return;
		}

		// If this is an empty line, we start a new paragraph by wrapping any
		// existing paragraph.
		if (config.markers.includes(trimmedLine)) {
			if (currentParagraph.length > 0) {
				wrappedLines.push(...wrapParagraph(currentParagraph, maxLength, config, calculateLengthFunction));
			}

			// Preserve the empty line.
			wrappedLines.push(line);

			currentParagraph = [];

			return;
		}

		// Add our new line to the current paragraph.
		currentParagraph.push(line);
	});

	if (currentParagraph.length > 0) {
		wrappedLines.push(...wrapParagraph(currentParagraph, maxLength, config, calculateLengthFunction));
	}

	return wrappedLines.join("\n");
}

/**
 * Wrap the given paragraph.
 *
 * @param  {array}  lines
 *     The text lines to wrap.
 * @param  {number}  width
 *     The line-length to wrap to.
 * @param  {object}  config
 *     The language configuration.
 * @param  {Function}  calculateLengthFunction
 *     Function to calculate text length accounting for tabs.
 */
function wrapParagraph(lines, width, config, calculateLengthFunction) {
	// Our comment marker for this comment. This includes any leading
	// whitespace, so we don't need to account for it separately.
	const commentMarker = getCommentMarker(lines[0], config);

	// If we can't find a comment marker, we can't continue.
	if (!commentMarker) {
		return lines;
	}

	// Determine the length of the comment marker, accounting for tabs.
	const commentMarkerLength = calculateLengthFunction(commentMarker);
	// Remove the comment markers from the lines, ready for wrapping.
	const strippedLines = lines.map(line => line.slice(commentMarker.length));
	// Create a single paragraph from the lines.
	const paragraph = strippedLines.join(" ").trim();
	// Begin the wrapping process.
	const wrappedLines = [];

	paragraph.split(" ").reduce((currentLine, word, index, array) => {
		if (!word.length) {
			return currentLine;
		}

		// Determine the length of the line if we add this word to it.
		const potentialNewLineLength = calculateLengthFunction(currentLine) + calculateLengthFunction(word) + commentMarkerLength + 1;

		if (potentialNewLineLength > width) {
			// Finish the current line and create a new one.
			wrappedLines.push(currentLine.trim());

			currentLine = `${word} `;
		} else {
			currentLine += `${word} `;
		}

		// If we're on the last word, add our last line to our collection.
		if (index === array.length - 1) {
			wrappedLines.push(currentLine.trim());
		}

		return currentLine;
	}, "");

	// Re-add the comment markers and preserve indentation
	return wrappedLines.map(line => `${commentMarker} ${line}`);
}

module.exports = {
	getLanguageConfigForId,
	escapeRegex,
	isComment,
	getCommentMarker,
	wrapCommentText,
	wrapParagraph,
};
