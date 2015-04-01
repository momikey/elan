%lex

%x string

%options flex

%%

\n|";"							return "EOL";
\s+								// skip
[0-9]+("."[0-9]+)?				return "NUMBER";
// matching an identifier is handled by the giant regex in lex-extra.js
/*
"#"								this.begin("comment");
<comment>[^#\n;]*				// skip
<comment><<EOF>>				%{ this.popState(); return "EOF"; %}
<comment>"#"					this.popState();
<comment>[\n;]					%{ this.popState(); return "EOL"; %}
*/
"#"[^#\n;]*						// skip comment

["]								this.begin("string");
<string>[^"]*					return "STRING";
<string><<EOF>>					return "STRINGEOF";
<string>["]						this.popState();

"("								return "LPAREN";
")"								return "RPAREN";
"+"								return "PLUS";
"-"								return "MINUS";
"*"								return "MULTIPLY";
"/"								return "DIVIDE";
"%"								return "MODULO";
"^"								return "POWER";
"⬆"|":++:"						return "INCREMENT";
"⬇"|":--:"						return "DECREMENT";
"<="|"≤"						return "LESS_EQUAL";
">="|"≥"						return "GREATER_EQUAL";
"/="|"≠"						return "NOT_EQUAL";
"<"								return "LESS";
">"								return "GREATER";
"="								return "EQUAL";
"&"								return "AND";
"|"								return "OR";
"{"								return "LBRACE";
"}"								return "RBRACE";
"?"								return "QUESTION";
"!"								return "EXCLAMATION";
","								return "COMMA";
"."								return "DOT";
"_"								return "SUBSCRIPT";
"⬅"|":=:"						return "ASSIGN";
[✔✖]|":t:"|":f:"				return "BOOL";
"☝"|"👆"|"👇"|":index:"|":i:"		return "INDEX";
"🚫"|":null:"					return "NULL";
"◀"|":end:"						return "BLOCKEND";
"◼"|":stop:"					return "STOP";
"⏩"|":ff:"|":continue:"			return "CONTINUE";
"✏"|":def:"						return "DEFINE";
"👍"|":yes:"						return "RETURN_TRUE";
"👎"|":no:"						return "RETURN_FALSE";
"🔃"|"➰"|"🔀"|":loop:"			return "LOOP";
"🔁"|":iter:"					return "ITERATE";
"↩"|"⏎"|":return:"				return "RETURN";
"📞"|"📱"|":call:"				return "CALL";
"✉"|":with:"					return "WITH";		// TODO: find better symbol
"📦"|"☺"|":object:"				return "OBJECT";	// TODO: find better symbol
"🔨"|":new:"						return "NEW";
"🔍"|"🔎"|":try:"					return "TRY";		// TODO: find better symbol
"✋"|":catch:"					return "CATCH"; 	// TODO: find better symbol
"💡"|":switch:"					return "SWITCH";	// TODO: find better symbol
"☑"|"🔘"|":case:"				return "CASE";		// TODO: find better symbol
"➡"|":do:"						return "DO";
"⚾"|"💣"|"💩"|":throw:"			return "THROW";
<<EOF>>							return "EOF";

/lex

%nonassoc EXPR
%right ASSIGN
%left SUBSCRIPT
%right LOOP ITERATE SWITCH CASE
%right QUESTION EXCLAMATION
%left AND OR
%nonassoc LESS GREATER EQUAL LESS_EQUAL GREATER_EQUAL NOT_EQUAL
%left PLUS MINUS
%right POWER
%left MULTIPLY DIVIDE MODULO
%nonassoc UMINUS INCREMENT DECREMENT
%nonassoc THROW
%left CALL
%left DOT

%start program

%%

program
	: statement_list EOF {return {type: "program", statements: $1};}
	| EOF {return {type: "program", statements: []};}
	;

statement_list
	: statement	-> [$1]
	| statement_list statement	-> $1.concat($2)
	| statement_list end		-> $1
	| end	-> []
	;

end: EOL;

statement
	: assignment			-> $1
	| e	%prec EXPR			-> {type: "expression", expr: $1}
	| conditional_statement	-> $1
	| loop_statement		-> $1
	| iteration_statement	-> $1
	| choice_statement		-> $1
	| DO block				-> $2
	| STOP					-> {type: "break"}
	| CONTINUE				-> {type: "continue"}
	| return_statement		-> $1
	| exception_statement	-> $1
	| throw_statement		-> $1
	;

block
	: statement_list BLOCKEND	-> {type: "block", statements: $1}
	;

assignment
	: ident ASSIGN e	-> {type: "assignment", id: $1, value: $3}
	;

function_definition
	: list DEFINE block	-> {type: "function", parameters: $1, block: $3}
	;

function_call
	: CALL e			-> {type: "call", receiver: $2}
	| WITH list CALL e	-> {type: "call", receiver: $4, parameters: $2}
	;

loop_statement
	: LOOP block	-> {type: "loop", block: $2}
	| e LOOP block	-> {type: "loop", block: $3, condition: $1}
	;

iteration_statement
	: e ITERATE block	-> {type: "iterator", source: $1, block: $3}
	;

choice_statement
	: e SWITCH e case_list	-> {type: "choice", switchexpr: $1, defaultexpr: $3, cases: $4}
	;

case_list
	: CASE e DO block		-> {type: "case", when: $2, statements: $4}
	;

return_statement
	: e RETURN		-> {type: "return", value: $1}
	| RETURN_TRUE	-> {type: "return", value: true}
	| RETURN_FALSE	-> {type: "return", value: false}
	;

exception_statement
	: try_statement catch_list BLOCKEND	-> {type: "handler", trying: $1, catching: $2}
	;

try_statement
	: TRY statement_list	-> $2
	;

catch_list
	: catch_list catch_statement	-> $1.concat($2)
	| catch_statement				-> [$1]
	;

catch_statement
	: CATCH ident statement_list	-> {type: "catch", error: $2, block: $3}
	;

throw_statement
	: THROW e	-> {type: "throw", value: $2}
	;

val
	: ident		-> $1
	| NUMBER	-> {type: "number", value: $1}
	| BOOL		-> {type: "boolean", value: ($1 == "\u2714" || $1 == ":t:") ? true : false}
	| STRING	-> {type: "string", value: $1}
	| list		-> $1
	| NULL		-> {type: "null"}
	| INDEX		-> {type: "_indexvar"}	// special for iterators
	;

ident
	: ID		-> {type: "identifier", id: $1}
	;

list
	: LBRACE list_item RBRACE	-> {type: "list", values: $2}
	;

list_item
	: list_item COMMA e	-> $1.concat($3)
	| e					-> [$1]
	|					-> []
	;

unary_operation
	: MINUS e			-> {type: "unaryop", op: $1, oper: $2}
	| INCREMENT e		-> {type: "unaryop", op: "++", oper: $2}
	| DECREMENT e		-> {type: "unaryop", op: "--", oper: $2}
	;

binary_operation
	: e PLUS e		-> {type: "binop", op: $2, opers: [$1, $3]}
	| e MINUS e		-> {type: "binop", op: $2, opers: [$1, $3]}
	| e MULTIPLY e	-> {type: "binop", op: $2, opers: [$1, $3]}
	| e DIVIDE e	-> {type: "binop", op: $2, opers: [$1, $3]}
	| e MODULO e	-> {type: "binop", op: $2, opers: [$1, $3]}
	| e POWER e		-> {type: "binop", op: $2, opers: [$1, $3]}
	;

comparison_operation
	: e LESS e			-> {type: "compare", op: $2, opers: [$1, $3]}
	| e GREATER e		-> {type: "compare", op: $2, opers: [$1, $3]}
	| e EQUAL e			-> {type: "compare", op: "==", opers: [$1, $3]}
	| e LESS_EQUAL e	-> {type: "compare", op: $2, opers: [$1, $3]}
	| e GREATER_EQUAL e	-> {type: "compare", op: $2, opers: [$1, $3]}
	| e NOT_EQUAL e		-> {type: "compare", op: "!=", opers: [$1, $3]}
	;

logic_operation
	: e AND e			-> {type: "logical", op: "&&", opers: [$1, $3]}
	| e OR e			-> {type: "logical", op: "||", opers: [$1, $3]}
	;

conditional_statement
	: if_expr then_block else_block	-> {type: "conditional", condition: $1, yes: $2, no: $3}
	;

conditional_expression
	: if_expr then_expr else_expr	-> {type: "ternary", condition: $1, yes: $2, no: $3}
	;

if_expr
	: e QUESTION	-> $1
	;

then_expr
	: e EXCLAMATION	-> $1
	;

then_block
	: statement_list EXCLAMATION	-> $1
	;

else_expr
	: e EXCLAMATION -> $1
	;

else_block
	: statement_list EXCLAMATION -> $1
	| EXCLAMATION	->	null
	;

new_expression
	: NEW function_call			-> {type: "new", func: $2}
	| NEW ident					-> {type: "new", id: $2}
	| NEW function_definition	-> {type: "new", definition: $2}
	;

object_expression
	: OBJECT property_list BLOCKEND		-> {type: "object", properties: $2}
	;

property_list
	: property_list property	-> $1.concat($2)
	| property					-> [$1]
	;

property
	: assignment	-> {type: "property", id: $1.id, value: $1.value}
	| end			-> []
	;

object_access
	: e DOT e		-> {type: "access", obj: $1, prop: $3}
	| e SUBSCRIPT e	-> {type: "access", obj: $1, prop: $3}
	;

parenthesis_expression
	: LPAREN e RPAREN	-> $2
	;

e
	: val							-> $1
	| function_call					-> $1
	| function_definition			-> $1
	| unary_operation %prec UMINUS	-> $1
	| binary_operation				-> $1
	| logic_operation				-> $1
	| comparison_operation			-> $1
	| conditional_expression		-> $1
	| new_expression				-> $1
	| object_expression				-> $1
	| object_access					-> $1
	| parenthesis_expression		-> $1
	;
