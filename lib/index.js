"use strict";

var _slice = Array.prototype.slice;
var _toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var reduce = require("shift-reducer")["default"];
var Reducer = require("shift-reducer").Reducer;
var objectAssign = require("object-assign");

var TokenStream = require("./token_stream").TokenStream;
function codeGen(script) {
  var ts = new TokenStream();
  var rep = reduce(INSTANCE, script);
  rep.emit(ts);
  return ts.result;
}

exports["default"] = codeGen;
var Precedence = {
  Sequence: 0,
  Yield: 1,
  Assignment: 1,
  Conditional: 2,
  ArrowFunction: 2,
  LogicalOR: 3,
  LogicalAND: 4,
  BitwiseOR: 5,
  BitwiseXOR: 6,
  BitwiseAND: 7,
  Equality: 8,
  Relational: 9,
  BitwiseSHIFT: 10,
  Additive: 11,
  Multiplicative: 12,
  Prefix: 13,
  Postfix: 14,
  New: 15,
  Call: 16,
  TaggedTemplate: 17,
  Member: 18,
  Primary: 19
};

var BinaryPrecedence = {
  ",": Precedence.Sequence,
  "||": Precedence.LogicalOR,
  "&&": Precedence.LogicalAND,
  "|": Precedence.BitwiseOR,
  "^": Precedence.BitwiseXOR,
  "&": Precedence.BitwiseAND,
  "==": Precedence.Equality,
  "!=": Precedence.Equality,
  "===": Precedence.Equality,
  "!==": Precedence.Equality,
  "<": Precedence.Relational,
  ">": Precedence.Relational,
  "<=": Precedence.Relational,
  ">=": Precedence.Relational,
  "in": Precedence.Relational,
  "instanceof": Precedence.Relational,
  "<<": Precedence.BitwiseSHIFT,
  ">>": Precedence.BitwiseSHIFT,
  ">>>": Precedence.BitwiseSHIFT,
  "+": Precedence.Additive,
  "-": Precedence.Additive,
  "*": Precedence.Multiplicative,
  "%": Precedence.Multiplicative,
  "/": Precedence.Multiplicative
};

function getPrecedence(node) {
  switch (node.type) {
    case "ArrayExpression":
    case "FunctionExpression":
    case "IdentifierExpression":
    case "LiteralBooleanExpression":
    case "LiteralNullExpression":
    case "LiteralNumericExpression":
    case "LiteralRegExpExpression":
    case "LiteralStringExpression":
    case "ObjectExpression":
      return Precedence.Primary;

    case "AssignmentExpression":
      return Precedence.Assignment;

    case "ConditionalExpression":
      return Precedence.Conditional;

    case "ComputedMemberExpression":
    case "StaticMemberExpression":
      switch (node.object.type) {
        case "CallExpression":
        case "ComputedMemberExpression":
        case "StaticMemberExpression":
          return getPrecedence(node.object);
        default:
          return Precedence.Member;
      }

    case "BinaryExpression":
      return BinaryPrecedence[node.operator];

    case "CallExpression":
      return Precedence.Call;
    case "NewExpression":
      return node.arguments.length === 0 ? Precedence.New : Precedence.Member;
    case "PostfixExpression":
      return Precedence.Postfix;
    case "PrefixExpression":
      return Precedence.Prefix;
  }
}

function escapeStringLiteral(stringValue) {
  var result = "";
  result += ("\"");
  for (var i = 0; i < stringValue.length; i++) {
    var ch = stringValue.charAt(i);
    switch (ch) {
      case "\b":
        result += "\\b";
        break;
      case "\t":
        result += "\\t";
        break;
      case "\n":
        result += "\\n";
        break;
      case "\u000b":
        result += "\\v";
        break;
      case "\f":
        result += "\\f";
        break;
      case "\r":
        result += "\\r";
        break;
      case "\"":
        result += "\\\"";
        break;
      case "\\":
        result += "\\\\";
        break;
      case "\u2028":
        result += "\\u2028";
        break;
      case "\u2029":
        result += "\\u2029";
        break;
      default:
        result += ch;
        break;
    }
  }
  result += "\"";
  return result.toString();
}

function p(node, precedence, a) {
  return getPrecedence(node) < precedence ? paren(a) : a;
}

