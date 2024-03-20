# Sync Gospel Library annotations to Readwise

A web extension that allows you to sync your annotations from [Gospel Library](https://www.churchofjesuschrist.org/study/lib) (an app by The Church of Jesus Christ of Latter-day Saints) to [Readwise](https://readwise.io/).

## Installing

Chrome-based browsers:

1. Download the repo
2. Go to "Manage Extensions" in your browser
3. Enable "Developer Mode"
4. Click "Load unpacked"
5. Select the repo directory

Firefox: Not yet supported. Someday I will take time to bundle an extension package for Firefox.

Safari: Not supported. I don't have a Mac, so I can't publish for Safari.

## Usage

Click the extension's icon in the extensions menu in your browser. Click the "Sync" button to sync your Gospel Library highlights to Readwise. 🙂 It will prompt you to log into ChurchofJesusChrist.org if needed, and will prompt you for your [Readwise API key](https://readwise.io/access_token) as well.

The extension will remember the last successful sync time. On later syncs, it will only sync highlights that have been updated since that time. (You can use the "Debugging" menu to reset the last sync time.)

## Developing

* See [`popup.js`](./src/popup.js) for the main logic of the code. See [`popup.html`](./src/popup.html) for the UI.
* See [here for Readwise's API docs](https://readwise.io/api_deets).
