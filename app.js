//Imports for all things UI
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

//Running server backend


//Starting up the ui
let window = null

// Wait until the app is ready
app.once('ready', () => {
  // Create a new window
  window = new BrowserWindow({
    // Default size
    width: 800,
    height: 600,
    //Default backgroundColor
    titleBarStyle:'#0B0B0B',
    // Don't show the window until it's ready, this prevents any white flickering
    show: false
  });

  // TODO: renable
  // window.setMenu(null);

  window.loadURL(url.format({
    pathname: path.join(__dirname, './res/main.html'),
    protocol: 'file:',
    slashes: true
  }));

  window.once('ready-to-show', () => {
    window.show()
  })
})

//Starting up the backend
