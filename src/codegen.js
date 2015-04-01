// Creates JS code from an Elan AST
// This will then be pretty-printed by Uglify

// Symbol table to keep track of defined variables, functions, etc.
var symbols = {
	variables: [],
	functionNumber: 0,
}

// Javascript reserved words
// (Note: ES3 keywords that were removed in ES5 aren't included)
var reserved = ['break', 'case', 'catch', 'continue', 'debugger', 'default',
	'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 
	'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof',
	'var', 'void', 'while', 'with', 'class', 'const', 'enum', 'export',
	'extends', 'import', 'super', 'implements', 'interface', 'let', 
	'package', 'private', 'protected', 'public', 'static', 'yield', 'null',
	'true', 'false', 'NaN', 'Infinity', 'undefined', 'eval', 'arguments'];

// Regex to match a surrogate pair
// These characters are not valid identifiers in JS
var surrogates = /[\uD800-\uD87F][\uDC00-\uDFFF]/g;

// Convert a string possibly containing surrogate pairs into a valid JS identifier
// This uses the format "$P1$P2", where P1 and P2 are the hex values of 
// the 1st and 2nd halves of the pair.
function convertSurrogates (str) {
	function formatPair (match) {
		return "$" + match.charCodeAt(0).toString(16) + "$" + match.charCodeAt(1).toString(16);
	}

	return str.replace(surrogates, formatPair);
}

// Create a string containing JS code from an object.
// This will be called recursively as we descend through the AST.
// TODO Change this to use custom AST node classes with generating methods
function compileNode(node, options) {
	// Instead of a node object, this function might be called
	// with an array of nodes. In this case, we simply compile
	// each node, then concatenate all of them.
	// (options.separator should be set by any function that calls in this way)
	if (Array.isArray(node)) {
		return node.map(compile).join((options && options.separator) || "") + (options && options.trailing ? options.separator : "");
	}

	// Each node object should have a "type" field,
	// but a future version will use classes instead.
	if (!node.hasOwnProperty('type')) {
		throw new Error("Not a valid node: " + JSON.stringify(node));
	}

	var code = "";

	switch (node.type) {
		case "access":
			code = compileAccess(node);
			break;
		case "assignment":
			code = compileAssignment(node);
			break;
		case "binop":
			code = compileBinaryOp(node);
			break;
		case "block":
			code = compileBlock(node);
			break;
		case "boolean":
			code = compileBoolean(node);
			break;
		case "break":
			code = compileBreak(node);
			break;
		case "call":
			code = compileFunctionCall(node);
			break;
		case "case":
			code = compileCase(node);
			break;
		case "catch":
			code = compileCatch(node);
			break;
		case "choice":
			code = compileChoice(node);
			break;
		case "compare":
			code = compileCompareOp(node);
			break;
		case "conditional":
			code = compileConditional(node);
			break;
		case "continue":
			code = compileContinue(node);
			break;
		case "expression":
			code = compileExpression(node);
			break;
		case "function":
			code = compileFunctionDefinition(node);
			break;
		case "handler":
			code = compileExceptionHandler(node);
			break;
		case "identifier":
			code = compileIdentifier(node);
			break;
		case "iterator":
			code = compileIterator(node);
			break;
		case "list":
			code = compileList(node);
			break;
		case "listvalue":
			code = compileListValue(node);
			break;
		case "logical":
			code = compileLogical(node);
			break;
		case "loop":
			code = compileLoop(node);
			break;
		case "new":
			code = compileNew(node);
			break;
		case "null":
			code = compileNull(node);
			break;
		case "number":
			code = compileNumber(node);
			break;
		case "object":
			code = compileObject(node);
			break;
		case "program":
			code = compileProgram(node);
			break;
		case "property":
			code = compileProperty(node);
			break;
		case "return":
			code = compileReturn(node);
			break;
		case "string":
			code = compileString(node);
			break;
		case "ternary":
			code = compileTernary(node);
			break;
		case "throw":
			code = compileThrow(node);
			break;
		case "unaryop":
			code = compileUnaryOp(node);
			break;
		case "_indexvar":
			code = compileIndexVar(node);
			break;
		default:
			throw new Error("Unknown node of type " + node.type);
	}

	return code;
}

function compile(node, options) {
	// TODO Add root tracking, etc.
	return compileNode(node, options);
}

function compileWithSemicolons(node, options) {
	// Blocks use this function to insert semicolons after statements
	options = options || {};
	options.separator = ';\n';
	options.trailing = true;
	return compile(node, options);
}

function compileAccess(node) {
	if (node.prop.type === "identifier") {
		// use dot notation
		return compile(node.obj) + "." + compile(node.prop);
	} else {
		// use array notation
		return compile(node.obj) + "[" + compile(node.prop) + "]";
	}
}

function compileAssignment(node) {
	var defined = (symbols.variables.indexOf(node.id.id) >= 0);
	if (!defined) {
		symbols.variables.push(node.id.id);
	}

	return (!defined ? "var " : "") + compile(node.id) + " = " + compile(node.value);
}

