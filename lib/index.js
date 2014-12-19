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
})();

var INSTANCE = new CodeGen();
//# sourceMappingURL=data:application/json;base64,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QUFJLFVBQVUsa0JBQUssY0FBYyxHQUFDLENBQUM7R0FDOUM7O0FBL1NHLFNBQU8sV0FpVFgsd0JBQXdCLEdBQUEsVUFBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtBQUN2QyxRQUFJLFVBQVUsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDaEUsUUFBSSxJQUFJLEVBQUU7QUFDUixVQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDdEIsWUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNwQixNQUFNO0FBQ0wsWUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUM3QjtLQUNGO0FBQ0QsV0FBTyxZQUFZLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUMsVUFBVSxFQUFWLFVBQVUsRUFBQyxDQUFDLENBQUM7R0FDdkQ7O0FBM1RHLFNBQU8sV0E2VFgsV0FBVyxHQUFBLFVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUM1QixXQUFPLEtBQUssQ0FBQyxHQUFHLHNCQUFJLFVBQVUsRUFBQyxDQUFDLENBQUM7R0FDbEM7O1NBL1RHLE9BQU87OztBQWtVYixJQUFNLFFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBQSxDQUFDIiwiZmlsZSI6InNyYy9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZWR1Y2UgZnJvbSBcInNoaWZ0LXJlZHVjZXJcIjtcbmltcG9ydCAqIGFzIG9iamVjdEFzc2lnbiBmcm9tIFwib2JqZWN0LWFzc2lnblwiO1xuaW1wb3J0IHtUb2tlblN0cmVhbX0gZnJvbSBcIi4vdG9rZW5fc3RyZWFtXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvZGVHZW4oc2NyaXB0KSB7XG4gIGxldCB0cyA9IG5ldyBUb2tlblN0cmVhbSgpO1xuICBsZXQgcmVwID0gcmVkdWNlKElOU1RBTkNFLCBzY3JpcHQpO1xuICByZXAuZW1pdCh0cyk7XG4gIHJldHVybiB0cy5yZXN1bHQ7XG59XG5cbmNvbnN0IFByZWNlZGVuY2UgPSB7XG4gIFNlcXVlbmNlOiAwLFxuICBZaWVsZDogMSxcbiAgQXNzaWdubWVudDogMSxcbiAgQ29uZGl0aW9uYWw6IDIsXG4gIEFycm93RnVuY3Rpb246IDIsXG4gIExvZ2ljYWxPUjogMyxcbiAgTG9naWNhbEFORDogNCxcbiAgQml0d2lzZU9SOiA1LFxuICBCaXR3aXNlWE9SOiA2LFxuICBCaXR3aXNlQU5EOiA3LFxuICBFcXVhbGl0eTogOCxcbiAgUmVsYXRpb25hbDogOSxcbiAgQml0d2lzZVNISUZUOiAxMCxcbiAgQWRkaXRpdmU6IDExLFxuICBNdWx0aXBsaWNhdGl2ZTogMTIsXG4gIFByZWZpeDogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBOZXc6IDE1LFxuICBDYWxsOiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCIsXCI6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gIFwifHxcIjogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gIFwiJiZcIjogUHJlY2VkZW5jZS5Mb2dpY2FsQU5ELFxuICBcInxcIjogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gIFwiXlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VYT1IsXG4gIFwiJlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VBTkQsXG4gIFwiPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIj09PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIjxcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw9XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluc3RhbmNlb2ZcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw8XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCIrXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiLVwiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIipcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIlXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiL1wiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlXG59O1xuXG5mdW5jdGlvbiBnZXRQcmVjZWRlbmNlKG5vZGUpIHtcbiAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbE51bGxFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsUmVnRXhwRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5QcmltYXJ5O1xuXG4gICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5Bc3NpZ25tZW50O1xuXG4gICAgY2FzZSBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuQ29uZGl0aW9uYWw7XG5cbiAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIHN3aXRjaCAobm9kZS5vYmplY3QudHlwZSkge1xuICAgICAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICAgIHJldHVybiBnZXRQcmVjZWRlbmNlKG5vZGUub2JqZWN0KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gUHJlY2VkZW5jZS5NZW1iZXI7XG4gICAgICB9XG5cbiAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIEJpbmFyeVByZWNlZGVuY2Vbbm9kZS5vcGVyYXRvcl07XG5cbiAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLkNhbGw7XG4gICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBub2RlLmFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyBQcmVjZWRlbmNlLk5ldyA6IFByZWNlZGVuY2UuTWVtYmVyO1xuICAgIGNhc2UgXCJQb3N0Zml4RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUG9zdGZpeDtcbiAgICBjYXNlIFwiUHJlZml4RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUHJlZml4O1xuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZ0xpdGVyYWwoc3RyaW5nVmFsdWUpIHtcbiAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gIHJlc3VsdCArPSAoJ1wiJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaW5nVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2ggPSBzdHJpbmdWYWx1ZS5jaGFyQXQoaSk7XG4gICAgc3dpdGNoIChjaCkge1xuICAgICAgY2FzZSBcIlxcYlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcYlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHRcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHRcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxuXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxuXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTAwMEJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHZcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx1MDAwQ1wiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcZlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxcIlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcXFxcIlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxcXFxcXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTIwMjhcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHUyMDI4XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTIwMjlcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHUyMDI5XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmVzdWx0ICs9IGNoO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmVzdWx0ICs9ICdcIic7XG4gIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gcChub2RlLCBwcmVjZWRlbmNlLCBhKSB7XG4gIHJldHVybiBnZXRQcmVjZWRlbmNlKG5vZGUpIDwgcHJlY2VkZW5jZSA/IHBhcmVuKGEpIDogYTtcbn1cblxuY2xhc3MgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29udGFpbnNJbiA9IGZhbHNlO1xuICAgIHRoaXMuY29udGFpbnNHcm91cCA9IGZhbHNlO1xuICAgIHRoaXMuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGZhbHNlO1xuICAgIHRoaXMuZW5kc1dpdGhNaXNzaW5nRWxzZSA9IGZhbHNlO1xuICB9XG5cbiAgZW1pdChzdHJlYW0sIG5vSW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbn1cblxuY2xhc3MgRW1wdHkgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgZW1pdCgpIHtcbiAgfVxufVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3Rvcih0b2tlbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dCh0aGlzLnRva2VuKTtcbiAgfVxufVxuXG5jbGFzcyBOdW1iZXJDb2RlUmVwIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKG51bWJlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5udW1iZXIgPSBudW1iZXI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0TnVtYmVyKHRoaXMubnVtYmVyKTtcbiAgfVxufVxuXG5jbGFzcyBQYXJlbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIihcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCIpXCIpO1xuICB9XG59XG5cbmNsYXNzIEJyYWNrZXQgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXQoXCJbXCIpO1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgdHMucHV0KFwiXVwiKTtcbiAgfVxufVxuXG5jbGFzcyBCcmFjZSBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIntcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCJ9XCIpO1xuICB9XG59XG5cbmNsYXNzIE5vSW4gZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgdHJ1ZSk7XG4gIH1cbn1cblxuY2xhc3MgQ29udGFpbnNJbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIGlmIChub0luKSB7XG4gICAgICB0cy5wdXQoXCIoXCIpO1xuICAgICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICAgIHRzLnB1dChcIilcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFNlcSBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihjaGlsZHJlbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjciA9PiBjci5lbWl0KHRzLCBub0luKSk7XG4gIH1cbn1cblxuY2xhc3MgU2VtaSBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCI7XCIpO1xuICB9XG59XG5cbmNsYXNzIENvbW1hU2VwIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGNoaWxkcmVuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goXG4gICAgICAgIChjcikgPT4ge1xuICAgICAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHMucHV0KFwiLFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3IuZW1pdCh0cywgbm9Jbik7XG4gICAgICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIFNlbWlPcCBleHRlbmRzIENvZGVSZXAge1xuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0T3B0aW9uYWxTZW1pKCk7XG4gIH1cbn1cblxuY2xhc3MgSW5pdCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihiaW5kaW5nLCBpbml0KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmJpbmRpbmcgPSBiaW5kaW5nO1xuICAgIHRoaXMuaW5pdCA9IGluaXQ7XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdGhpcy5iaW5kaW5nLmVtaXQodHMpO1xuICAgIGlmICh0aGlzLmluaXQgIT0gbnVsbCkge1xuICAgICAgdHMucHV0KFwiPVwiKTtcbiAgICAgIHRoaXMuaW5pdC5lbWl0KHRzLCBub0luKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdCh0b2tlbikge1xuICByZXR1cm4gbmV3IFRva2VuKHRva2VuKTtcbn1cblxuZnVuY3Rpb24gcGFyZW4ocmVwKSB7XG4gIHJldHVybiBuZXcgUGFyZW4ocmVwKTtcbn1cblxuZnVuY3Rpb24gYnJhY2tldChyZXApIHtcbiAgcmV0dXJuIG5ldyBCcmFja2V0KHJlcCk7XG59XG5cbmZ1bmN0aW9uIG5vSW4ocmVwKSB7XG4gIHJldHVybiBuZXcgTm9JbihyZXApO1xufVxuXG5mdW5jdGlvbiBtYXJrQ29udGFpbnNJbihzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUuY29udGFpbnNJbiA/IG5ldyBDb250YWluc0luKHN0YXRlKSA6IHN0YXRlO1xufVxuXG5mdW5jdGlvbiBzZXEoLi4ucmVwcykge1xuICByZXR1cm4gbmV3IFNlcShyZXBzKTtcbn1cblxuZnVuY3Rpb24gc2VtaSgpIHtcbiAgcmV0dXJuIG5ldyBTZW1pKCk7XG59XG5cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICByZXR1cm4gbmV3IEVtcHR5KCk7XG59XG5cbmZ1bmN0aW9uIGNvbW1hU2VwKHBpZWNlcykge1xuICByZXR1cm4gbmV3IENvbW1hU2VwKHBpZWNlcyk7XG59XG5cbmZ1bmN0aW9uIGJyYWNlKHJlcCkge1xuICByZXR1cm4gbmV3IEJyYWNlKHJlcCk7XG59XG5cbmZ1bmN0aW9uIHNlbWlPcCgpIHtcbiAgcmV0dXJuIG5ldyBTZW1pT3AoKTtcbn1cblxuZnVuY3Rpb24gcGFyZW5Ub0F2b2lkQmVpbmdEaXJlY3RpdmUoZWxlbWVudCwgb3JpZ2luYWwpIHtcbiAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC50eXBlID09PSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiAmJiBlbGVtZW50LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgcmV0dXJuIHNlcShwYXJlbihvcmlnaW5hbC5jaGlsZHJlblswXSksIHNlbWlPcCgpKTtcbiAgfVxuICByZXR1cm4gb3JpZ2luYWw7XG59XG5cbmZ1bmN0aW9uIGdldEFzc2lnbm1lbnRFeHByKHN0YXRlKSB7XG4gIHJldHVybiBzdGF0ZSA/IChzdGF0ZS5jb250YWluc0dyb3VwID8gcGFyZW4oc3RhdGUpIDogc3RhdGUpIDogZW1wdHkoKTtcbn1cblxuY2xhc3MgQ29kZUdlbiB7XG5cbiAgcmVkdWNlU2NyaXB0KG5vZGUsIGJvZHkpIHtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXIobm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUubmFtZSk7XG4gIH1cblxuICByZWR1Y2VJZGVudGlmaWVyRXhwcmVzc2lvbihub2RlLCBuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICByZWR1Y2VUaGlzRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoXCJ0aGlzXCIpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChub2RlLnZhbHVlLnRvU3RyaW5nKCkpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KGVzY2FwZVN0cmluZ0xpdGVyYWwobm9kZS52YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUudmFsdWUpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbmV3IE51bWJlckNvZGVSZXAobm9kZS52YWx1ZSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVsbEV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KFwibnVsbFwiKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRXhwcmVzc2lvbihub2RlLCBpZCwgcGFyYW1zLCBib2R5KSB7XG4gICAgY29uc3QgYXJnQm9keSA9IHNlcShwYXJlbihjb21tYVNlcChwYXJhbXMpKSwgYnJhY2UoYm9keSkpO1xuICAgIGxldCBzdGF0ZSA9IHNlcSh0KFwiZnVuY3Rpb25cIiksIGlkID8gc2VxKGlkLCBhcmdCb2R5KSA6IGFyZ0JvZHkpO1xuICAgIHN0YXRlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0cnVlO1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZVN0YXRpY01lbWJlckV4cHJlc3Npb24obm9kZSwgb2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNvbnN0IHN0YXRlID0gc2VxKHAobm9kZS5vYmplY3QsIGdldFByZWNlZGVuY2Uobm9kZSksIG9iamVjdCksIHQoXCIuXCIpLCBwcm9wZXJ0eSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IG9iamVjdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZUNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihub2RlLCBvYmplY3QsIGV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgICBzZXEocChub2RlLm9iamVjdCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb2JqZWN0KSwgYnJhY2tldChleHByZXNzaW9uKSksXG4gICAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBvYmplY3Quc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlT2JqZWN0RXhwcmVzc2lvbihub2RlLCBwcm9wZXJ0aWVzKSB7XG4gICAgbGV0IHN0YXRlID0gYnJhY2UoY29tbWFTZXAocHJvcGVydGllcykpO1xuICAgIHN0YXRlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0cnVlO1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZUJpbmFyeUV4cHJlc3Npb24obm9kZSwgbGVmdCwgcmlnaHQpIHtcbiAgICBsZXQgbGVmdENvZGUgPSBsZWZ0O1xuICAgIGxldCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gbGVmdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIGxldCBsZWZ0Q29udGFpbnNJbiA9IGxlZnQuY29udGFpbnNJbjtcbiAgICBpZiAoZ2V0UHJlY2VkZW5jZShub2RlLmxlZnQpIDwgZ2V0UHJlY2VkZW5jZShub2RlKSkge1xuICAgICAgbGVmdENvZGUgPSBwYXJlbihsZWZ0Q29kZSk7XG4gICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gZmFsc2U7XG4gICAgICBsZWZ0Q29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cbiAgICBsZXQgcmlnaHRDb2RlID0gcmlnaHQ7XG4gICAgbGV0IHJpZ2h0Q29udGFpbnNJbiA9IHJpZ2h0LmNvbnRhaW5zSW47XG4gICAgaWYgKGdldFByZWNlZGVuY2Uobm9kZS5yaWdodCkgPD0gZ2V0UHJlY2VkZW5jZShub2RlKSkge1xuICAgICAgcmlnaHRDb2RlID0gcGFyZW4ocmlnaHRDb2RlKTtcbiAgICAgIHJpZ2h0Q29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcShsZWZ0Q29kZSwgdChub2RlLm9wZXJhdG9yKSwgcmlnaHRDb2RlKSxcbiAgICAgICAge1xuICAgICAgICAgIGNvbnRhaW5zSW46IGxlZnRDb250YWluc0luIHx8IHJpZ2h0Q29udGFpbnNJbiB8fCBub2RlLm9wZXJhdG9yID09PSBcImluXCIsXG4gICAgICAgICAgY29udGFpbnNHcm91cDogbm9kZS5vcGVyYXRvciA9PSBcIixcIixcbiAgICAgICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSwgYmluZGluZywgZXhwcmVzc2lvbikge1xuICAgIGxldCByaWdodENvZGUgPSBleHByZXNzaW9uO1xuICAgIGxldCBjb250YWluc0luID0gZXhwcmVzc2lvbi5jb250YWluc0luO1xuICAgIGxldCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gYmluZGluZy5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUuZXhwcmVzc2lvbikgPCBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICByaWdodENvZGUgPSBwYXJlbihyaWdodENvZGUpO1xuICAgICAgY29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcShiaW5kaW5nLCB0KG5vZGUub3BlcmF0b3IpLCByaWdodENvZGUpLCB7Y29udGFpbnNJbiwgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlQXJyYXlFeHByZXNzaW9uKG5vZGUsIGVsZW1lbnRzKSB7XG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNrZXQoZW1wdHkoKSk7XG4gICAgfVxuXG4gICAgbGV0IGNvbnRlbnQgPSBjb21tYVNlcChlbGVtZW50cy5tYXAoZ2V0QXNzaWdubWVudEV4cHIpKTtcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID4gMCAmJiBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXSA9PSBudWxsKSB7XG4gICAgICBjb250ZW50ID0gc2VxKGNvbnRlbnQsIHQoXCIsXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGJyYWNrZXQoY29udGVudCk7XG4gIH1cblxuICByZWR1Y2VOZXdFeHByZXNzaW9uKG5vZGUsIGNhbGxlZSwgYXJncykge1xuICAgIGxldCBjYWxsZWVSZXAgPSBnZXRQcmVjZWRlbmNlKG5vZGUuY2FsbGVlKSA9PSBQcmVjZWRlbmNlLkNhbGwgPyBwYXJlbihjYWxsZWUpIDpcbiAgICAgICAgcChub2RlLmNhbGxlZSwgZ2V0UHJlY2VkZW5jZShub2RlKSwgY2FsbGVlKTtcbiAgICByZXR1cm4gc2VxKHQoXCJuZXdcIiksIGNhbGxlZVJlcCwgYXJncy5sZW5ndGggPT09IDAgPyBlbXB0eSgpIDogcGFyZW4oY29tbWFTZXAoYXJncykpKTtcbiAgfVxuXG4gIHJlZHVjZUNhbGxFeHByZXNzaW9uKG5vZGUsIGNhbGxlZSwgYXJncykge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcShwKG5vZGUuY2FsbGVlLCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBjYWxsZWUpLCBwYXJlbihjb21tYVNlcChhcmdzKSkpLFxuICAgICAgICB7c3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTogY2FsbGVlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHl9KTtcbiAgfVxuXG4gIHJlZHVjZVBvc3RmaXhFeHByZXNzaW9uKG5vZGUsIG9wZXJhbmQpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgICBzZXEocChub2RlLm9wZXJhbmQsIGdldFByZWNlZGVuY2Uobm9kZSksIG9wZXJhbmQpLCB0KG5vZGUub3BlcmF0b3IpKSxcbiAgICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IG9wZXJhbmQuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlUHJlZml4RXhwcmVzc2lvbihub2RlLCBvcGVyYW5kKSB7XG4gICAgcmV0dXJuIHNlcSh0KG5vZGUub3BlcmF0b3IpLCBwKG5vZGUub3BlcmFuZCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb3BlcmFuZCkpO1xuICB9XG5cbiAgcmVkdWNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKG5vZGUsIHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSkge1xuICAgIGxldCBjb250YWluc0luID0gdGVzdC5jb250YWluc0luIHx8IGFsdGVybmF0ZS5jb250YWluc0luO1xuICAgIGxldCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gdGVzdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcShcbiAgICAgICAgICAgIHAobm9kZS50ZXN0LCBQcmVjZWRlbmNlLkxvZ2ljYWxPUiwgdGVzdCksIHQoXCI/XCIpLFxuICAgICAgICAgICAgcChub2RlLmNvbnNlcXVlbnQsIFByZWNlZGVuY2UuQXNzaWdubWVudCwgY29uc2VxdWVudCksIHQoXCI6XCIpLFxuICAgICAgICAgICAgcChub2RlLmFsdGVybmF0ZSwgUHJlY2VkZW5jZS5Bc3NpZ25tZW50LCBhbHRlcm5hdGUpKSwge1xuICAgICAgICAgIGNvbnRhaW5zSW4sXG4gICAgICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseVxuICAgICAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSwgaWQsIHBhcmFtcywgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcImZ1bmN0aW9uXCIpLCBpZCwgcGFyZW4oY29tbWFTZXAocGFyYW1zKSksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZVVzZVN0cmljdERpcmVjdGl2ZShub2RlKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiXFxcInVzZSBzdHJpY3RcXFwiXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VVbmtub3duRGlyZWN0aXZlKG5vZGUpIHtcbiAgICB2YXIgbmFtZSA9IFwidXNlIHN0cmljdFwiID09PSBub2RlLnZhbHVlID8gXCJ1c2VcXFxcdTAwMjBzdHJpY3RcIiA6IG5vZGUudmFsdWU7XG4gICAgcmV0dXJuIHNlcSh0KFwiXFxcIlwiICsgbmFtZSArIFwiXFxcIlwiKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlQmxvY2tTdGF0ZW1lbnQobm9kZSwgYmxvY2spIHtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cblxuICByZWR1Y2VCcmVha1N0YXRlbWVudChub2RlLCBsYWJlbCkge1xuICAgIHJldHVybiBzZXEodChcImJyZWFrXCIpLCBsYWJlbCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VDYXRjaENsYXVzZShub2RlLCBwYXJhbSwgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcImNhdGNoXCIpLCBwYXJlbihwYXJhbSksIGJvZHkpO1xuICB9XG5cbiAgcmVkdWNlQ29udGludWVTdGF0ZW1lbnQobm9kZSwgbGFiZWwpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJjb250aW51ZVwiKSwgbGFiZWwgfHwgZW1wdHkoKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRGVidWdnZXJTdGF0ZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBzZXEodChcImRlYnVnZ2VyXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VEb1doaWxlU3RhdGVtZW50KG5vZGUsIGJvZHksIHRlc3QpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJkb1wiKSwgYm9keSwgdChcIndoaWxlXCIpLCBwYXJlbih0ZXN0KSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRW1wdHlTdGF0ZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBzZW1pKCk7XG4gIH1cblxuICByZWR1Y2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUsIGV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gc2VxKChleHByZXNzaW9uLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPyBwYXJlbihleHByZXNzaW9uKSA6IGV4cHJlc3Npb24pLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VGb3JJblN0YXRlbWVudChub2RlLCBsZWZ0LCByaWdodCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcSh0KFwiZm9yXCIpLCBwYXJlbihzZXEobm9JbihtYXJrQ29udGFpbnNJbihsZWZ0KSksIHQoXCJpblwiKSwgcmlnaHQpKSwgYm9keSksXG4gICAgICAgIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZUZvclN0YXRlbWVudChub2RlLCBpbml0LCB0ZXN0LCB1cGRhdGUsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgICBzZXEoXG4gICAgICAgICAgICB0KFwiZm9yXCIpLFxuICAgICAgICAgICAgcGFyZW4oc2VxKGluaXQgPyBub0luKG1hcmtDb250YWluc0luKGluaXQpKSA6IGVtcHR5KCksIHNlbWkoKSwgdGVzdCB8fCBlbXB0eSgpLCBzZW1pKCksIHVwZGF0ZSB8fCBlbXB0eSgpKSksXG4gICAgICAgICAgICBib2R5KSxcbiAgICAgICAge1xuICAgICAgICAgIGVuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZVxuICAgICAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUlmU3RhdGVtZW50KG5vZGUsIHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSkge1xuICAgIGlmIChhbHRlcm5hdGUgJiYgY29uc2VxdWVudC5lbmRzV2l0aE1pc3NpbmdFbHNlKSB7XG4gICAgICBjb25zZXF1ZW50ID0gYnJhY2UoY29uc2VxdWVudCk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICAgIHNlcSh0KFwiaWZcIiksIHBhcmVuKHRlc3QpLCBjb25zZXF1ZW50LCBhbHRlcm5hdGUgPyBzZXEodChcImVsc2VcIiksIGFsdGVybmF0ZSkgOiBlbXB0eSgpKSxcbiAgICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGFsdGVybmF0ZSA/IGFsdGVybmF0ZS5lbmRzV2l0aE1pc3NpbmdFbHNlIDogdHJ1ZX0pO1xuICB9XG5cbiAgcmVkdWNlTGFiZWxlZFN0YXRlbWVudChub2RlLCBsYWJlbCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oc2VxKGxhYmVsLCB0KFwiOlwiKSwgYm9keSksIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZVJldHVyblN0YXRlbWVudChub2RlLCBhcmd1bWVudCkge1xuICAgIHJldHVybiBzZXEodChcInJldHVyblwiKSwgYXJndW1lbnQgfHwgZW1wdHkoKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoQ2FzZShub2RlLCB0ZXN0LCBjb25zZXF1ZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiY2FzZVwiKSwgdGVzdCwgdChcIjpcIiksIHNlcSguLi5jb25zZXF1ZW50KSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hEZWZhdWx0KG5vZGUsIGNvbnNlcXVlbnQpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJkZWZhdWx0XCIpLCB0KFwiOlwiKSwgc2VxKC4uLmNvbnNlcXVlbnQpKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaFN0YXRlbWVudChub2RlLCBkaXNjcmltaW5hbnQsIGNhc2VzKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwic3dpdGNoXCIpLCBwYXJlbihkaXNjcmltaW5hbnQpLCBicmFjZShzZXEoLi4uY2FzZXMpKSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChub2RlLCBkaXNjcmltaW5hbnQsIGNhc2VzLCBkZWZhdWx0Q2FzZSwgcG9zdERlZmF1bHRDYXNlcykge1xuICAgIHJldHVybiBzZXEoXG4gICAgICAgIHQoXCJzd2l0Y2hcIiksXG4gICAgICAgIHBhcmVuKGRpc2NyaW1pbmFudCksXG4gICAgICAgIGJyYWNlKHNlcSguLi5jYXNlcywgZGVmYXVsdENhc2UsIC4uLnBvc3REZWZhdWx0Q2FzZXMpKSk7XG4gIH1cblxuICByZWR1Y2VUaHJvd1N0YXRlbWVudChub2RlLCBhcmd1bWVudCkge1xuICAgIHJldHVybiBzZXEodChcInRocm93XCIpLCBhcmd1bWVudCwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlVHJ5Q2F0Y2hTdGF0ZW1lbnQobm9kZSwgYmxvY2ssIGNhdGNoQ2xhdXNlKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidHJ5XCIpLCBibG9jaywgY2F0Y2hDbGF1c2UpO1xuICB9XG5cbiAgcmVkdWNlVHJ5RmluYWxseVN0YXRlbWVudChub2RlLCBibG9jaywgY2F0Y2hDbGF1c2UsIGZpbmFsaXplcikge1xuICAgIHJldHVybiBzZXEoXG4gICAgICAgIHQoXCJ0cnlcIiksXG4gICAgICAgIGJsb2NrLFxuICAgICAgICBjYXRjaENsYXVzZSB8fCBlbXB0eSgpLFxuICAgICAgICB0KFwiZmluYWxseVwiKSxcbiAgICAgICAgZmluYWxpemVyKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQobm9kZSwgZGVjbGFyYXRpb24pIHtcbiAgICByZXR1cm4gc2VxKGRlY2xhcmF0aW9uLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUsIGRlY2xhcmF0b3JzKSB7XG4gICAgcmV0dXJuIHNlcSh0KG5vZGUua2luZCksIGNvbW1hU2VwKGRlY2xhcmF0b3JzKSk7XG4gIH1cblxuICByZWR1Y2VXaGlsZVN0YXRlbWVudChub2RlLCB0ZXN0LCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihzZXEodChcIndoaWxlXCIpLCBwYXJlbih0ZXN0KSwgYm9keSksIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZVdpdGhTdGF0ZW1lbnQobm9kZSwgb2JqZWN0LCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgICAgc2VxKHQoXCJ3aXRoXCIpLCBwYXJlbihvYmplY3QpLCBib2R5KSxcbiAgICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlRGF0YVByb3BlcnR5KG5vZGUsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gc2VxKGtleSwgdChcIjpcIiksIGdldEFzc2lnbm1lbnRFeHByKHZhbHVlKSk7XG4gIH1cblxuICByZWR1Y2VHZXR0ZXIobm9kZSwga2V5LCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZ2V0XCIpLCBrZXksIHBhcmVuKGVtcHR5KCkpLCBicmFjZShib2R5KSk7XG4gIH1cblxuICByZWR1Y2VTZXR0ZXIobm9kZSwga2V5LCBwYXJhbWV0ZXIsIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJzZXRcIiksIGtleSwgcGFyZW4ocGFyYW1ldGVyKSwgYnJhY2UoYm9keSkpO1xuICB9XG5cbiAgcmVkdWNlUHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgICBpZiAobm9kZS5raW5kID09IFwibnVtYmVyXCIgfHwgbm9kZS5raW5kID09IFwiaWRlbnRpZmllclwiKSB7XG4gICAgICByZXR1cm4gdChub2RlLnZhbHVlLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdChVdGlscy5lc2NhcGVTdHJpbmdMaXRlcmFsKG5vZGUudmFsdWUpKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uQm9keShub2RlLCBkaXJlY3RpdmVzLCBzb3VyY2VFbGVtZW50cykge1xuICAgIGlmIChzb3VyY2VFbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIHNvdXJjZUVsZW1lbnRzWzBdID0gcGFyZW5Ub0F2b2lkQmVpbmdEaXJlY3RpdmUobm9kZS5zdGF0ZW1lbnRzWzBdLCBzb3VyY2VFbGVtZW50c1swXSk7XG4gICAgfVxuICAgIHJldHVybiBzZXEoLi4uZGlyZWN0aXZlcywgLi4uc291cmNlRWxlbWVudHMpO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdG9yKG5vZGUsIGlkLCBpbml0KSB7XG4gICAgbGV0IGNvbnRhaW5zSW4gPSBpbml0ICYmIGluaXQuY29udGFpbnNJbiAmJiAhaW5pdC5jb250YWluc0dyb3VwO1xuICAgIGlmIChpbml0KSB7XG4gICAgICBpZiAoaW5pdC5jb250YWluc0dyb3VwKSB7XG4gICAgICAgIGluaXQgPSBwYXJlbihpbml0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluaXQgPSBtYXJrQ29udGFpbnNJbihpbml0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihuZXcgSW5pdChpZCwgaW5pdCksIHtjb250YWluc0lufSk7XG4gIH1cblxuICByZWR1Y2VCbG9jayhub2RlLCBzdGF0ZW1lbnRzKSB7XG4gICAgcmV0dXJuIGJyYWNlKHNlcSguLi5zdGF0ZW1lbnRzKSk7XG4gIH1cbn1cblxuY29uc3QgSU5TVEFOQ0UgPSBuZXcgQ29kZUdlbjtcbiJdfQ==