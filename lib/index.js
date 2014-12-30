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
    return seq(paren(original.children[0]), semiOp());
  }
  return original;
}

function getAssignmentExpr(state) {
  return state ? (state.containsGroup ? paren(state) : state) : empty();
}

var CodeGen = (function () {
  var CodeGen = function CodeGen() {};

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

  CodeGen.prototype.reduceBlock = function (node, statements) {
    return brace(seq.apply(null, _toArray(statements)));
  };

  CodeGen.prototype.reduceBlockStatement = function (node, block) {
    return block;
  };

  CodeGen.prototype.reduceBreakStatement = function (node, label) {
    return seq(t("break"), label || empty(), semiOp());
  };

  CodeGen.prototype.reduceCallExpression = function (node, callee, args) {
    return objectAssign(seq(p(node.callee, getPrecedence(node), callee), paren(commaSep(args))), { startsWithFunctionOrCurly: callee.startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reduceCatchClause = function (node, param, body) {
    return seq(t("catch"), paren(param), body);
  };

  CodeGen.prototype.reduceComputedMemberExpression = function (node, object, expression) {
    return objectAssign(seq(p(node.object, getPrecedence(node), object), bracket(expression)), { startsWithFunctionOrCurly: object.startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reduceConditionalExpression = function (node, test, consequent, alternate) {
    var containsIn = test.containsIn || alternate.containsIn;
    var startsWithFunctionOrCurly = test.startsWithFunctionOrCurly;
    return objectAssign(seq(p(node.test, Precedence.LogicalOR, test), t("?"), p(node.consequent, Precedence.Assignment, consequent), t(":"), p(node.alternate, Precedence.Assignment, alternate)), {
      containsIn: containsIn,
      startsWithFunctionOrCurly: startsWithFunctionOrCurly
    });
  };

  CodeGen.prototype.reduceContinueStatement = function (node, label) {
    return seq(t("continue"), label || empty(), semiOp());
  };

  CodeGen.prototype.reduceDataProperty = function (node, key, value) {
    return seq(key, t(":"), getAssignmentExpr(value));
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

  CodeGen.prototype.reduceFunctionBody = function (node, directives, sourceElements) {
    if (sourceElements.length) {
      sourceElements[0] = parenToAvoidBeingDirective(node.statements[0], sourceElements[0]);
    }
    return seq.apply(null, _toArray(directives).concat(_toArray(sourceElements)));
  };

  CodeGen.prototype.reduceFunctionDeclaration = function (node, id, params, body) {
    return seq(t("function"), id, paren(commaSep(params)), brace(body));
  };

  CodeGen.prototype.reduceFunctionExpression = function (node, id, params, body) {
    var argBody = seq(paren(commaSep(params)), brace(body));
    var state = seq(t("function"), id ? seq(id, argBody) : argBody);
    state.startsWithFunctionOrCurly = true;
    return state;
  };

  CodeGen.prototype.reduceGetter = function (node, key, body) {
    return seq(t("get"), key, paren(empty()), brace(body));
  };

  CodeGen.prototype.reduceIdentifier = function (node) {
    return t(node.name);
  };

  CodeGen.prototype.reduceIdentifierExpression = function (node, name) {
    return name;
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

  CodeGen.prototype.reduceLiteralBooleanExpression = function (node) {
    return t(node.value.toString());
  };

  CodeGen.prototype.reduceLiteralNullExpression = function (node) {
    return t("null");
  };

  CodeGen.prototype.reduceLiteralNumericExpression = function (node) {
    return new NumberCodeRep(node.value);
  };

  CodeGen.prototype.reduceLiteralRegExpExpression = function (node) {
    return t(node.value);
  };

  CodeGen.prototype.reduceLiteralStringExpression = function (node) {
    return t(escapeStringLiteral(node.value));
  };

  CodeGen.prototype.reduceNewExpression = function (node, callee, args) {
    var calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) : p(node.callee, getPrecedence(node), callee);
    return seq(t("new"), calleeRep, args.length === 0 ? empty() : paren(commaSep(args)));
  };

  CodeGen.prototype.reduceObjectExpression = function (node, properties) {
    var state = brace(commaSep(properties));
    state.startsWithFunctionOrCurly = true;
    return state;
  };

  CodeGen.prototype.reducePostfixExpression = function (node, operand) {
    return objectAssign(seq(p(node.operand, getPrecedence(node), operand), t(node.operator)), { startsWithFunctionOrCurly: operand.startsWithFunctionOrCurly });
  };

  CodeGen.prototype.reducePrefixExpression = function (node, operand) {
    return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
  };

  CodeGen.prototype.reducePropertyName = function (node) {
    if (node.kind == "number" || node.kind == "identifier") {
      return t(node.value.toString());
    }
    return t(Utils.escapeStringLiteral(node.value));
  };

  CodeGen.prototype.reduceReturnStatement = function (node, argument) {
    return seq(t("return"), argument || empty(), semiOp());
  };

  CodeGen.prototype.reduceScript = function (node, body) {
    return body;
  };

  CodeGen.prototype.reduceSetter = function (node, key, parameter, body) {
    return seq(t("set"), key, paren(parameter), brace(body));
  };

  CodeGen.prototype.reduceStaticMemberExpression = function (node, object, property) {
    var state = seq(p(node.object, getPrecedence(node), object), t("."), property);
    state.startsWithFunctionOrCurly = object.startsWithFunctionOrCurly;
    return state;
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

  CodeGen.prototype.reduceThisExpression = function (node) {
    return t("this");
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

  CodeGen.prototype.reduceUnknownDirective = function (node) {
    var name = "use strict" === node.value ? "use\\u0020strict" : node.value;
    return seq(t("\"" + name + "\""), semiOp());
  };

  CodeGen.prototype.reduceUseStrictDirective = function (node) {
    return seq(t("\"use strict\""), semiOp());
  };

  CodeGen.prototype.reduceVariableDeclaration = function (node, declarators) {
    return seq(t(node.kind), commaSep(declarators));
  };

  CodeGen.prototype.reduceVariableDeclarationStatement = function (node, declaration) {
    return seq(declaration, semiOp());
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

  CodeGen.prototype.reduceWhileStatement = function (node, test, body) {
    return objectAssign(seq(t("while"), paren(test), body), { endsWithMissingElse: body.endsWithMissingElse });
  };

  CodeGen.prototype.reduceWithStatement = function (node, object, body) {
    return objectAssign(seq(t("with"), paren(object), body), { endsWithMissingElse: body.endsWithMissingElse });
  };

  return CodeGen;
})();

var INSTANCE = new CodeGen();
//# sourceMappingURL=data:application/json;base64,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QUMsQ0FBQztPQUM3QjtLQUNGO0FBQ0QsV0FBTyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUMsVUFBVSxFQUFWLFVBQVUsRUFBQyxDQUFDLENBQUM7R0FDdkQ7O0FBL1NHLFNBQU8sV0FpVFgsb0JBQW9CLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtBQUNyQyxXQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBQyxDQUFDLENBQUM7R0FDMUc7O0FBblRHLFNBQU8sV0FxVFgsbUJBQW1CLEdBQUEsVUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUN0QyxXQUFPLFlBQVksQ0FDakIsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQ25DLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFDLENBQUMsQ0FBQztHQUNwRDs7U0F6VEcsT0FBTzs7O0FBNFRiLElBQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFBLENBQUMiLCJmaWxlIjoic3JjL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJlZHVjZSBmcm9tIFwic2hpZnQtcmVkdWNlclwiO1xuaW1wb3J0ICogYXMgb2JqZWN0QXNzaWduIGZyb20gXCJvYmplY3QtYXNzaWduXCI7XG5pbXBvcnQge1Rva2VuU3RyZWFtfSBmcm9tIFwiLi90b2tlbl9zdHJlYW1cIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29kZUdlbihzY3JpcHQpIHtcbiAgbGV0IHRzID0gbmV3IFRva2VuU3RyZWFtO1xuICBsZXQgcmVwID0gcmVkdWNlKElOU1RBTkNFLCBzY3JpcHQpO1xuICByZXAuZW1pdCh0cyk7XG4gIHJldHVybiB0cy5yZXN1bHQ7XG59XG5cbmNvbnN0IFByZWNlZGVuY2UgPSB7XG4gIFNlcXVlbmNlOiAwLFxuICBZaWVsZDogMSxcbiAgQXNzaWdubWVudDogMSxcbiAgQ29uZGl0aW9uYWw6IDIsXG4gIEFycm93RnVuY3Rpb246IDIsXG4gIExvZ2ljYWxPUjogMyxcbiAgTG9naWNhbEFORDogNCxcbiAgQml0d2lzZU9SOiA1LFxuICBCaXR3aXNlWE9SOiA2LFxuICBCaXR3aXNlQU5EOiA3LFxuICBFcXVhbGl0eTogOCxcbiAgUmVsYXRpb25hbDogOSxcbiAgQml0d2lzZVNISUZUOiAxMCxcbiAgQWRkaXRpdmU6IDExLFxuICBNdWx0aXBsaWNhdGl2ZTogMTIsXG4gIFByZWZpeDogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBOZXc6IDE1LFxuICBDYWxsOiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCIsXCI6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gIFwifHxcIjogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gIFwiJiZcIjogUHJlY2VkZW5jZS5Mb2dpY2FsQU5ELFxuICBcInxcIjogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gIFwiXlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VYT1IsXG4gIFwiJlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VBTkQsXG4gIFwiPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIj09PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIjxcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw9XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluc3RhbmNlb2ZcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw8XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCIrXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiLVwiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIipcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIlXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiL1wiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlXG59O1xuXG5mdW5jdGlvbiBnZXRQcmVjZWRlbmNlKG5vZGUpIHtcbiAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbE51bGxFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsUmVnRXhwRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5QcmltYXJ5O1xuXG4gICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5Bc3NpZ25tZW50O1xuXG4gICAgY2FzZSBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuQ29uZGl0aW9uYWw7XG5cbiAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIHN3aXRjaCAobm9kZS5vYmplY3QudHlwZSkge1xuICAgICAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICAgIHJldHVybiBnZXRQcmVjZWRlbmNlKG5vZGUub2JqZWN0KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gUHJlY2VkZW5jZS5NZW1iZXI7XG4gICAgICB9XG5cbiAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIEJpbmFyeVByZWNlZGVuY2Vbbm9kZS5vcGVyYXRvcl07XG5cbiAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLkNhbGw7XG4gICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBub2RlLmFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyBQcmVjZWRlbmNlLk5ldyA6IFByZWNlZGVuY2UuTWVtYmVyO1xuICAgIGNhc2UgXCJQb3N0Zml4RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUG9zdGZpeDtcbiAgICBjYXNlIFwiUHJlZml4RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUHJlZml4O1xuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZ0xpdGVyYWwoc3RyaW5nVmFsdWUpIHtcbiAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gIHJlc3VsdCArPSAoJ1wiJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaW5nVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2ggPSBzdHJpbmdWYWx1ZS5jaGFyQXQoaSk7XG4gICAgc3dpdGNoIChjaCkge1xuICAgICAgY2FzZSBcIlxcYlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcYlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHRcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHRcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxuXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxuXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTAwMEJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHZcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx1MDAwQ1wiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcZlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxcIlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcXFxcIlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxcXFxcXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTIwMjhcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHUyMDI4XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTIwMjlcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHUyMDI5XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmVzdWx0ICs9IGNoO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmVzdWx0ICs9ICdcIic7XG4gIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gcChub2RlLCBwcmVjZWRlbmNlLCBhKSB7XG4gIHJldHVybiBnZXRQcmVjZWRlbmNlKG5vZGUpIDwgcHJlY2VkZW5jZSA/IHBhcmVuKGEpIDogYTtcbn1cblxuY2xhc3MgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29udGFpbnNJbiA9IGZhbHNlO1xuICAgIHRoaXMuY29udGFpbnNHcm91cCA9IGZhbHNlO1xuICAgIHRoaXMuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGZhbHNlO1xuICAgIHRoaXMuZW5kc1dpdGhNaXNzaW5nRWxzZSA9IGZhbHNlO1xuICB9XG5cbiAgZW1pdChzdHJlYW0sIG5vSW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbn1cblxuY2xhc3MgRW1wdHkgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgZW1pdCgpIHt9XG59XG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKHRva2VuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnRva2VuID0gdG9rZW47XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KHRoaXMudG9rZW4pO1xuICB9XG59XG5cbmNsYXNzIE51bWJlckNvZGVSZXAgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IobnVtYmVyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm51bWJlciA9IG51bWJlcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXROdW1iZXIodGhpcy5udW1iZXIpO1xuICB9XG59XG5cbmNsYXNzIFBhcmVuIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwiKFwiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIilcIik7XG4gIH1cbn1cblxuY2xhc3MgQnJhY2tldCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIltcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCJdXCIpO1xuICB9XG59XG5cbmNsYXNzIEJyYWNlIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwie1wiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIn1cIik7XG4gIH1cbn1cblxuY2xhc3MgTm9JbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCB0cnVlKTtcbiAgfVxufVxuXG5jbGFzcyBDb250YWluc0luIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgaWYgKG5vSW4pIHtcbiAgICAgIHRzLnB1dChcIihcIik7XG4gICAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgICAgdHMucHV0KFwiKVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VxIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGNoaWxkcmVuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNyID0+IGNyLmVtaXQodHMsIG5vSW4pKTtcbiAgfVxufVxuXG5jbGFzcyBTZW1pIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIjtcIik7XG4gIH1cbn1cblxuY2xhc3MgQ29tbWFTZXAgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoY2hpbGRyZW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuXG4gIGVtaXQodHMsIG5vSW4pIHtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCgoY3IpID0+IHtcbiAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHMucHV0KFwiLFwiKTtcbiAgICAgIH1cbiAgICAgIGNyLmVtaXQodHMsIG5vSW4pO1xuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIFNlbWlPcCBleHRlbmRzIENvZGVSZXAge1xuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0T3B0aW9uYWxTZW1pKCk7XG4gIH1cbn1cblxuY2xhc3MgSW5pdCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihiaW5kaW5nLCBpbml0KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmJpbmRpbmcgPSBiaW5kaW5nO1xuICAgIHRoaXMuaW5pdCA9IGluaXQ7XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdGhpcy5iaW5kaW5nLmVtaXQodHMpO1xuICAgIGlmICh0aGlzLmluaXQgIT0gbnVsbCkge1xuICAgICAgdHMucHV0KFwiPVwiKTtcbiAgICAgIHRoaXMuaW5pdC5lbWl0KHRzLCBub0luKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdCh0b2tlbikge1xuICByZXR1cm4gbmV3IFRva2VuKHRva2VuKTtcbn1cblxuZnVuY3Rpb24gcGFyZW4ocmVwKSB7XG4gIHJldHVybiBuZXcgUGFyZW4ocmVwKTtcbn1cblxuZnVuY3Rpb24gYnJhY2tldChyZXApIHtcbiAgcmV0dXJuIG5ldyBCcmFja2V0KHJlcCk7XG59XG5cbmZ1bmN0aW9uIG5vSW4ocmVwKSB7XG4gIHJldHVybiBuZXcgTm9JbihyZXApO1xufVxuXG5mdW5jdGlvbiBtYXJrQ29udGFpbnNJbihzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUuY29udGFpbnNJbiA/IG5ldyBDb250YWluc0luKHN0YXRlKSA6IHN0YXRlO1xufVxuXG5mdW5jdGlvbiBzZXEoLi4ucmVwcykge1xuICByZXR1cm4gbmV3IFNlcShyZXBzKTtcbn1cblxuZnVuY3Rpb24gc2VtaSgpIHtcbiAgcmV0dXJuIG5ldyBTZW1pO1xufVxuXG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgcmV0dXJuIG5ldyBFbXB0eTtcbn1cblxuZnVuY3Rpb24gY29tbWFTZXAocGllY2VzKSB7XG4gIHJldHVybiBuZXcgQ29tbWFTZXAocGllY2VzKTtcbn1cblxuZnVuY3Rpb24gYnJhY2UocmVwKSB7XG4gIHJldHVybiBuZXcgQnJhY2UocmVwKTtcbn1cblxuZnVuY3Rpb24gc2VtaU9wKCkge1xuICByZXR1cm4gbmV3IFNlbWlPcDtcbn1cblxuZnVuY3Rpb24gcGFyZW5Ub0F2b2lkQmVpbmdEaXJlY3RpdmUoZWxlbWVudCwgb3JpZ2luYWwpIHtcbiAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC50eXBlID09PSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiAmJiBlbGVtZW50LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgcmV0dXJuIHNlcShwYXJlbihvcmlnaW5hbC5jaGlsZHJlblswXSksIHNlbWlPcCgpKTtcbiAgfVxuICByZXR1cm4gb3JpZ2luYWw7XG59XG5cbmZ1bmN0aW9uIGdldEFzc2lnbm1lbnRFeHByKHN0YXRlKSB7XG4gIHJldHVybiBzdGF0ZSA/IChzdGF0ZS5jb250YWluc0dyb3VwID8gcGFyZW4oc3RhdGUpIDogc3RhdGUpIDogZW1wdHkoKTtcbn1cblxuY2xhc3MgQ29kZUdlbiB7XG5cbiAgcmVkdWNlQXJyYXlFeHByZXNzaW9uKG5vZGUsIGVsZW1lbnRzKSB7XG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNrZXQoZW1wdHkoKSk7XG4gICAgfVxuXG4gICAgbGV0IGNvbnRlbnQgPSBjb21tYVNlcChlbGVtZW50cy5tYXAoZ2V0QXNzaWdubWVudEV4cHIpKTtcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID4gMCAmJiBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXSA9PSBudWxsKSB7XG4gICAgICBjb250ZW50ID0gc2VxKGNvbnRlbnQsIHQoXCIsXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGJyYWNrZXQoY29udGVudCk7XG4gIH1cblxuICByZWR1Y2VBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlLCBiaW5kaW5nLCBleHByZXNzaW9uKSB7XG4gICAgbGV0IHJpZ2h0Q29kZSA9IGV4cHJlc3Npb247XG4gICAgbGV0IGNvbnRhaW5zSW4gPSBleHByZXNzaW9uLmNvbnRhaW5zSW47XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBiaW5kaW5nLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgaWYgKGdldFByZWNlZGVuY2Uobm9kZS5leHByZXNzaW9uKSA8IGdldFByZWNlZGVuY2Uobm9kZSkpIHtcbiAgICAgIHJpZ2h0Q29kZSA9IHBhcmVuKHJpZ2h0Q29kZSk7XG4gICAgICBjb250YWluc0luID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RBc3NpZ24oc2VxKGJpbmRpbmcsIHQobm9kZS5vcGVyYXRvciksIHJpZ2h0Q29kZSksIHtjb250YWluc0luLCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VCaW5hcnlFeHByZXNzaW9uKG5vZGUsIGxlZnQsIHJpZ2h0KSB7XG4gICAgbGV0IGxlZnRDb2RlID0gbGVmdDtcbiAgICBsZXQgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGxlZnQuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTtcbiAgICBsZXQgbGVmdENvbnRhaW5zSW4gPSBsZWZ0LmNvbnRhaW5zSW47XG4gICAgaWYgKGdldFByZWNlZGVuY2Uobm9kZS5sZWZ0KSA8IGdldFByZWNlZGVuY2Uobm9kZSkpIHtcbiAgICAgIGxlZnRDb2RlID0gcGFyZW4obGVmdENvZGUpO1xuICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGZhbHNlO1xuICAgICAgbGVmdENvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB9XG4gICAgbGV0IHJpZ2h0Q29kZSA9IHJpZ2h0O1xuICAgIGxldCByaWdodENvbnRhaW5zSW4gPSByaWdodC5jb250YWluc0luO1xuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUucmlnaHQpIDw9IGdldFByZWNlZGVuY2Uobm9kZSkpIHtcbiAgICAgIHJpZ2h0Q29kZSA9IHBhcmVuKHJpZ2h0Q29kZSk7XG4gICAgICByaWdodENvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShsZWZ0Q29kZSwgdChub2RlLm9wZXJhdG9yKSwgcmlnaHRDb2RlKSxcbiAgICAgIHtcbiAgICAgICAgY29udGFpbnNJbjogbGVmdENvbnRhaW5zSW4gfHwgcmlnaHRDb250YWluc0luIHx8IG5vZGUub3BlcmF0b3IgPT09IFwiaW5cIixcbiAgICAgICAgY29udGFpbnNHcm91cDogbm9kZS5vcGVyYXRvciA9PSBcIixcIixcbiAgICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseVxuICAgICAgfSk7XG4gIH1cblxuICByZWR1Y2VCbG9jayhub2RlLCBzdGF0ZW1lbnRzKSB7XG4gICAgcmV0dXJuIGJyYWNlKHNlcSguLi5zdGF0ZW1lbnRzKSk7XG4gIH1cblxuICByZWR1Y2VCbG9ja1N0YXRlbWVudChub2RlLCBibG9jaykge1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuXG4gIHJlZHVjZUJyZWFrU3RhdGVtZW50KG5vZGUsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiYnJlYWtcIiksIGxhYmVsIHx8IGVtcHR5KCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZUNhbGxFeHByZXNzaW9uKG5vZGUsIGNhbGxlZSwgYXJncykge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEocChub2RlLmNhbGxlZSwgZ2V0UHJlY2VkZW5jZShub2RlKSwgY2FsbGVlKSwgcGFyZW4oY29tbWFTZXAoYXJncykpKSxcbiAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBjYWxsZWUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlQ2F0Y2hDbGF1c2Uobm9kZSwgcGFyYW0sIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJjYXRjaFwiKSwgcGFyZW4ocGFyYW0pLCBib2R5KTtcbiAgfVxuXG4gIHJlZHVjZUNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihub2RlLCBvYmplY3QsIGV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHAobm9kZS5vYmplY3QsIGdldFByZWNlZGVuY2Uobm9kZSksIG9iamVjdCksIGJyYWNrZXQoZXhwcmVzc2lvbikpLFxuICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IG9iamVjdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VDb25kaXRpb25hbEV4cHJlc3Npb24obm9kZSwgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSB7XG4gICAgbGV0IGNvbnRhaW5zSW4gPSB0ZXN0LmNvbnRhaW5zSW4gfHwgYWx0ZXJuYXRlLmNvbnRhaW5zSW47XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0ZXN0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShcbiAgICAgICAgcChub2RlLnRlc3QsIFByZWNlZGVuY2UuTG9naWNhbE9SLCB0ZXN0KSwgdChcIj9cIiksXG4gICAgICAgIHAobm9kZS5jb25zZXF1ZW50LCBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsIGNvbnNlcXVlbnQpLCB0KFwiOlwiKSxcbiAgICAgICAgcChub2RlLmFsdGVybmF0ZSwgUHJlY2VkZW5jZS5Bc3NpZ25tZW50LCBhbHRlcm5hdGUpKSwge1xuICAgICAgICAgIGNvbnRhaW5zSW4sXG4gICAgICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseVxuICAgICAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUNvbnRpbnVlU3RhdGVtZW50KG5vZGUsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiY29udGludWVcIiksIGxhYmVsIHx8IGVtcHR5KCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZURhdGFQcm9wZXJ0eShub2RlLCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHNlcShrZXksIHQoXCI6XCIpLCBnZXRBc3NpZ25tZW50RXhwcih2YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlRGVidWdnZXJTdGF0ZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBzZXEodChcImRlYnVnZ2VyXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VEb1doaWxlU3RhdGVtZW50KG5vZGUsIGJvZHksIHRlc3QpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJkb1wiKSwgYm9keSwgdChcIndoaWxlXCIpLCBwYXJlbih0ZXN0KSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRW1wdHlTdGF0ZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBzZW1pKCk7XG4gIH1cblxuICByZWR1Y2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUsIGV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gc2VxKChleHByZXNzaW9uLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPyBwYXJlbihleHByZXNzaW9uKSA6IGV4cHJlc3Npb24pLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VGb3JJblN0YXRlbWVudChub2RlLCBsZWZ0LCByaWdodCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEodChcImZvclwiKSwgcGFyZW4oc2VxKG5vSW4obWFya0NvbnRhaW5zSW4obGVmdCkpLCB0KFwiaW5cIiksIHJpZ2h0KSksIGJvZHkpLFxuICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlRm9yU3RhdGVtZW50KG5vZGUsIGluaXQsIHRlc3QsIHVwZGF0ZSwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEoXG4gICAgICAgIHQoXCJmb3JcIiksXG4gICAgICAgIHBhcmVuKHNlcShpbml0ID8gbm9JbihtYXJrQ29udGFpbnNJbihpbml0KSkgOiBlbXB0eSgpLCBzZW1pKCksIHRlc3QgfHwgZW1wdHkoKSwgc2VtaSgpLCB1cGRhdGUgfHwgZW1wdHkoKSkpLFxuICAgICAgICBib2R5KSxcbiAgICAgICAge1xuICAgICAgICAgIGVuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZVxuICAgICAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uQm9keShub2RlLCBkaXJlY3RpdmVzLCBzb3VyY2VFbGVtZW50cykge1xuICAgIGlmIChzb3VyY2VFbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIHNvdXJjZUVsZW1lbnRzWzBdID0gcGFyZW5Ub0F2b2lkQmVpbmdEaXJlY3RpdmUobm9kZS5zdGF0ZW1lbnRzWzBdLCBzb3VyY2VFbGVtZW50c1swXSk7XG4gICAgfVxuICAgIHJldHVybiBzZXEoLi4uZGlyZWN0aXZlcywgLi4uc291cmNlRWxlbWVudHMpO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25EZWNsYXJhdGlvbihub2RlLCBpZCwgcGFyYW1zLCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZnVuY3Rpb25cIiksIGlkLCBwYXJlbihjb21tYVNlcChwYXJhbXMpKSwgYnJhY2UoYm9keSkpO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25FeHByZXNzaW9uKG5vZGUsIGlkLCBwYXJhbXMsIGJvZHkpIHtcbiAgICBjb25zdCBhcmdCb2R5ID0gc2VxKHBhcmVuKGNvbW1hU2VwKHBhcmFtcykpLCBicmFjZShib2R5KSk7XG4gICAgbGV0IHN0YXRlID0gc2VxKHQoXCJmdW5jdGlvblwiKSwgaWQgPyBzZXEoaWQsIGFyZ0JvZHkpIDogYXJnQm9keSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IHRydWU7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmVkdWNlR2V0dGVyKG5vZGUsIGtleSwgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcImdldFwiKSwga2V5LCBwYXJlbihlbXB0eSgpKSwgYnJhY2UoYm9keSkpO1xuICB9XG5cbiAgcmVkdWNlSWRlbnRpZmllcihub2RlKSB7XG4gICAgcmV0dXJuIHQobm9kZS5uYW1lKTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXJFeHByZXNzaW9uKG5vZGUsIG5hbWUpIHtcbiAgICByZXR1cm4gbmFtZTtcbiAgfVxuXG4gIHJlZHVjZUlmU3RhdGVtZW50KG5vZGUsIHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSkge1xuICAgIGlmIChhbHRlcm5hdGUgJiYgY29uc2VxdWVudC5lbmRzV2l0aE1pc3NpbmdFbHNlKSB7XG4gICAgICBjb25zZXF1ZW50ID0gYnJhY2UoY29uc2VxdWVudCk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEodChcImlmXCIpLCBwYXJlbih0ZXN0KSwgY29uc2VxdWVudCwgYWx0ZXJuYXRlID8gc2VxKHQoXCJlbHNlXCIpLCBhbHRlcm5hdGUpIDogZW1wdHkoKSksXG4gICAgICB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYWx0ZXJuYXRlID8gYWx0ZXJuYXRlLmVuZHNXaXRoTWlzc2luZ0Vsc2UgOiB0cnVlfSk7XG4gIH1cblxuICByZWR1Y2VMYWJlbGVkU3RhdGVtZW50KG5vZGUsIGxhYmVsLCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihzZXEobGFiZWwsIHQoXCI6XCIpLCBib2R5KSwge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChub2RlLnZhbHVlLnRvU3RyaW5nKCkpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbE51bGxFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChcIm51bGxcIik7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiBuZXcgTnVtYmVyQ29kZVJlcChub2RlLnZhbHVlKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChub2RlLnZhbHVlKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChlc2NhcGVTdHJpbmdMaXRlcmFsKG5vZGUudmFsdWUpKTtcbiAgfVxuXG4gIHJlZHVjZU5ld0V4cHJlc3Npb24obm9kZSwgY2FsbGVlLCBhcmdzKSB7XG4gICAgbGV0IGNhbGxlZVJlcCA9IGdldFByZWNlZGVuY2Uobm9kZS5jYWxsZWUpID09IFByZWNlZGVuY2UuQ2FsbCA/IHBhcmVuKGNhbGxlZSkgOlxuICAgICAgcChub2RlLmNhbGxlZSwgZ2V0UHJlY2VkZW5jZShub2RlKSwgY2FsbGVlKTtcbiAgICByZXR1cm4gc2VxKHQoXCJuZXdcIiksIGNhbGxlZVJlcCwgYXJncy5sZW5ndGggPT09IDAgPyBlbXB0eSgpIDogcGFyZW4oY29tbWFTZXAoYXJncykpKTtcbiAgfVxuXG4gIHJlZHVjZU9iamVjdEV4cHJlc3Npb24obm9kZSwgcHJvcGVydGllcykge1xuICAgIGxldCBzdGF0ZSA9IGJyYWNlKGNvbW1hU2VwKHByb3BlcnRpZXMpKTtcbiAgICBzdGF0ZS5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gdHJ1ZTtcbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICByZWR1Y2VQb3N0Zml4RXhwcmVzc2lvbihub2RlLCBvcGVyYW5kKSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShwKG5vZGUub3BlcmFuZCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb3BlcmFuZCksIHQobm9kZS5vcGVyYXRvcikpLFxuICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IG9wZXJhbmQuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlUHJlZml4RXhwcmVzc2lvbihub2RlLCBvcGVyYW5kKSB7XG4gICAgcmV0dXJuIHNlcSh0KG5vZGUub3BlcmF0b3IpLCBwKG5vZGUub3BlcmFuZCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb3BlcmFuZCkpO1xuICB9XG5cbiAgcmVkdWNlUHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgICBpZiAobm9kZS5raW5kID09IFwibnVtYmVyXCIgfHwgbm9kZS5raW5kID09IFwiaWRlbnRpZmllclwiKSB7XG4gICAgICByZXR1cm4gdChub2RlLnZhbHVlLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdChVdGlscy5lc2NhcGVTdHJpbmdMaXRlcmFsKG5vZGUudmFsdWUpKTtcbiAgfVxuXG4gIHJlZHVjZVJldHVyblN0YXRlbWVudChub2RlLCBhcmd1bWVudCkge1xuICAgIHJldHVybiBzZXEodChcInJldHVyblwiKSwgYXJndW1lbnQgfHwgZW1wdHkoKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlU2NyaXB0KG5vZGUsIGJvZHkpIHtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxuXG4gIHJlZHVjZVNldHRlcihub2RlLCBrZXksIHBhcmFtZXRlciwgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcInNldFwiKSwga2V5LCBwYXJlbihwYXJhbWV0ZXIpLCBicmFjZShib2R5KSk7XG4gIH1cblxuICByZWR1Y2VTdGF0aWNNZW1iZXJFeHByZXNzaW9uKG5vZGUsIG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHNlcShwKG5vZGUub2JqZWN0LCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBvYmplY3QpLCB0KFwiLlwiKSwgcHJvcGVydHkpO1xuICAgIHN0YXRlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBvYmplY3Quc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTtcbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hDYXNlKG5vZGUsIHRlc3QsIGNvbnNlcXVlbnQpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJjYXNlXCIpLCB0ZXN0LCB0KFwiOlwiKSwgc2VxKC4uLmNvbnNlcXVlbnQpKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaERlZmF1bHQobm9kZSwgY29uc2VxdWVudCkge1xuICAgIHJldHVybiBzZXEodChcImRlZmF1bHRcIiksIHQoXCI6XCIpLCBzZXEoLi4uY29uc2VxdWVudCkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50KG5vZGUsIGRpc2NyaW1pbmFudCwgY2FzZXMpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJzd2l0Y2hcIiksIHBhcmVuKGRpc2NyaW1pbmFudCksIGJyYWNlKHNlcSguLi5jYXNlcykpKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0KG5vZGUsIGRpc2NyaW1pbmFudCwgY2FzZXMsIGRlZmF1bHRDYXNlLCBwb3N0RGVmYXVsdENhc2VzKSB7XG4gICAgcmV0dXJuIHNlcShcbiAgICAgIHQoXCJzd2l0Y2hcIiksXG4gICAgICBwYXJlbihkaXNjcmltaW5hbnQpLFxuICAgICAgYnJhY2Uoc2VxKC4uLmNhc2VzLCBkZWZhdWx0Q2FzZSwgLi4ucG9zdERlZmF1bHRDYXNlcykpKTtcbiAgfVxuXG4gIHJlZHVjZVRoaXNFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChcInRoaXNcIik7XG4gIH1cblxuICByZWR1Y2VUaHJvd1N0YXRlbWVudChub2RlLCBhcmd1bWVudCkge1xuICAgIHJldHVybiBzZXEodChcInRocm93XCIpLCBhcmd1bWVudCwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlVHJ5Q2F0Y2hTdGF0ZW1lbnQobm9kZSwgYmxvY2ssIGNhdGNoQ2xhdXNlKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidHJ5XCIpLCBibG9jaywgY2F0Y2hDbGF1c2UpO1xuICB9XG5cbiAgcmVkdWNlVHJ5RmluYWxseVN0YXRlbWVudChub2RlLCBibG9jaywgY2F0Y2hDbGF1c2UsIGZpbmFsaXplcikge1xuICAgIHJldHVybiBzZXEodChcInRyeVwiKSwgYmxvY2ssIGNhdGNoQ2xhdXNlIHx8IGVtcHR5KCksIHQoXCJmaW5hbGx5XCIpLCBmaW5hbGl6ZXIpO1xuICB9XG5cbiAgcmVkdWNlVW5rbm93bkRpcmVjdGl2ZShub2RlKSB7XG4gICAgdmFyIG5hbWUgPSBcInVzZSBzdHJpY3RcIiA9PT0gbm9kZS52YWx1ZSA/IFwidXNlXFxcXHUwMDIwc3RyaWN0XCIgOiBub2RlLnZhbHVlO1xuICAgIHJldHVybiBzZXEodChcIlxcXCJcIiArIG5hbWUgKyBcIlxcXCJcIiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVVzZVN0cmljdERpcmVjdGl2ZShub2RlKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiXFxcInVzZSBzdHJpY3RcXFwiXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUsIGRlY2xhcmF0b3JzKSB7XG4gICAgcmV0dXJuIHNlcSh0KG5vZGUua2luZCksIGNvbW1hU2VwKGRlY2xhcmF0b3JzKSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KG5vZGUsIGRlY2xhcmF0aW9uKSB7XG4gICAgcmV0dXJuIHNlcShkZWNsYXJhdGlvbiwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdG9yKG5vZGUsIGlkLCBpbml0KSB7XG4gICAgbGV0IGNvbnRhaW5zSW4gPSBpbml0ICYmIGluaXQuY29udGFpbnNJbiAmJiAhaW5pdC5jb250YWluc0dyb3VwO1xuICAgIGlmIChpbml0KSB7XG4gICAgICBpZiAoaW5pdC5jb250YWluc0dyb3VwKSB7XG4gICAgICAgIGluaXQgPSBwYXJlbihpbml0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluaXQgPSBtYXJrQ29udGFpbnNJbihpbml0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihuZXcgSW5pdChpZCwgaW5pdCksIHtjb250YWluc0lufSk7XG4gIH1cblxuICByZWR1Y2VXaGlsZVN0YXRlbWVudChub2RlLCB0ZXN0LCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihzZXEodChcIndoaWxlXCIpLCBwYXJlbih0ZXN0KSwgYm9keSksIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZVdpdGhTdGF0ZW1lbnQobm9kZSwgb2JqZWN0LCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcSh0KFwid2l0aFwiKSwgcGFyZW4ob2JqZWN0KSwgYm9keSksXG4gICAgICB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlfSk7XG4gIH1cbn1cblxuY29uc3QgSU5TVEFOQ0UgPSBuZXcgQ29kZUdlbjtcbiJdfQ==