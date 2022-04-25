#!/usr/bin/env node

import App from "./App.js";

const app = new App();

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "setup": {
    // Takes [ name ]. Adds symlinks to each location for the folder/file with *name* in stewpath.
    if (args[0] != undefined) {
      app.setup(args[0]);
    } else {
      console.warn("not enough arguments.");
      process.exit();
    }
    break;
  }
  case "add": {
    // Takes [ path, name ]. Moves folder/file at *path* to stewpath with *name*. Also adds this to your config.
    if (args[0] != undefined && args[1] != undefined) {
      app.add(args[0], args[1]);
    } else {
      console.warn("not enough arguments.");
      process.exit();
    }
    break;
  }
  case "link": {
    // Takes [ path, name ]. **ONLY IF *path* DOES NOT EXIST**. Will add *path* to *name* in config and link.
    if (args[0] != undefined && args[1] != undefined) {
      app.link(args[0], args[1]);
    } else {
      console.warn("not enough arguments.");
      process.exit();
    }
    break;
  }
  default: {
    break;
  }
}

// vim: ft=javascript
