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
//# sourceMappingURL=data:application/json;base64,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QUM7S0FDdkY7QUFDRCxXQUFPLEdBQUcsc0JBQUksVUFBVSxrQkFBSyxjQUFjLEdBQUMsQ0FBQztHQUM5Qzs7QUEvU0csU0FBTyxXQWlUWCx3QkFBd0IsR0FBQSxVQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQ3ZDLFFBQUksVUFBVSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUNoRSxRQUFJLElBQUksRUFBRTtBQUNSLFVBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN0QixZQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3BCLE1BQU07QUFDTCxZQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQzdCO0tBQ0Y7QUFDRCxXQUFPLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBQyxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUMsQ0FBQztHQUN2RDs7QUEzVEcsU0FBTyxXQTZUWCxXQUFXLEdBQUEsVUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQzVCLFdBQU8sS0FBSyxDQUFDLEdBQUcsc0JBQUksVUFBVSxFQUFDLENBQUMsQ0FBQztHQUNsQzs7U0EvVEcsT0FBTztHQUFTLE9BQU87O0FBa1U3QixJQUFNLFFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBQSxDQUFDIiwiZmlsZSI6InNyYy9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZWR1Y2UsIHtSZWR1Y2VyfSBmcm9tIFwic2hpZnQtcmVkdWNlclwiO1xuaW1wb3J0ICogYXMgb2JqZWN0QXNzaWduIGZyb20gXCJvYmplY3QtYXNzaWduXCI7XG5pbXBvcnQge1Rva2VuU3RyZWFtfSBmcm9tIFwiLi90b2tlbl9zdHJlYW1cIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29kZUdlbihzY3JpcHQpIHtcbiAgbGV0IHRzID0gbmV3IFRva2VuU3RyZWFtKCk7XG4gIGxldCByZXAgPSByZWR1Y2UoSU5TVEFOQ0UsIHNjcmlwdCk7XG4gIHJlcC5lbWl0KHRzKTtcbiAgcmV0dXJuIHRzLnJlc3VsdDtcbn1cblxuY29uc3QgUHJlY2VkZW5jZSA9IHtcbiAgU2VxdWVuY2U6IDAsXG4gIFlpZWxkOiAxLFxuICBBc3NpZ25tZW50OiAxLFxuICBDb25kaXRpb25hbDogMixcbiAgQXJyb3dGdW5jdGlvbjogMixcbiAgTG9naWNhbE9SOiAzLFxuICBMb2dpY2FsQU5EOiA0LFxuICBCaXR3aXNlT1I6IDUsXG4gIEJpdHdpc2VYT1I6IDYsXG4gIEJpdHdpc2VBTkQ6IDcsXG4gIEVxdWFsaXR5OiA4LFxuICBSZWxhdGlvbmFsOiA5LFxuICBCaXR3aXNlU0hJRlQ6IDEwLFxuICBBZGRpdGl2ZTogMTEsXG4gIE11bHRpcGxpY2F0aXZlOiAxMixcbiAgUHJlZml4OiAxMyxcbiAgUG9zdGZpeDogMTQsXG4gIE5ldzogMTUsXG4gIENhbGw6IDE2LFxuICBUYWdnZWRUZW1wbGF0ZTogMTcsXG4gIE1lbWJlcjogMTgsXG4gIFByaW1hcnk6IDE5XG59O1xuXG5jb25zdCBCaW5hcnlQcmVjZWRlbmNlID0ge1xuICBcIixcIjogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmVcbn07XG5cbmZ1bmN0aW9uIGdldFByZWNlZGVuY2Uobm9kZSkge1xuICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiRnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsTnVsbEV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLlByaW1hcnk7XG5cbiAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLkFzc2lnbm1lbnQ7XG5cbiAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5Db25kaXRpb25hbDtcblxuICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgc3dpdGNoIChub2RlLm9iamVjdC50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOlxuICAgICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgICAgcmV0dXJuIGdldFByZWNlZGVuY2Uobm9kZS5vYmplY3QpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHJldHVybiBQcmVjZWRlbmNlLk1lbWJlcjtcbiAgICAgIH1cblxuICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gQmluYXJ5UHJlY2VkZW5jZVtub2RlLm9wZXJhdG9yXTtcblxuICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuQ2FsbDtcbiAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIG5vZGUuYXJndW1lbnRzLmxlbmd0aCA9PT0gMCA/IFByZWNlZGVuY2UuTmV3IDogUHJlY2VkZW5jZS5NZW1iZXI7XG4gICAgY2FzZSBcIlBvc3RmaXhFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5Qb3N0Zml4O1xuICAgIGNhc2UgXCJQcmVmaXhFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5QcmVmaXg7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXNjYXBlU3RyaW5nTGl0ZXJhbChzdHJpbmdWYWx1ZSkge1xuICBsZXQgcmVzdWx0ID0gXCJcIjtcbiAgcmVzdWx0ICs9ICgnXCInKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJpbmdWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgIGxldCBjaCA9IHN0cmluZ1ZhbHVlLmNoYXJBdChpKTtcbiAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICBjYXNlIFwiXFxiXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxiXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdFwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcdFwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXG5cIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXG5cIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx1MDAwQlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcdlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUwMDBDXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxmXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcclwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcclwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXFwiXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxcXFwiXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcXFxcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXFxcXFxcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx1MjAyOFwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcdTIwMjhcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx1MjAyOVwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcdTIwMjlcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXN1bHQgKz0gY2g7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXN1bHQgKz0gJ1wiJztcbiAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBwKG5vZGUsIHByZWNlZGVuY2UsIGEpIHtcbiAgcmV0dXJuIGdldFByZWNlZGVuY2Uobm9kZSkgPCBwcmVjZWRlbmNlID8gcGFyZW4oYSkgOiBhO1xufVxuXG5jbGFzcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jb250YWluc0luID0gZmFsc2U7XG4gICAgdGhpcy5jb250YWluc0dyb3VwID0gZmFsc2U7XG4gICAgdGhpcy5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gZmFsc2U7XG4gICAgdGhpcy5lbmRzV2l0aE1pc3NpbmdFbHNlID0gZmFsc2U7XG4gIH1cblxuICBlbWl0KHN0cmVhbSwgbm9Jbikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxufVxuXG5jbGFzcyBFbXB0eSBleHRlbmRzIENvZGVSZXAge1xuICBlbWl0KCkge1xuICB9XG59XG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKHRva2VuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnRva2VuID0gdG9rZW47XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KHRoaXMudG9rZW4pO1xuICB9XG59XG5cbmNsYXNzIE51bWJlckNvZGVSZXAgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IobnVtYmVyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm51bWJlciA9IG51bWJlcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXROdW1iZXIodGhpcy5udW1iZXIpO1xuICB9XG59XG5cbmNsYXNzIFBhcmVuIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwiKFwiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIilcIik7XG4gIH1cbn1cblxuY2xhc3MgQnJhY2tldCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIltcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCJdXCIpO1xuICB9XG59XG5cbmNsYXNzIEJyYWNlIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwie1wiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIn1cIik7XG4gIH1cbn1cblxuY2xhc3MgTm9JbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCB0cnVlKTtcbiAgfVxufVxuXG5jbGFzcyBDb250YWluc0luIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgaWYgKG5vSW4pIHtcbiAgICAgIHRzLnB1dChcIihcIik7XG4gICAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgICAgdHMucHV0KFwiKVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VxIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGNoaWxkcmVuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNyID0+IGNyLmVtaXQodHMsIG5vSW4pKTtcbiAgfVxufVxuXG5jbGFzcyBTZW1pIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIjtcIik7XG4gIH1cbn1cblxuY2xhc3MgQ29tbWFTZXAgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoY2hpbGRyZW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuXG4gIGVtaXQodHMsIG5vSW4pIHtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChcbiAgICAgICAgKGNyKSA9PiB7XG4gICAgICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cy5wdXQoXCIsXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjci5lbWl0KHRzLCBub0luKTtcbiAgICAgICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgU2VtaU9wIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXRPcHRpb25hbFNlbWkoKTtcbiAgfVxufVxuXG5jbGFzcyBJbml0IGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGJpbmRpbmcsIGluaXQpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuYmluZGluZyA9IGJpbmRpbmc7XG4gICAgdGhpcy5pbml0ID0gaW5pdDtcbiAgfVxuXG4gIGVtaXQodHMsIG5vSW4pIHtcbiAgICB0aGlzLmJpbmRpbmcuZW1pdCh0cyk7XG4gICAgaWYgKHRoaXMuaW5pdCAhPSBudWxsKSB7XG4gICAgICB0cy5wdXQoXCI9XCIpO1xuICAgICAgdGhpcy5pbml0LmVtaXQodHMsIG5vSW4pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0KHRva2VuKSB7XG4gIHJldHVybiBuZXcgVG9rZW4odG9rZW4pO1xufVxuXG5mdW5jdGlvbiBwYXJlbihyZXApIHtcbiAgcmV0dXJuIG5ldyBQYXJlbihyZXApO1xufVxuXG5mdW5jdGlvbiBicmFja2V0KHJlcCkge1xuICByZXR1cm4gbmV3IEJyYWNrZXQocmVwKTtcbn1cblxuZnVuY3Rpb24gbm9JbihyZXApIHtcbiAgcmV0dXJuIG5ldyBOb0luKHJlcCk7XG59XG5cbmZ1bmN0aW9uIG1hcmtDb250YWluc0luKHN0YXRlKSB7XG4gIHJldHVybiBzdGF0ZS5jb250YWluc0luID8gbmV3IENvbnRhaW5zSW4oc3RhdGUpIDogc3RhdGU7XG59XG5cbmZ1bmN0aW9uIHNlcSguLi5yZXBzKSB7XG4gIHJldHVybiBuZXcgU2VxKHJlcHMpO1xufVxuXG5mdW5jdGlvbiBzZW1pKCkge1xuICByZXR1cm4gbmV3IFNlbWkoKTtcbn1cblxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBuZXcgRW1wdHkoKTtcbn1cblxuZnVuY3Rpb24gY29tbWFTZXAocGllY2VzKSB7XG4gIHJldHVybiBuZXcgQ29tbWFTZXAocGllY2VzKTtcbn1cblxuZnVuY3Rpb24gYnJhY2UocmVwKSB7XG4gIHJldHVybiBuZXcgQnJhY2UocmVwKTtcbn1cblxuZnVuY3Rpb24gc2VtaU9wKCkge1xuICByZXR1cm4gbmV3IFNlbWlPcCgpO1xufVxuXG5mdW5jdGlvbiBwYXJlblRvQXZvaWRCZWluZ0RpcmVjdGl2ZShlbGVtZW50LCBvcmlnaW5hbCkge1xuICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmIGVsZW1lbnQuZXhwcmVzc2lvbi50eXBlID09PSBcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCIpIHtcbiAgICByZXR1cm4gc2VxKHNlbWlPcCgpLCBvcmlnaW5hbCk7XG4gIH1cbiAgcmV0dXJuIG9yaWdpbmFsO1xufVxuXG5mdW5jdGlvbiBnZXRBc3NpZ25tZW50RXhwcihzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUgPyAoc3RhdGUuY29udGFpbnNHcm91cCA/IHBhcmVuKHN0YXRlKSA6IHN0YXRlKSA6IGVtcHR5KCk7XG59XG5cbmNsYXNzIENvZGVHZW4gZXh0ZW5kcyBSZWR1Y2VyIHtcblxuICByZWR1Y2VTY3JpcHQobm9kZSwgYm9keSkge1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcmVkdWNlSWRlbnRpZmllcihub2RlKSB7XG4gICAgcmV0dXJuIHQobm9kZS5uYW1lKTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXJFeHByZXNzaW9uKG5vZGUsIG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIHJlZHVjZVRoaXNFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChcInRoaXNcIik7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUudmFsdWUudG9TdHJpbmcoKSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoZXNjYXBlU3RyaW5nTGl0ZXJhbChub2RlLnZhbHVlKSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQobm9kZS52YWx1ZSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiBuZXcgTnVtYmVyQ29kZVJlcChub2RlLnZhbHVlKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxOdWxsRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoXCJudWxsXCIpO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUsIGlkLCBwYXJhbXMsIGJvZHkpIHtcbiAgICBjb25zdCBhcmdCb2R5ID0gc2VxKHBhcmVuKGNvbW1hU2VwKHBhcmFtcykpLCBicmFjZShib2R5KSk7XG4gICAgbGV0IHN0YXRlID0gc2VxKHQoXCJmdW5jdGlvblwiKSwgaWQgPyBzZXEoaWQsIGFyZ0JvZHkpIDogYXJnQm9keSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IHRydWU7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmVkdWNlU3RhdGljTWVtYmVyRXhwcmVzc2lvbihub2RlLCBvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgY29uc3Qgc3RhdGUgPSBzZXEocChub2RlLm9iamVjdCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb2JqZWN0KSwgdChcIi5cIiksIHByb3BlcnR5KTtcbiAgICBzdGF0ZS5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gb2JqZWN0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmVkdWNlQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKG5vZGUsIG9iamVjdCwgZXhwcmVzc2lvbikge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcShwKG5vZGUub2JqZWN0LCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBvYmplY3QpLCBicmFja2V0KGV4cHJlc3Npb24pKSxcbiAgICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IG9iamVjdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VPYmplY3RFeHByZXNzaW9uKG5vZGUsIHByb3BlcnRpZXMpIHtcbiAgICBsZXQgc3RhdGUgPSBicmFjZShjb21tYVNlcChwcm9wZXJ0aWVzKSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IHRydWU7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmVkdWNlQmluYXJ5RXhwcmVzc2lvbihub2RlLCBsZWZ0LCByaWdodCkge1xuICAgIGxldCBsZWZ0Q29kZSA9IGxlZnQ7XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBsZWZ0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgbGV0IGxlZnRDb250YWluc0luID0gbGVmdC5jb250YWluc0luO1xuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUubGVmdCkgPCBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICBsZWZ0Q29kZSA9IHBhcmVuKGxlZnRDb2RlKTtcbiAgICAgIHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBmYWxzZTtcbiAgICAgIGxlZnRDb250YWluc0luID0gZmFsc2U7XG4gICAgfVxuICAgIGxldCByaWdodENvZGUgPSByaWdodDtcbiAgICBsZXQgcmlnaHRDb250YWluc0luID0gcmlnaHQuY29udGFpbnNJbjtcbiAgICBpZiAoZ2V0UHJlY2VkZW5jZShub2RlLnJpZ2h0KSA8PSBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICByaWdodENvZGUgPSBwYXJlbihyaWdodENvZGUpO1xuICAgICAgcmlnaHRDb250YWluc0luID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgICAgc2VxKGxlZnRDb2RlLCB0KG5vZGUub3BlcmF0b3IpLCByaWdodENvZGUpLFxuICAgICAgICB7XG4gICAgICAgICAgY29udGFpbnNJbjogbGVmdENvbnRhaW5zSW4gfHwgcmlnaHRDb250YWluc0luIHx8IG5vZGUub3BlcmF0b3IgPT09IFwiaW5cIixcbiAgICAgICAgICBjb250YWluc0dyb3VwOiBub2RlLm9wZXJhdG9yID09IFwiLFwiLFxuICAgICAgICAgIHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHlcbiAgICAgICAgfSk7XG4gIH1cblxuICByZWR1Y2VBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlLCBiaW5kaW5nLCBleHByZXNzaW9uKSB7XG4gICAgbGV0IHJpZ2h0Q29kZSA9IGV4cHJlc3Npb247XG4gICAgbGV0IGNvbnRhaW5zSW4gPSBleHByZXNzaW9uLmNvbnRhaW5zSW47XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBiaW5kaW5nLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgaWYgKGdldFByZWNlZGVuY2Uobm9kZS5leHByZXNzaW9uKSA8IGdldFByZWNlZGVuY2Uobm9kZSkpIHtcbiAgICAgIHJpZ2h0Q29kZSA9IHBhcmVuKHJpZ2h0Q29kZSk7XG4gICAgICBjb250YWluc0luID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RBc3NpZ24oc2VxKGJpbmRpbmcsIHQobm9kZS5vcGVyYXRvciksIHJpZ2h0Q29kZSksIHtjb250YWluc0luLCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VBcnJheUV4cHJlc3Npb24obm9kZSwgZWxlbWVudHMpIHtcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnJhY2tldChlbXB0eSgpKTtcbiAgICB9XG5cbiAgICBsZXQgY29udGVudCA9IGNvbW1hU2VwKGVsZW1lbnRzLm1hcChnZXRBc3NpZ25tZW50RXhwcikpO1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPiAwICYmIGVsZW1lbnRzW2VsZW1lbnRzLmxlbmd0aCAtIDFdID09IG51bGwpIHtcbiAgICAgIGNvbnRlbnQgPSBzZXEoY29udGVudCwgdChcIixcIikpO1xuICAgIH1cbiAgICByZXR1cm4gYnJhY2tldChjb250ZW50KTtcbiAgfVxuXG4gIHJlZHVjZU5ld0V4cHJlc3Npb24obm9kZSwgY2FsbGVlLCBhcmdzKSB7XG4gICAgbGV0IGNhbGxlZVJlcCA9IGdldFByZWNlZGVuY2Uobm9kZS5jYWxsZWUpID09IFByZWNlZGVuY2UuQ2FsbCA/IHBhcmVuKGNhbGxlZSkgOlxuICAgICAgICBwKG5vZGUuY2FsbGVlLCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBjYWxsZWUpO1xuICAgIHJldHVybiBzZXEodChcIm5ld1wiKSwgY2FsbGVlUmVwLCBhcmdzLmxlbmd0aCA9PT0gMCA/IGVtcHR5KCkgOiBwYXJlbihjb21tYVNlcChhcmdzKSkpO1xuICB9XG5cbiAgcmVkdWNlQ2FsbEV4cHJlc3Npb24obm9kZSwgY2FsbGVlLCBhcmdzKSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgICAgc2VxKHAobm9kZS5jYWxsZWUsIGdldFByZWNlZGVuY2Uobm9kZSksIGNhbGxlZSksIHBhcmVuKGNvbW1hU2VwKGFyZ3MpKSksXG4gICAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBjYWxsZWUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlUG9zdGZpeEV4cHJlc3Npb24obm9kZSwgb3BlcmFuZCkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcShwKG5vZGUub3BlcmFuZCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb3BlcmFuZCksIHQobm9kZS5vcGVyYXRvcikpLFxuICAgICAgICB7c3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTogb3BlcmFuZC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VQcmVmaXhFeHByZXNzaW9uKG5vZGUsIG9wZXJhbmQpIHtcbiAgICByZXR1cm4gc2VxKHQobm9kZS5vcGVyYXRvciksIHAobm9kZS5vcGVyYW5kLCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBvcGVyYW5kKSk7XG4gIH1cblxuICByZWR1Y2VDb25kaXRpb25hbEV4cHJlc3Npb24obm9kZSwgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSB7XG4gICAgbGV0IGNvbnRhaW5zSW4gPSB0ZXN0LmNvbnRhaW5zSW4gfHwgYWx0ZXJuYXRlLmNvbnRhaW5zSW47XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0ZXN0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgICAgc2VxKFxuICAgICAgICAgICAgcChub2RlLnRlc3QsIFByZWNlZGVuY2UuTG9naWNhbE9SLCB0ZXN0KSwgdChcIj9cIiksXG4gICAgICAgICAgICBwKG5vZGUuY29uc2VxdWVudCwgUHJlY2VkZW5jZS5Bc3NpZ25tZW50LCBjb25zZXF1ZW50KSwgdChcIjpcIiksXG4gICAgICAgICAgICBwKG5vZGUuYWx0ZXJuYXRlLCBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsIGFsdGVybmF0ZSkpLCB7XG4gICAgICAgICAgY29udGFpbnNJbixcbiAgICAgICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlLCBpZCwgcGFyYW1zLCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZnVuY3Rpb25cIiksIGlkLCBwYXJlbihjb21tYVNlcChwYXJhbXMpKSwgYnJhY2UoYm9keSkpO1xuICB9XG5cbiAgcmVkdWNlVXNlU3RyaWN0RGlyZWN0aXZlKG5vZGUpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJcXFwidXNlIHN0cmljdFxcXCJcIiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVVua25vd25EaXJlY3RpdmUobm9kZSkge1xuICAgIHZhciBuYW1lID0gXCJ1c2Ugc3RyaWN0XCIgPT09IG5vZGUudmFsdWUgPyBcInVzZVxcXFx1MDAyMHN0cmljdFwiIDogbm9kZS52YWx1ZTtcbiAgICByZXR1cm4gc2VxKHQoXCJcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VCbG9ja1N0YXRlbWVudChub2RlLCBibG9jaykge1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuXG4gIHJlZHVjZUJyZWFrU3RhdGVtZW50KG5vZGUsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiYnJlYWtcIiksIGxhYmVsIHx8IGVtcHR5KCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZUNhdGNoQ2xhdXNlKG5vZGUsIHBhcmFtLCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiY2F0Y2hcIiksIHBhcmVuKHBhcmFtKSwgYm9keSk7XG4gIH1cblxuICByZWR1Y2VDb250aW51ZVN0YXRlbWVudChub2RlLCBsYWJlbCkge1xuICAgIHJldHVybiBzZXEodChcImNvbnRpbnVlXCIpLCBsYWJlbCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VEZWJ1Z2dlclN0YXRlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZGVidWdnZXJcIiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZURvV2hpbGVTdGF0ZW1lbnQobm9kZSwgYm9keSwgdGVzdCkge1xuICAgIHJldHVybiBzZXEodChcImRvXCIpLCBib2R5LCB0KFwid2hpbGVcIiksIHBhcmVuKHRlc3QpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VFbXB0eVN0YXRlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIHNlbWkoKTtcbiAgfVxuXG4gIHJlZHVjZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgZXhwcmVzc2lvbikge1xuICAgIHJldHVybiBzZXEoKGV4cHJlc3Npb24uc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA/IHBhcmVuKGV4cHJlc3Npb24pIDogZXhwcmVzc2lvbiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZUZvckluU3RhdGVtZW50KG5vZGUsIGxlZnQsIHJpZ2h0LCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgICAgc2VxKHQoXCJmb3JcIiksIHBhcmVuKHNlcShub0luKG1hcmtDb250YWluc0luKGxlZnQpKSwgdChcImluXCIpLCByaWdodCkpLCBib2R5KSxcbiAgICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlRm9yU3RhdGVtZW50KG5vZGUsIGluaXQsIHRlc3QsIHVwZGF0ZSwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcShcbiAgICAgICAgICAgIHQoXCJmb3JcIiksXG4gICAgICAgICAgICBwYXJlbihzZXEoaW5pdCA/IG5vSW4obWFya0NvbnRhaW5zSW4oaW5pdCkpIDogZW1wdHkoKSwgc2VtaSgpLCB0ZXN0IHx8IGVtcHR5KCksIHNlbWkoKSwgdXBkYXRlIHx8IGVtcHR5KCkpKSxcbiAgICAgICAgICAgIGJvZHkpLFxuICAgICAgICB7XG4gICAgICAgICAgZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlXG4gICAgICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlSWZTdGF0ZW1lbnQobm9kZSwgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSB7XG4gICAgaWYgKGFsdGVybmF0ZSAmJiBjb25zZXF1ZW50LmVuZHNXaXRoTWlzc2luZ0Vsc2UpIHtcbiAgICAgIGNvbnNlcXVlbnQgPSBicmFjZShjb25zZXF1ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgICAgc2VxKHQoXCJpZlwiKSwgcGFyZW4odGVzdCksIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSA/IHNlcSh0KFwiZWxzZVwiKSwgYWx0ZXJuYXRlKSA6IGVtcHR5KCkpLFxuICAgICAgICB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYWx0ZXJuYXRlID8gYWx0ZXJuYXRlLmVuZHNXaXRoTWlzc2luZ0Vsc2UgOiB0cnVlfSk7XG4gIH1cblxuICByZWR1Y2VMYWJlbGVkU3RhdGVtZW50KG5vZGUsIGxhYmVsLCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihzZXEobGFiZWwsIHQoXCI6XCIpLCBib2R5KSwge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlUmV0dXJuU3RhdGVtZW50KG5vZGUsIGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwicmV0dXJuXCIpLCBhcmd1bWVudCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hDYXNlKG5vZGUsIHRlc3QsIGNvbnNlcXVlbnQpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJjYXNlXCIpLCB0ZXN0LCB0KFwiOlwiKSwgc2VxKC4uLmNvbnNlcXVlbnQpKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaERlZmF1bHQobm9kZSwgY29uc2VxdWVudCkge1xuICAgIHJldHVybiBzZXEodChcImRlZmF1bHRcIiksIHQoXCI6XCIpLCBzZXEoLi4uY29uc2VxdWVudCkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50KG5vZGUsIGRpc2NyaW1pbmFudCwgY2FzZXMpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJzd2l0Y2hcIiksIHBhcmVuKGRpc2NyaW1pbmFudCksIGJyYWNlKHNlcSguLi5jYXNlcykpKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0KG5vZGUsIGRpc2NyaW1pbmFudCwgY2FzZXMsIGRlZmF1bHRDYXNlLCBwb3N0RGVmYXVsdENhc2VzKSB7XG4gICAgcmV0dXJuIHNlcShcbiAgICAgICAgdChcInN3aXRjaFwiKSxcbiAgICAgICAgcGFyZW4oZGlzY3JpbWluYW50KSxcbiAgICAgICAgYnJhY2Uoc2VxKC4uLmNhc2VzLCBkZWZhdWx0Q2FzZSwgLi4ucG9zdERlZmF1bHRDYXNlcykpKTtcbiAgfVxuXG4gIHJlZHVjZVRocm93U3RhdGVtZW50KG5vZGUsIGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidGhyb3dcIiksIGFyZ3VtZW50LCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VUcnlDYXRjaFN0YXRlbWVudChub2RlLCBibG9jaywgY2F0Y2hDbGF1c2UpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJ0cnlcIiksIGJsb2NrLCBjYXRjaENsYXVzZSk7XG4gIH1cblxuICByZWR1Y2VUcnlGaW5hbGx5U3RhdGVtZW50KG5vZGUsIGJsb2NrLCBjYXRjaENsYXVzZSwgZmluYWxpemVyKSB7XG4gICAgcmV0dXJuIHNlcShcbiAgICAgICAgdChcInRyeVwiKSxcbiAgICAgICAgYmxvY2ssXG4gICAgICAgIGNhdGNoQ2xhdXNlIHx8IGVtcHR5KCksXG4gICAgICAgIHQoXCJmaW5hbGx5XCIpLFxuICAgICAgICBmaW5hbGl6ZXIpO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChub2RlLCBkZWNsYXJhdGlvbikge1xuICAgIHJldHVybiBzZXEoZGVjbGFyYXRpb24sIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSwgZGVjbGFyYXRvcnMpIHtcbiAgICByZXR1cm4gc2VxKHQobm9kZS5raW5kKSwgY29tbWFTZXAoZGVjbGFyYXRvcnMpKTtcbiAgfVxuXG4gIHJlZHVjZVdoaWxlU3RhdGVtZW50KG5vZGUsIHRlc3QsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcSh0KFwid2hpbGVcIiksIHBhcmVuKHRlc3QpLCBib2R5KSwge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlV2l0aFN0YXRlbWVudChub2RlLCBvYmplY3QsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgICBzZXEodChcIndpdGhcIiksIHBhcmVuKG9iamVjdCksIGJvZHkpLFxuICAgICAgICB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlfSk7XG4gIH1cblxuICByZWR1Y2VEYXRhUHJvcGVydHkobm9kZSwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBzZXEoa2V5LCB0KFwiOlwiKSwgZ2V0QXNzaWdubWVudEV4cHIodmFsdWUpKTtcbiAgfVxuXG4gIHJlZHVjZUdldHRlcihub2RlLCBrZXksIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJnZXRcIiksIGtleSwgcGFyZW4oZW1wdHkoKSksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZVNldHRlcihub2RlLCBrZXksIHBhcmFtZXRlciwgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcInNldFwiKSwga2V5LCBwYXJlbihwYXJhbWV0ZXIpLCBicmFjZShib2R5KSk7XG4gIH1cblxuICByZWR1Y2VQcm9wZXJ0eU5hbWUobm9kZSkge1xuICAgIGlmIChub2RlLmtpbmQgPT0gXCJudW1iZXJcIiB8fCBub2RlLmtpbmQgPT0gXCJpZGVudGlmaWVyXCIpIHtcbiAgICAgIHJldHVybiB0KG5vZGUudmFsdWUudG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIHJldHVybiB0KFV0aWxzLmVzY2FwZVN0cmluZ0xpdGVyYWwobm9kZS52YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25Cb2R5KG5vZGUsIGRpcmVjdGl2ZXMsIHNvdXJjZUVsZW1lbnRzKSB7XG4gICAgaWYgKHNvdXJjZUVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgc291cmNlRWxlbWVudHNbMF0gPSBwYXJlblRvQXZvaWRCZWluZ0RpcmVjdGl2ZShub2RlLnN0YXRlbWVudHNbMF0sIHNvdXJjZUVsZW1lbnRzWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcSguLi5kaXJlY3RpdmVzLCAuLi5zb3VyY2VFbGVtZW50cyk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0b3Iobm9kZSwgaWQsIGluaXQpIHtcbiAgICBsZXQgY29udGFpbnNJbiA9IGluaXQgJiYgaW5pdC5jb250YWluc0luICYmICFpbml0LmNvbnRhaW5zR3JvdXA7XG4gICAgaWYgKGluaXQpIHtcbiAgICAgIGlmIChpbml0LmNvbnRhaW5zR3JvdXApIHtcbiAgICAgICAgaW5pdCA9IHBhcmVuKGluaXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5pdCA9IG1hcmtDb250YWluc0luKGluaXQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKG5ldyBJbml0KGlkLCBpbml0KSwge2NvbnRhaW5zSW59KTtcbiAgfVxuXG4gIHJlZHVjZUJsb2NrKG5vZGUsIHN0YXRlbWVudHMpIHtcbiAgICByZXR1cm4gYnJhY2Uoc2VxKC4uLnN0YXRlbWVudHMpKTtcbiAgfVxufVxuXG5jb25zdCBJTlNUQU5DRSA9IG5ldyBDb2RlR2VuO1xuIl19