var CodeRep = (function () {
  var CodeRep = function CodeRep() {
    this.containsIn = false;
    this.containsGroup = false;
    this.startsWithFunctionOrCurly = false;
    this.endsWithMissingElse = false;
  };

  CodeRep.prototype.emit = function (stream, noIn) {
    throw new Error("Not implemented");
  };

  return CodeRep;
})();

var Empty = (function (CodeRep) {
  var Empty = function Empty() {
    CodeRep.apply(this, arguments);
  };

  _extends(Empty, CodeRep);

  Empty.prototype.emit = function () {};

  return Empty;
})(CodeRep);

var Token = (function (CodeRep) {
  var Token = function Token(token) {
    CodeRep.call(this);
    this.token = token;
  };

  _extends(Token, CodeRep);

  Token.prototype.emit = function (ts) {
    ts.put(this.token);
  };

  return Token;
})(CodeRep);

var NumberCodeRep = (function (CodeRep) {
  var NumberCodeRep = function NumberCodeRep(number) {
    CodeRep.call(this);
    this.number = number;
  };

  _extends(NumberCodeRep, CodeRep);

  NumberCodeRep.prototype.emit = function (ts) {
    ts.putNumber(this.number);
  };

  return NumberCodeRep;
})(CodeRep);

var Paren = (function (CodeRep) {
  var Paren = function Paren(expr) {
    CodeRep.call(this);
    this.expr = expr;
  };

  _extends(Paren, CodeRep);

  Paren.prototype.emit = function (ts) {
    ts.put("(");
    this.expr.emit(ts, false);
    ts.put(")");
  };

  return Paren;
})(CodeRep);

var Bracket = (function (CodeRep) {
  var Bracket = function Bracket(expr) {
    CodeRep.call(this);
    this.expr = expr;
  };

  _extends(Bracket, CodeRep);

  Bracket.prototype.emit = function (ts) {
    ts.put("[");
    this.expr.emit(ts, false);
    ts.put("]");
  };

  return Bracket;
})(CodeRep);

var Brace = (function (CodeRep) {
  var Brace = function Brace(expr) {
    CodeRep.call(this);
    this.expr = expr;
  };

  _extends(Brace, CodeRep);

  Brace.prototype.emit = function (ts) {
    ts.put("{");
    this.expr.emit(ts, false);
    ts.put("}");
  };

  return Brace;
})(CodeRep);

var NoIn = (function (CodeRep) {
  var NoIn = function NoIn(expr) {
    CodeRep.call(this);
    this.expr = expr;
  };

  _extends(NoIn, CodeRep);

  NoIn.prototype.emit = function (ts) {
    this.expr.emit(ts, true);
  };

  return NoIn;
})(CodeRep);

var ContainsIn = (function (CodeRep) {
  var ContainsIn = function ContainsIn(expr) {
    CodeRep.call(this);
    this.expr = expr;
  };

  _extends(ContainsIn, CodeRep);

  ContainsIn.prototype.emit = function (ts, noIn) {
    if (noIn) {
      ts.put("(");
      this.expr.emit(ts, false);
      ts.put(")");
    } else {
      this.expr.emit(ts, false);
    }
  };

  return ContainsIn;
})(CodeRep);

var Seq = (function (CodeRep) {
  var Seq = function Seq(children) {
    CodeRep.call(this);
    this.children = children;
  };

  _extends(Seq, CodeRep);

  Seq.prototype.emit = function (ts, noIn) {
    this.children.forEach(function (cr) {
      return cr.emit(ts, noIn);
    });
  };

  return Seq;
})(CodeRep);

var Semi = (function (Token) {
  var Semi = function Semi() {
    Token.call(this, ";");
  };

  _extends(Semi, Token);

  return Semi;
})(Token);

var CommaSep = (function (CodeRep) {
  var CommaSep = function CommaSep(children) {
    CodeRep.call(this);
    this.children = children;
  };

  _extends(CommaSep, CodeRep);

  CommaSep.prototype.emit = function (ts, noIn) {
    var first = true;
    this.children.forEach(function (cr) {
      if (first) {
        first = false;
      } else {
        ts.put(",");
      }
      cr.emit(ts, noIn);
    });
  };

  return CommaSep;
})(CodeRep);

var SemiOp = (function (CodeRep) {
  var SemiOp = function SemiOp() {
    CodeRep.apply(this, arguments);
  };

  _extends(SemiOp, CodeRep);

  SemiOp.prototype.emit = function (ts) {
    ts.putOptionalSemi();
  };

  return SemiOp;
})(CodeRep);

