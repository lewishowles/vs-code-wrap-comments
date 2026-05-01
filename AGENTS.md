# Instructions for this project

The intention of this project is extend VS Code to wrap comments to 80 characters in all supported languages.

Because the aim of this project is fairly simple, it isn't updated very regularly. To that end, if anything is out of date, or any patterns are no longer considered best practice, review those with the user before continuing.

This project is installed manually.

- Run `vsce package` to generate the `.vsix` file.
- The user then needs to:
  1. Open VSCode.
  2. Go to the Extensions view by clicking the `Extensions` icon in the Activity Bar on the side of the window
  3. Click on the three dots in the top right corner of the `Extensions` view and select `Install from VSIX...`
  4. Navigate to the `.vsix` file you created and select it.