function compileBinaryOp(node) {
	if (node.op != "^") {
		return compile(node.opers[0]) + " " + node.op + " " + compile(node.opers[1]);
	} else {
		// We have a power operator, but JS doesn't
		return "Math.pow(" + compile(node.opers[0]) + "," + compile(node.opers[1]) + ")";
	}
}

function compileBlock(node) {
	return compileWithSemicolons(node.statements);
}

function compileBoolean(node) {
	return node.value + "";
}

function compileBreak(node) {
	return "break"
}

function compileCase(node) {
	return "case " + compile(node.when) + ": " + compile(node.statements) + "break;";
}

function compileCatch(node) {
	var output = "catch (" + compile(node.error) + ") { " +
		compileWithSemicolons(node.block) + " }";

	return output;
}

function compileChoice(node) {
	return "switch (" + compile(node.switchexpr) + ") { " +
		compile(node.cases) + " default: " + compile(node.defaultexpr) + "}";
}

function compileCompareOp(node) {
	return compile(node.opers[0]) + " " + node.op + " " + compile(node.opers[1]);
}

function compileConditional(node) {
	return ("if (" + compile(node.condition) + ") { " +
		compileWithSemicolons(node.yes) + " }" + (node.no != null ? " else { " + compileWithSemicolons(node.no) + " }" : ""));
}

function compileContinue(node) {
	return "continue"
}

function compileExpression(node) {
	return compile(node.expr);
}

function compileFunctionCall(node) {
	var paramsList = (node.hasOwnProperty("parameters") ?
			compile(node.parameters) :
			"");
	var isIIFE = (node.receiver.type === "function");
	var receiver = compile(node.receiver);

	if (isIIFE) {
		receiver = "(" + receiver + ")";
	}

	return receiver + "(" + paramsList + ")";
	// If we have parameters, they'll be in a string
	// that looks like an array, e.g. "[a,b,c]", so we slice
	// the end brackets off before outputting the string.
	//return receiver + "(" + (paramsList ? paramsList.slice(1, -1) : "") + ")";
}

function compileFunctionDefinition(node) {
	var paramsList = (node.hasOwnProperty("parameters") ?
			compile(node.parameters) :
			"");
	if (node.block.statements.length == 1 && node.block.statements[0].type == "expression") {
		node.block.statements[0].value = node.block.statements[0].expr;
		node.block.statements[0].type = "return";
	}

	return ("function $" + (symbols.functionNumber++) + " (" + paramsList + ") { " + compile(node.block) + " }");
	// If we have parameters, they'll be in a string
	// that looks like an array, e.g. "[a,b,c]", so we slice
	// the end brackets off before outputting the string.
	//return ("function $" + (symbols.functionNumber++) + " (" + (paramsList ? paramsList.slice(1, -1) : "") + ") { " + compileWithSemicolons(node.block) + " }");
}

function compileExceptionHandler(node) {
	return "try { " + compile(node.trying) + " } " + compile(node.catching);
}

function compileIdentifier(node) {
	// TODO Check for invalid characters
	return convertSurrogates(node.id);
}

function compileIterator(node) {
	// TODO Handle different types of iteration (strings, objects, etc.)
	var dummy = "$_i";
	var exvar = "$_e";
	var idx = compileIndexVar(node);
	return "for (var " + dummy + " = 0," + exvar + " = " + compile(node.source) + "," + idx + " = " + exvar + "[0];" +
		dummy + " < " + exvar + ".length; " +
		dummy + "++," + idx + " = " + exvar + "[" + dummy + "]) { " + compile(node.block) + " }";
}

function compileList(node) {
	return compile(node.values, {separator: ','});
}

function compileListValue(node) {
	return "[" + compile(node.values, {separator: ','}) + "]";
}

function compileLogical(node) {
	return compile(node.opers[0]) + node.op + compile(node.opers[1]);
}

function compileLoop(node) {
	return "while (" + (node.condition ? compile(node.condition) : "true") + ") { " + compileWithSemicolons(node.block) + " }";
}

function compileNew(node) {
	// TODO Handle these better
	if (node.func) {
		return "new " + compile(node.func);
	} else if (node.id) {
		return "new " + compile(node.id);
	} else if (node.definition) {
		return "new " + compile(node.definition);
	}
}

function compileNull(node) {
	return "null";
}

function compileNumber(node) {
	// TODO Better validation
	return +node.value;
}

function compileObject(node) {
	// TODO Better validation
	return "{" + compile(node.properties, {separator: ", "}) + "}";
}

function compileProgram(node) {
	// TODO Better validation, more metadata
	return compileWithSemicolons(node.statements);
}

function compileProperty(node) {
	return compile(node.id) + ": " + compile(node.value);
}

function compileReturn(node) {
	return "return " + (typeof node.value !== 'object' ? node.value : compile(node.value)) + "";
}

function compileString(node) {
	return '"' + node.value + '"';
}

function compileTernary(node) {
	return "(" + compile(node.condition) + ") ? " + compile(node.yes) + " : " + compile(node.no);
}

function compileThrow(node) {
	// TODO Other types of errors
	return "throw new Error(" + compile(node.value) + ")";
}

function compileUnaryOp(node) {
	return node.op + compile(node.oper);
}

function compileIndexVar(node) {
	return "$it";
}

module.exports = {
	compile: compile,
}