var Init = (function (CodeRep) {
  var Init = function Init(binding, init) {
    CodeRep.call(this);
    this.binding = binding;
    this.init = init;
  };

  _extends(Init, CodeRep);

  Init.prototype.emit = function (ts, noIn) {
    this.binding.emit(ts);
    if (this.init != null) {
      ts.put("=");
      this.init.emit(ts, noIn);
    }
  };

  return Init;
})(CodeRep);

function t(token) {
  return new Token(token);
}

function paren(rep) {
  return new Paren(rep);
}

function bracket(rep) {
  return new Bracket(rep);
}

function noIn(rep) {
  return new NoIn(rep);
}

function markContainsIn(state) {
  return state.containsIn ? new ContainsIn(state) : state;
}

function seq() {
  var reps = _slice.call(arguments);

  return new Seq(reps);
}

function semi() {
  return new Semi();
}

function empty() {
  return new Empty();
}

function commaSep(pieces) {
  return new CommaSep(pieces);
}

function brace(rep) {
  return new Brace(rep);
}

function semiOp() {
  return new SemiOp();
}

function parenToAvoidBeingDirective(element, original) {
  if (element && element.type === "ExpressionStatement" && element.expression.type === "LiteralStringExpression") {
    return seq(semiOp(), original);
  }
  return original;
}

function getAssignmentExpr(state) {
  return state ? (state.containsGroup ? paren(state) : state) : empty();
}

