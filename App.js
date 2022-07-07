import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";

const dev = true;
let prompt = readline.createInterface({
 input: process.stdin,
 output: process.stdout
})

const p = (path) => path.replace("~", `${os.homedir}`);

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

 /* Move section/name to config.section.name */
 /* Object.keys(user)
  .filter((key) => /\//.test(key))
  .map((key) => {
   let [section, name] = key.split("/");
   user[section] = { ...user[section], [name]: {} };
   user[section][name] = user[key];
  }); */

 /* Merge configs */
 Object.keys(main).map((key) => {
  config[key] = Object.assign(main[key], user[key]);
 });

 return config;
};

class App {
 constructor() {
  this.configpath = p(
   { win32: "~/.stewrc", linux: "~/.config/stew/stewrc" }[process.platform] || "~/.stewrc"
  );
  try {
   this.userConfig = JSON.parse(fs.readFileSync(this.configpath));
  } catch (error) {
   switch (error.errno) {
    case -2: {
     console.warn(`${this.configpath} does not exist\n Using default config`);
     this.userConfig = {};
     if (!dev) {
      break;
     }
    }
    default: {
     console.log(error);
     process.exit();
    }
   }
  }
  this.config = mergeConfigs(this.defaultConfig, this.userConfig);

  /* Check if stewpath exists */
  if (!fs.existsSync(this.stewpath)) {
   fs.mkdirSync(this.stewpath);
  } else {
   if (!fs.statSync(this.stewpath).isDirectory()) {
    fs.mkdirSync(this.stewpath);
   }
  }
 }

 configpath = "";
 defaultConfig = {
  main: {
   stewpath: `~/.stew`,
   git: true,
  },
  module: {},
 };
 userConfig = {};
 config = {};
 get stewpath() {
  return p(this.config.main.stewpath);
 }
 get git() {
  return this.config.main.git;
 }

 _saveConfig() {
  fs.writeFileSync(this.configpath, JSON.stringify(this.config));
 }

 add(pth, name) {
  if (this.config.module[name]) {
   console.warn(`a stew with name: *${name}* already exists.`);
   /* TODO: Maybe ask for link */
   process.exit();
  }
  pth = path.normalize(pth);
  pth = path.join(path.dirname(pth), path.basename(pth));

  if (!fs.existsSync(pth)) {
   console.warn(`${pth} does not exist.`);
   /* TODO: Maybe ask for link */
   process.exit();
  }

  let configpath = p(path.join(this.stewpath, name));
  let isDir = fs.statSync(pth).isDirectory();
  if (fs.existsSync(configpath)) {
   if (!fs.statSync(configpath).isDirectory() && isDir) {
    fs.mkdirSync(configpath);
   }
  } else {
   if (isDir) {
    fs.mkdirSync(configpath);
   }
  }
  if (isDir) {
   copyDir(pth, p(this.stewpath), name);
   fs.rm(pth, { recursive: true }, (err) => {
    if (!err) {
     this.link(pth, name);
    } else {
     console.log(err);
    }
   });
  } else {
   fs.cpSync(pth, configpath);
   fs.unlink(pth, (err) => {
    if (!err) {
     this.link(pth, name);
    } else {
     console.log(err);
    }
   });
  }
 }

 setup(name) {
  let ans = false;
  if (name == null) {
   prompt.question("are you sure you want to setup all config files? (y/N)", function(answer) {
     ans = answer
     prompt.close();
   })
   prompt.on('close', () => {
    if ( ans == 'Y' || ans == 'y' ) {
     Object.keys(this.config.module).map(name => this.setup(name));
    }
    process.exit();
   })
  }

  const loc = this.config.module.hasOwnProperty(name)
   ? this.config.module[name]
   : [];
  if (loc == []) {
   console.warn(`no links are defined for ${name}.`)
   process.exit();
  }

   loc
   .map(l => p(l))
   .filter((l) => {
    if (fs.existsSync(l)) {
     console.log(`${l} already exists.`);
     return false;
    } else {
     return true;
    }
   })
   .map((l) => {
    console.log(`linking ${name} to ${l}.`);
    fs.symlinkSync(p(path.join(this.stewpath, name)), l);
   });
 }

 link(pth, name) {
  if (fs.existsSync(pth)) {
   console.warn(`${pth} already exists.`);
   process.exit();
  }

  if (this.config.module[name]) {
   this.config.module[name].push(pth);
  } else {
   this.config.module[name] = [pth];
  }

  this._saveConfig();

  this.setup(name);
 }
}

export default App;
