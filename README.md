# Visual Studio Code: Wrap comments

Comments look better, to me, wrapped at 80 characters. This plugin re-flows a comment to do just that, so you don’t have to think about it.

When activated on a comment block, it extends the selection to include the entire comment and re-flows the resulting lines.

The plugin currently works with single-line style (`//`) and multi-line style (` * `) Javascript comments, and bash comments (`#`). JavaScript comments automatically exclude JSDoc annotations (`@param`, `@return`) and closing delimiters (`*/`). Bash comments have no exclusions.

Any gaps in the comment—that is, lines that contain just a comment marker and no text—are treated as paragraph delimiters, and each paragraph is wrapped separately.

## Language Configuration

Comment wrapping is language-aware. Each language specifies its own markers and exclusion patterns:

- **JavaScript** (javascript, javascriptreact, typescript, typescriptreact): Markers `//` and `*`, excludes JSDoc annotations
- **Bash** (shell, sh, zsh, properties, ignore, dotenv): Marker `#`, no exclusions
- **Fallback**: For unknown languages, all markers (`//`, `*`, `#`) are supported with no exclusions

To add support for a new language, modify `languageConfiguration` in `src/wrap-comment.js`:

```javascript
const languageConfiguration = {
	python: {
		languages: ["python"],
		markers: ["#"],
		exclusions: []
	}
};
```

## Settings

Configure wrapping behaviour via VS Code settings:

- **`wrapComments.lineLength`** (number, default: `80`) — Line length to wrap comments to. Falls back to `editor.wordWrapColumn` if not set, then to 80.

Example in `.vscode/settings.json`:

```json
{
	"wrapComments.lineLength": 100
}
```

## Examples

## A long, single-line comment

```
// Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio atque ut laborum id harum asperiores, consequatur iure, accusantium vel velit illo itaque cumque libero, quod magni nesciunt. Rem, suscipit incidunt!
```

is turned into

```
// Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio atque ut
// laborum id harum asperiores, consequatur iure, accusantium vel velit illo
// itaque cumque libero, quod magni nesciunt. Rem, suscipit incidunt!
```

## A multi-line comment

```
/**
 * Lorem ipsum dolor sit amet consectetur adipisicing elit.
 * Odio atque ut laborum id harum asperiores, consequatur iure, accusantium vel velit illo itaque cumque libero, quod magni nesciunt. Rem, suscipit incidunt!
 */
```

is turned into

```
/**
 * Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio atque ut
 * laborum id harum asperiores, consequatur iure, accusantium vel velit illo
 * itaque cumque libero, quod magni nesciunt. Rem, suscipit incidunt!
 */
```

## Building the package

At the moment, this plugin hasn't been published, and must be installed manually.

Install `vsce` if it doesn't already exist:

```
npm i -g vsce
```

Package the plugin using vsce from the directory:

```
vsce package
```

This will generate a `.vsix` file in the repository root.

## Installing the plugin

1. Open VSCode.
1. **Go to the Extensions view** by clicking the **Extensions** icon in the Activity Bar on the side of the window
1. **Click on the three dots** in the top right corner of the Extensions view and select `Install from VSIX...`
1. **Navigate to the `.vsix`** file you created and select it.