var CodeGen = (function (Reducer) {
  var CodeGen = function CodeGen() {
    Reducer.apply(this, arguments);
  };

  _extends(CodeGen, Reducer);

  CodeGen.prototype.reduceScript = function (node, body) {
    return body;
  };

  CodeGen.prototype.reduceIdentifier = function (node) {
    return t(node.name);
  };

  CodeGen.prototype.reduceIdentifierExpression = function (node, name) {
    return name;
  };

  CodeGen.prototype.reduceThisExpression = function (node) {
    return t("this");
  };

  CodeGen.prototype.reduceLiteralBooleanExpression = function (node) {
    return t(node.value.toString());
  };

  CodeGen.prototype.reduceLiteralStringExpression = function (node) {
    return t(escapeStringLiteral(node.value));
  };

  CodeGen.prototype.reduceLiteralRegExpExpression = function (node) {
    return t(node.value);
  };

  CodeGen.prototype.reduceLiteralNumericExpression = function (node) {
    return new NumberCodeRep(node.value);
  };

  CodeGen.prototype.reduceLiteralNullExpression = function (node) {
    return t("null");
  };

  CodeGen.prototype.reduceFunctionExpression = function (node, id, params, body) {
    var argBody = seq(paren(commaSep(params)), brace(body));
    var state = seq(t("function"), id ? seq(id, argBody) : argBody);
    state.startsWithFunctionOrCurly = true;
    return state;
  };

  CodeGen.prototype.reduceStaticMemberExpression = function (node, object, property) {
    var state = seq(p(node.object, getPrecedence(node), object), t("."), property);
    state.startsWithFunctionOrCurly = object.startsWithFunctionOrCurly;
    return state;
  };

  CodeGen.prototype.reduceComputedMemberExpression = function (node, object, expression) {
    return objectAssign(seq(p(node.object, getPrecedence(node), object), bracket(expression)), { startsWithFunctionOrCurly: object.startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reduceObjectExpression = function (node, properties) {
    var state = brace(commaSep(properties));
    state.startsWithFunctionOrCurly = true;
    return state;
  };

  CodeGen.prototype.reduceBinaryExpression = function (node, left, right) {
    var leftCode = left;
    var startsWithFunctionOrCurly = left.startsWithFunctionOrCurly;
    var leftContainsIn = left.containsIn;
    if (getPrecedence(node.left) < getPrecedence(node)) {
      leftCode = paren(leftCode);
      startsWithFunctionOrCurly = false;
      leftContainsIn = false;
    }
    var rightCode = right;
    var rightContainsIn = right.containsIn;
    if (getPrecedence(node.right) <= getPrecedence(node)) {
      rightCode = paren(rightCode);
      rightContainsIn = false;
    }

    return objectAssign(seq(leftCode, t(node.operator), rightCode), {
      containsIn: leftContainsIn || rightContainsIn || node.operator === "in",
      containsGroup: node.operator == ",",
      startsWithFunctionOrCurly: startsWithFunctionOrCurly
    });
  };

  CodeGen.prototype.reduceAssignmentExpression = function (node, binding, expression) {
    var rightCode = expression;
    var containsIn = expression.containsIn;
    var startsWithFunctionOrCurly = binding.startsWithFunctionOrCurly;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = paren(rightCode);
      containsIn = false;
    }
    return objectAssign(seq(binding, t(node.operator), rightCode), { containsIn: containsIn, startsWithFunctionOrCurly: startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reduceArrayExpression = function (node, elements) {
    if (elements.length === 0) {
      return bracket(empty());
    }

    var content = commaSep(elements.map(getAssignmentExpr));
    if (elements.length > 0 && elements[elements.length - 1] == null) {
      content = seq(content, t(","));
    }
    return bracket(content);
  };

  CodeGen.prototype.reduceNewExpression = function (node, callee, args) {
    var calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) : p(node.callee, getPrecedence(node), callee);
    return seq(t("new"), calleeRep, args.length === 0 ? empty() : paren(commaSep(args)));
  };

  CodeGen.prototype.reduceCallExpression = function (node, callee, args) {
    return objectAssign(seq(p(node.callee, getPrecedence(node), callee), paren(commaSep(args))), { startsWithFunctionOrCurly: callee.startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reducePostfixExpression = function (node, operand) {
    return objectAssign(seq(p(node.operand, getPrecedence(node), operand), t(node.operator)), { startsWithFunctionOrCurly: operand.startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reducePrefixExpression = function (node, operand) {
    return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
  };

  CodeGen.prototype.reduceConditionalExpression = function (node, test, consequent, alternate) {
    var containsIn = test.containsIn || alternate.containsIn;
    var startsWithFunctionOrCurly = test.startsWithFunctionOrCurly;
    return objectAssign(seq(p(node.test, Precedence.LogicalOR, test), t("?"), p(node.consequent, Precedence.Assignment, consequent), t(":"), p(node.alternate, Precedence.Assignment, alternate)), {
      containsIn: containsIn,
      startsWithFunctionOrCurly: startsWithFunctionOrCurly
    });
  };

  CodeGen.prototype.reduceFunctionDeclaration = function (node, id, params, body) {
    return seq(t("function"), id, paren(commaSep(params)), brace(body));
  };

  CodeGen.prototype.reduceUseStrictDirective = function (node) {
    return seq(t("\"use strict\""), semiOp());
  };

  CodeGen.prototype.reduceUnknownDirective = function (node) {
    var name = "use strict" === node.value ? "use\\u0020strict" : node.value;
    return seq(t("\"" + name + "\""), semiOp());
  };

  CodeGen.prototype.reduceBlockStatement = function (node, block) {
    return block;
  };

  CodeGen.prototype.reduceBreakStatement = function (node, label) {
    return seq(t("break"), label || empty(), semiOp());
  };

  CodeGen.prototype.reduceCatchClause = function (node, param, body) {
    return seq(t("catch"), paren(param), body);
  };

  CodeGen.prototype.reduceContinueStatement = function (node, label) {
    return seq(t("continue"), label || empty(), semiOp());
  };

  CodeGen.prototype.reduceDebuggerStatement = function (node) {
    return seq(t("debugger"), semiOp());
  };

  CodeGen.prototype.reduceDoWhileStatement = function (node, body, test) {
    return seq(t("do"), body, t("while"), paren(test), semiOp());
  };

  CodeGen.prototype.reduceEmptyStatement = function (node) {
    return semi();
  };

  CodeGen.prototype.reduceExpressionStatement = function (node, expression) {
    return seq((expression.startsWithFunctionOrCurly ? paren(expression) : expression), semiOp());
  };

  CodeGen.prototype.reduceForInStatement = function (node, left, right, body) {
    return objectAssign(seq(t("for"), paren(seq(noIn(markContainsIn(left)), t("in"), right)), body), { endsWithMissingElse: body.endsWithMissingElse });
  };

  CodeGen.prototype.reduceForStatement = function (node, init, test, update, body) {
    return objectAssign(seq(t("for"), paren(seq(init ? noIn(markContainsIn(init)) : empty(), semi(), test || empty(), semi(), update || empty())), body), {
      endsWithMissingElse: body.endsWithMissingElse
    });
  };

  CodeGen.prototype.reduceIfStatement = function (node, test, consequent, alternate) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = brace(consequent);
    }
    return objectAssign(seq(t("if"), paren(test), consequent, alternate ? seq(t("else"), alternate) : empty()), { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
  };

  CodeGen.prototype.reduceLabeledStatement = function (node, label, body) {
    return objectAssign(seq(label, t(":"), body), { endsWithMissingElse: body.endsWithMissingElse });
  };

  CodeGen.prototype.reduceReturnStatement = function (node, argument) {
    return seq(t("return"), argument || empty(), semiOp());
  };

  CodeGen.prototype.reduceSwitchCase = function (node, test, consequent) {
    return seq(t("case"), test, t(":"), seq.apply(null, _toArray(consequent)));
  };

  CodeGen.prototype.reduceSwitchDefault = function (node, consequent) {
    return seq(t("default"), t(":"), seq.apply(null, _toArray(consequent)));
  };

  CodeGen.prototype.reduceSwitchStatement = function (node, discriminant, cases) {
    return seq(t("switch"), paren(discriminant), brace(seq.apply(null, _toArray(cases))));
  };

  CodeGen.prototype.reduceSwitchStatementWithDefault = function (node, discriminant, cases, defaultCase, postDefaultCases) {
    return seq(t("switch"), paren(discriminant), brace(seq.apply(null, _toArray(cases).concat([defaultCase], _toArray(postDefaultCases)))));
  };

  CodeGen.prototype.reduceThrowStatement = function (node, argument) {
    return seq(t("throw"), argument, semiOp());
  };

  CodeGen.prototype.reduceTryCatchStatement = function (node, block, catchClause) {
    return seq(t("try"), block, catchClause);
  };

  CodeGen.prototype.reduceTryFinallyStatement = function (node, block, catchClause, finalizer) {
    return seq(t("try"), block, catchClause || empty(), t("finally"), finalizer);
  };

  CodeGen.prototype.reduceVariableDeclarationStatement = function (node, declaration) {
    return seq(declaration, semiOp());
  };

  CodeGen.prototype.reduceVariableDeclaration = function (node, declarators) {
    return seq(t(node.kind), commaSep(declarators));
  };

  CodeGen.prototype.reduceWhileStatement = function (node, test, body) {
    return objectAssign(seq(t("while"), paren(test), body), { endsWithMissingElse: body.endsWithMissingElse });
  };

  CodeGen.prototype.reduceWithStatement = function (node, object, body) {
    return objectAssign(seq(t("with"), paren(object), body), { endsWithMissingElse: body.endsWithMissingElse });
  };

  CodeGen.prototype.reduceDataProperty = function (node, key, value) {
    return seq(key, t(":"), getAssignmentExpr(value));
  };

  CodeGen.prototype.reduceGetter = function (node, key, body) {
    return seq(t("get"), key, paren(empty()), brace(body));
  };

  CodeGen.prototype.reduceSetter = function (node, key, parameter, body) {
    return seq(t("set"), key, paren(parameter), brace(body));
  };

  CodeGen.prototype.reducePropertyName = function (node) {
    if (node.kind == "number" || node.kind == "identifier") {
      return t(node.value.toString());
    }
    return t(Utils.escapeStringLiteral(node.value));
  };

  CodeGen.prototype.reduceFunctionBody = function (node, directives, sourceElements) {
    if (sourceElements.length) {
      sourceElements[0] = parenToAvoidBeingDirective(node.statements[0], sourceElements[0]);
    }
    return seq.apply(null, _toArray(directives).concat(_toArray(sourceElements)));
  };

  CodeGen.prototype.reduceVariableDeclarator = function (node, id, init) {
    var containsIn = init && init.containsIn && !init.containsGroup;
    if (init) {
      if (init.containsGroup) {
        init = paren(init);
      } else {
        init = markContainsIn(init);
      }
    }
    return objectAssign(new Init(id, init), { containsIn: containsIn });
  };

  CodeGen.prototype.reduceBlock = function (node, statements) {
    return brace(seq.apply(null, _toArray(statements)));
  };

  return CodeGen;
})(Reducer);

var INSTANCE = new CodeGen();