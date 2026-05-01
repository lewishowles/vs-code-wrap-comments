const vscode = require("vscode");

module.exports = function() {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		return;
	}

	const document = editor.document;
	const selection = editor.selection;
	const cursorPosition = selection.active;
	// Expand the selection to encompass the current comment.
	const commentRange = getCommentRange(document, cursorPosition);

	if (!commentRange) {
		vscode.window.showInformationMessage("Please place the cursor in a comment.");

		return;
	}

	// Re-wrap our comment as necessary.
	const commentText = document.getText(commentRange);
	const wrappedText = wrapCommentText(commentText, 80);

	editor.edit(editBuilder => {
		editBuilder.replace(commentRange, wrappedText);
	});
};

/**
 * Expand our selecting to incorporate the entire comment under the cursor.
 *
 * @param  {object}  document
 *     The current document.
 * @param  {object}  cursorPosition
 *     The current cursor position.
 */
function getCommentRange(document, cursorPosition) {
	const currentLine = document.lineAt(cursorPosition.line);
	const currentLineText = currentLine.text;

	if (!isComment(currentLineText)) {
		return null;
	}

	// Find the extremes of the comment block by expanding our selection to
	// include any neighbouring lines that are also comments.
	let startLine = cursorPosition.line;
	let endLine = cursorPosition.line;

	while (startLine > 0 && isComment(document.lineAt(startLine - 1).text)) {
		startLine--;
	}

	while (endLine < document.lineCount - 1 && isComment(document.lineAt(endLine + 1).text)) {
		endLine++;
	}

	return new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
}

/**
 * Determine whether the given text represents a comment. That is, whether it
 * starts with a comment marker.
 *
 * @param  {string}  text
 *     The text to check.
 */
function isComment(text) {
	const trimmedText = text.trim();
	const prefixes = ["//", "*", "#"];

	return prefixes.some(prefix => trimmedText.startsWith(prefix)) &&
		!text.includes("@param") &&
		!text.includes("@return") &&
		!text.includes("*/");
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
 * @param  {int}  maxLength
 *     The line-length to wrap the comment to.
 */
function wrapCommentText(text, maxLength) {
	const textLines = text.split("\n");
	// Our newly wrapped lines.
	const wrappedLines = [];

	// The current paragraph, denoted by a gap in the comment.
	let currentParagraph = [];

	textLines.forEach(line => {
		const trimmedLine = line.trim();

		// If this is an empty line, we start a new paragraph by wrapping any
		// existing paragraph.
		if (["//", "*", "#"].includes(trimmedLine)) {
			if (currentParagraph.length > 0) {
				wrappedLines.push(...wrapParagraph(currentParagraph, maxLength));
			}

			// Preserve the empty line.
			wrappedLines.push(line);

			currentParagraph = [];
		}

		// Add our new line to the current paragraph.
		currentParagraph.push(line);
	});

	if (currentParagraph.length > 0) {
		wrappedLines.push(...wrapParagraph(currentParagraph, maxLength));
	}

	return wrappedLines.join("\n");
}

/**
 * Wrap the given paragraph.
 *
 * @param  {array}  lines
 *     The text lines to wrap.
 * @param  {integer}  width
 *     The line-length to wrap to.
 */
function wrapParagraph(lines, width) {
	// Our comment marker for this comment. This includes any leading
	// whitespace, so we don't need to account for it separately.
	const commentMarker = getCommentMarker(lines[0]);

	// If we can't find a comment marker, we can't continue.
	if (!commentMarker) {
		return lines;
	}

	// Determine the length of the comment marker, accounting for tabs.
	const commentMarkerLength = calculateLength(commentMarker);
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
		const potentialNewLineLength = calculateLength(currentLine) + calculateLength(word) + commentMarkerLength + 1;

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

/**
 * Given a string of text, determine the starting comment marker, one of "//" or
 * "*" with optional leading space.
 *
 * @param  {string}  text
 *     The text to test.
 */
function getCommentMarker(text) {
	const patterns = [/^\s*\/\//, /^\s*\*/, /^\s*#/];

	for (const pattern of patterns) {
		const match = text.match(pattern);

		if (match) {
			return match[0];
		}
	}

	return null;
}

/**
 * Determine the length of the given text, accounting for "Tab Size" settings.
 */
function calculateLength(text) {
	if (typeof text !== "string") {
		return 0;
	}

	const editorConfig = vscode.workspace.getConfiguration("editor");
	const tabSize = editorConfig.get("tabSize");

	return text.replace(/\t/g, " ".repeat(tabSize)).length;
}
