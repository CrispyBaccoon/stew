# Stew

Stores configuration files in a config folder and links them to your local folder or file.

## Installation

    $ git clone --depth 1 https://github.com/CrispyBaccoon/stew.git
    $ ln -s stew/index.js ~/.local/bin/stew

## Usage

```bash
stew add .config/sxhkd
```

This will back up your _sxhkd_ folder to the stew folder and links the folder
to _.config/sxhkd_.

You could also backup singular files.

```bash
stew add .config/sxhkd/sxhkdrc
```

## Configuration

Stew will search for a configuration file in _~/.stewrc_.

```json
{
    "main": {
        "stewpath": "~/.stew",
        "git": false
    }
}
```

Configuration for individual files and folders is stored under the _module_ section.

```dosini
{
    ...
    "module": {
       "alacritty": [ "~/.config/alacritty" ]
    }
}
```
