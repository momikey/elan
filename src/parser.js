var fs = require("fs");
var jison = require("jison");
var bnfParser = require("ebnf-parser");
var lexParser = require("lex-parser");
var uglify = require("uglify-js");

var lexextra = require("./lex-extra");
var codegen = require("./codegen");

// Taken from jison2json
function processGrammar (rawGrammar, lex) {
	var grammar = bnfParser.parse(rawGrammar);
	if (lex) grammar.lex = lexParser.parse(lex);

	// trick to reposition `bnf` after `lex` in serialized JSON
	grammar.bnf = grammar.bnf;
	return JSON.stringify(grammar, null, ' ');
}

// We read in the grammar, and then we add on the "extra" rules,
// mostly so that the giant regex for identifiers doesn't have to be
// in the grammar file itself.
var bnf = fs.readFileSync("src/grammar.jison", "utf8");
var jsonparser = JSON.parse(processGrammar(bnf));
jsonparser.lex.rules = jsonparser.lex.rules.concat(lexextra.rules);

var parser = jison.Parser(jsonparser);

// This is the entry point to the compiler (such as it is).
function compile (source, pretty) {
	var output = codegen.compile(parser.parse(source));

	if (pretty) {
		return (uglify.minify(output, 
				{fromString: true, mangle: false, output: {beautify: true}}).code);
		return beautify.js_beautify(output);
	} else {
		return output;
	}
}

module.exports = {
	parse: parser.parse,
	compile: compile
}

