# Elan - A Unicode-aware programming language

## Install

Right now, Elan needs to be installed manually. (This will change in a later version.) To install from source, clone the git repository:

```bash
	git clone git://github.com/momikey/elan.git
	cd elan
	npm install
```

If you want to use Elan in your own project, then, in your project's directory, run:

```bash
	npm install <path to elan repo>
```

## Build

The browser-based version of Elan is built using Gulp. In the top level of the Elan repository, run:

```bash
gulp
```
This will create two files in the `build/` directory: `elan.js` and `elan.min.js`. The only difference between the two is that `elan.min.js` is minified using [UglifyJS2](https://github.com/mishoo/UglifyJS2).

## Usage

Elan exports two functions that you can use: `parse` and `compile`.

In IO.js or Node, these are exported by the Elan module:

```js
// From IO.js/Node
var Elan = require('elan');
Elan.parse("#some code#"); // parses code and returns an AST
Elan.compile("#some code#"); // parses code and compiles into a string that contains JS code
```

In the browser, `elan.js` (or `elan.min.js`) creates an object called `window.Elan`:

```js
// From browser-based code
// Elan is created on the global window object when the script loads
Elan.parse("#some code#"); // parses code and returns an AST
Elan.compile("#some code#"); // parses code and compiles into a string that contains JS code
```

## Examples

See [this post](http://prosepoetrycode.potterpcs.net/2015/04/elan-unicode-and-emoji-in-your-code) for examples.

## License

Elan is copyright (C) 2015 Michael Potter under the [MIT license](LICENSE) .

The browser version of Elan contains code from the following:

* [jison](https://github.com/zaach/jison), Copyright (c) 2009-2014 Zachary Carter
* [UglifyJS2](https://github.com/mishoo/UglifyJS2), Copyright 2012-2013 (c) Mihai Bazon
