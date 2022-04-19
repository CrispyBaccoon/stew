#!/usr/bin/env node

const dev = true;

const fs = require("fs");
const ini = require("ini");
const { Module } = require("module");
const path = require("path");

const args = process.argv.slice(2);

const p = (path) => path.replace("~", `${require("os").homedir}`);

const unlinkDir = (dir) => {
 if (fs.lstatSync(dir).isDirectory()) {
  fs.readdirSync(dir).map((file) => {
   let curPath = path.join(dir, file);
   if (fs.lstatSync(curPath).isDirectory()) {
    unlinkDir(curPath);
   } else {
    fs.unlinkSync(curPath);
   }
  });
 }
};

const copyDir = (src, target, targetFolderName = false) => {
 let targetFolder = targetFolderName
  ? path.join(target, targetFolderName)
  : path.join(target, path.basename(src));
 if (!fs.existsSync(targetFolder)) {
  fs.mkdirSync(targetFolder);
 }

 if (fs.lstatSync(src).isDirectory()) {
  fs.readdirSync(src).map((file) => {
   let curSrc = path.join(src, file);
   if (fs.lstatSync(curSrc).isDirectory()) {
    copyDir(curSrc, targetFolder);
   } else {
    fs.copyFileSync(curSrc, path.join(targetFolder, file));
   }
  });
 }
};

const mergeConfigs = (main, user) => {
 let config = main;

 // Move section/name to config.section.name
 Object.keys(user)
  .filter((key) => /\//.test(key))
  .map((key) => {
   let [section, name] = key.split("/");
   user[section] = { ...user[section], [name]: {} };
   user[section][name] = user[key];
  });

 // Merge configs
 Object.keys(main).map((key) => {
  config[key] = Object.assign(main[key], user[key]);
 });

 return config;
};

class App {
 constructor() {
  try {
   this.userConfig = ini.parse(
    fs.readFileSync(
     path.join(require("os").homedir(), ".config/stew/stewrc"),
     "utf8"
    )
   );
  } catch (error) {
   switch (error.errno) {
    case -2: {
     console.warn("~/.config/stew/stewrc does not exist\n Using default config");
     this.userConfig = {}
     if (!dev) {
      break;
     }
    }
    default: {
     console.log(error);
     process.exit();
     break;
    }
   }
  }
  this.config = mergeConfigs(this.defaultConfig, this.userConfig);
  this.stewpath = p(this.config.dotfiles.path);
  this.git = this.config.dotfiles.git;

  // Check if stewpath exists
  if (!fs.existsSync(this.stewpath)) {
   fs.mkdirSync(this.stewpath);
  } else {
   if (!fs.statSync(this.stewpath).isDirectory()) {
    fs.mkdirSync(this.stewpath);
   }
  }
 }

 defaultConfig = {
  dotfiles: {
   path: `~/.stew`,
   git: true,
  },
  module: {},
 };
 userConfig = {};
 config = {};
 stewpath = "";
 git = this.defaultConfig.dotfiles.git;

 stew(pth) {
  pth = path.normalize(pth);
  pth = path.join(path.dirname(pth), path.basename(pth));

  if (!fs.existsSync(pth)) {
   this.link(pth);
  }
  if (fs.statSync(pth).isDirectory()) {
   this._stewDirectory(pth);
  } else {
   this._stewFile(pth);
  }
 }

 _stewDirectory(dir) {
  let module = this.config.module.hasOwnProperty(path.basename(dir))
   ? this.config.module[path.basename(dir)]
   : {};
  let configname = module.hasOwnProperty("storeWithName")
   ? module.storeWithName
   : path.basename(dir);

  let configpath = path.join(this.stewpath, configname);

  if (fs.existsSync(configpath)) {
   if (!fs.statSync(configpath).isDirectory()) {
    fs.mkdirSync(configpath);
   }
  } else {
   fs.mkdirSync(configpath);
  }

  copyDir(dir, this.stewpath, configname);

  fs.rm(dir, { recursive: true }, (err) => {
   if (!err) {
    fs.symlinkSync(configpath, dir);
   } else {
    console.log(err);
   }
  });
 }
 _stewFile(file) {
  let module = this.config.module.hasOwnProperty(path.basename(file))
   ? this.config.module[path.basename(file)]
   : {};
  let configname = module.hasOwnProperty("storeWithName")
   ? module.storeWithName
   : path.basename(file);
  this.config.module[path.basename(file)].storeWithName || path.basename(file);
  let configpath = path.join(this.stewpath, configname);

  fs.cpSync(file, configpath);

  fs.unlink(file, (err) => {
   if (!err) {
    fs.symlinkSync(configpath, file);
   } else {
    console.log(err);
   }
  });
 }

 link(pth) {
  let module = this.config.module.hasOwnProperty(path.basename(pth))
   ? this.config.module[path.basename(pth)]
   : {};
  let configname = module.hasOwnProperty("storeWithName")
   ? module.storeWithName
   : path.basename(pth);
  let configpath = path.join(this.stewpath, configname);

  if (fs.existsSync(configpath)) {
   if (fs.statSync(configpath).isDirectory()) {
    // its a directory
    if (fs.existsSync(configpath)) {
     if (!fs.statSync(configpath).isDirectory()) {
      fs.mkdirSync(configpath);
     }
    } else {
     fs.mkdirSync(configpath);
    }
   }
   fs.symlinkSync(configpath, pth);
  } else {
   return;
  }
 }
}

const app = new App();

args.map((path) => app.stew(path));

// vim: ft=javascript
