const vscode = require("vscode");
const { getLanguageConfigForId, isComment, wrapCommentText } = require("./utilities");

/**
 * Get the configured line length for wrapping comments.
 */
function getLineLength() {
	const wrapCommentsConfig = vscode.workspace.getConfiguration("wrapComments");
	const customLineLength = wrapCommentsConfig.get("lineLength");

	if (typeof customLineLength === "number") {
		return customLineLength;
	}

	const editorConfig = vscode.workspace.getConfiguration("editor");
	const wordWrapColumn = editorConfig.get("wordWrapColumn");

	if (typeof wordWrapColumn === "number") {
		return wordWrapColumn;
	}

	return 80;
}

/**
 * Determine the length of the given text, accounting for "Tab Size" settings.
 *
 * @param  {string}  text
 *     The text to measure.
 */
function calculateLength(text) {
	if (typeof text !== "string") {
		return 0;
	}

	const editorConfig = vscode.workspace.getConfiguration("editor");
	const tabSize = editorConfig.get("tabSize");

	return text.replace(/\t/g, " ".repeat(tabSize)).length;
}

/**
 * Expand our selecting to incorporate the entire comment under the cursor.
 *
 * @param  {object}  document
 *     The current document.
 * @param  {object}  cursorPosition
 *     The current cursor position.
 * @param  {object}  config
 *     The language configuration.
 */
function getCommentRange(document, cursorPosition, config) {
	const currentLine = document.lineAt(cursorPosition.line);
	const currentLineText = currentLine.text;

	if (!isComment(currentLineText, config)) {
		return null;
	}

	// Find the extremes of the comment block by expanding our selection to
	// include any neighbouring lines that are also comments.
	let startLine = cursorPosition.line;
	let endLine = cursorPosition.line;

	while (startLine > 0 && isComment(document.lineAt(startLine - 1).text, config)) {
		startLine--;
	}

	while (endLine < document.lineCount - 1 && isComment(document.lineAt(endLine + 1).text, config)) {
		endLine++;
	}

	return new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length);
}

module.exports = function() {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		return;
	}

	const document = editor.document;
	const selection = editor.selection;
	const cursorPosition = selection.active;
	const config = getLanguageConfigForId(document.languageId);
	// Expand the selection to encompass the current comment.
	const commentRange = getCommentRange(document, cursorPosition, config);

	if (!commentRange) {
		vscode.window.showInformationMessage("Please place the cursor in a comment.");

		return;
	}

	// Re-wrap our comment as necessary.
	const commentText = document.getText(commentRange);
	const lineLength = getLineLength();
	const wrappedText = wrapCommentText(commentText, lineLength, config, calculateLength);

	editor.edit(editBuilder => {
		editBuilder.replace(commentRange, wrappedText);
	});
};
