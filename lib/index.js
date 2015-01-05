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
    return t(JSON.stringify(node.value));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBQU8sTUFBTTtJQUNELFlBQVk7O0lBQ2hCLFdBQVcsNkJBQVgsV0FBVztBQUVKLFNBQVMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN0QyxNQUFJLEVBQUUsR0FBRyxJQUFJLFdBQVcsRUFBQSxDQUFDO0FBQ3pCLE1BQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbkMsS0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNiLFNBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQztDQUNsQjs7cUJBTHVCLE9BQU87QUFPL0IsSUFBTSxVQUFVLEdBQUc7QUFDakIsVUFBUSxFQUFFLENBQUM7QUFDWCxPQUFLLEVBQUUsQ0FBQztBQUNSLFlBQVUsRUFBRSxDQUFDO0FBQ2IsYUFBVyxFQUFFLENBQUM7QUFDZCxlQUFhLEVBQUUsQ0FBQztBQUNoQixXQUFTLEVBQUUsQ0FBQztBQUNaLFlBQVUsRUFBRSxDQUFDO0FBQ2IsV0FBUyxFQUFFLENBQUM7QUFDWixZQUFVLEVBQUUsQ0FBQztBQUNiLFlBQVUsRUFBRSxDQUFDO0FBQ2IsVUFBUSxFQUFFLENBQUM7QUFDWCxZQUFVLEVBQUUsQ0FBQztBQUNiLGNBQVksRUFBRSxFQUFFO0FBQ2hCLFVBQVEsRUFBRSxFQUFFO0FBQ1osZ0JBQWMsRUFBRSxFQUFFO0FBQ2xCLFFBQU0sRUFBRSxFQUFFO0FBQ1YsU0FBTyxFQUFFLEVBQUU7QUFDWCxLQUFHLEVBQUUsRUFBRTtBQUNQLE1BQUksRUFBRSxFQUFFO0FBQ1IsZ0JBQWMsRUFBRSxFQUFFO0FBQ2xCLFFBQU0sRUFBRSxFQUFFO0FBQ1YsU0FBTyxFQUFFLEVBQUU7Q0FDWixDQUFDOztBQUVGLElBQU0sZ0JBQWdCLEdBQUc7QUFDdkIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3hCLE1BQUksRUFBRSxVQUFVLENBQUMsU0FBUztBQUMxQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsS0FBRyxFQUFFLFVBQVUsQ0FBQyxTQUFTO0FBQ3pCLEtBQUcsRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3pCLE1BQUksRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN6QixPQUFLLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDMUIsT0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQzFCLEtBQUcsRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLE1BQUksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMzQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsY0FBWSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQ25DLE1BQUksRUFBRSxVQUFVLENBQUMsWUFBWTtBQUM3QixNQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVk7QUFDN0IsT0FBSyxFQUFFLFVBQVUsQ0FBQyxZQUFZO0FBQzlCLEtBQUcsRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN4QixLQUFHLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDeEIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxjQUFjO0FBQzlCLEtBQUcsRUFBRSxVQUFVLENBQUMsY0FBYztBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLGNBQWM7Q0FDL0IsQ0FBQzs7QUFFRixTQUFTLGFBQWEsQ0FBQyxJQUFJLEVBQUU7QUFDM0IsVUFBUSxJQUFJLENBQUMsSUFBSTtBQUNmLFNBQUssaUJBQWlCLEVBQUM7QUFDdkIsU0FBSyxvQkFBb0IsRUFBQztBQUMxQixTQUFLLHNCQUFzQixFQUFDO0FBQzVCLFNBQUssMEJBQTBCLEVBQUM7QUFDaEMsU0FBSyx1QkFBdUIsRUFBQztBQUM3QixTQUFLLDBCQUEwQixFQUFDO0FBQ2hDLFNBQUsseUJBQXlCLEVBQUM7QUFDL0IsU0FBSyx5QkFBeUIsRUFBQztBQUMvQixTQUFLLGtCQUFrQjtBQUNyQixhQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUM7O0FBQUEsQUFFNUIsU0FBSyxzQkFBc0I7QUFDekIsYUFBTyxVQUFVLENBQUMsVUFBVSxDQUFDOztBQUFBLEFBRS9CLFNBQUssdUJBQXVCO0FBQzFCLGFBQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQzs7QUFBQSxBQUVoQyxTQUFLLDBCQUEwQixFQUFDO0FBQ2hDLFNBQUssd0JBQXdCO0FBQzNCLGNBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJO0FBQ3RCLGFBQUssZ0JBQWdCLEVBQUM7QUFDdEIsYUFBSywwQkFBMEIsRUFBQztBQUNoQyxhQUFLLHdCQUF3QjtBQUMzQixpQkFBTyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQUEsQUFDcEM7QUFDRSxpQkFBTyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQUEsT0FDNUI7O0FBQUEsQUFFSCxTQUFLLGtCQUFrQjtBQUNyQixhQUFPLGdCQUFnQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFBQSxBQUV6QyxTQUFLLGdCQUFnQjtBQUNuQixhQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFBQSxBQUN6QixTQUFLLGVBQWU7QUFDbEIsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQUEsQUFDMUUsU0FBSyxtQkFBbUI7QUFDdEIsYUFBTyxVQUFVLENBQUMsT0FBTyxDQUFDO0FBQUEsQUFDNUIsU0FBSyxrQkFBa0I7QUFDckIsYUFBTyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQUEsR0FDNUI7Q0FDRjs7QUFFRCxTQUFTLG1CQUFtQixDQUFDLFdBQVcsRUFBRTtBQUN4QyxNQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsUUFBTSxJQUFJLENBQUMsSUFBRyxDQUFDLENBQUM7QUFDaEIsT0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDM0MsUUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixZQUFRLEVBQUU7QUFDUixXQUFLLElBQUk7QUFDUCxjQUFNLElBQUksS0FBSyxDQUFDO0FBQ2hCLGNBQU07QUFBQSxBQUNSLFdBQUssSUFBSTtBQUNQLGNBQU0sSUFBSSxLQUFLLENBQUM7QUFDaEIsY0FBTTtBQUFBLEFBQ1IsV0FBSyxJQUFJO0FBQ1AsY0FBTSxJQUFJLEtBQUssQ0FBQztBQUNoQixjQUFNO0FBQUEsQUFDUixXQUFLLFFBQVE7QUFDWCxjQUFNLElBQUksS0FBSyxDQUFDO0FBQ2hCLGNBQU07QUFBQSxBQUNSLFdBQUssSUFBUTtBQUNYLGNBQU0sSUFBSSxLQUFLLENBQUM7QUFDaEIsY0FBTTtBQUFBLEFBQ1IsV0FBSyxJQUFJO0FBQ1AsY0FBTSxJQUFJLEtBQUssQ0FBQztBQUNoQixjQUFNO0FBQUEsQUFDUixXQUFLLElBQUk7QUFDUCxjQUFNLElBQUksTUFBTSxDQUFDO0FBQ2pCLGNBQU07QUFBQSxBQUNSLFdBQUssSUFBSTtBQUNQLGNBQU0sSUFBSSxNQUFNLENBQUM7QUFDakIsY0FBTTtBQUFBLEFBQ1IsV0FBSyxRQUFRO0FBQ1gsY0FBTSxJQUFJLFNBQVMsQ0FBQztBQUNwQixjQUFNO0FBQUEsQUFDUixXQUFLLFFBQVE7QUFDWCxjQUFNLElBQUksU0FBUyxDQUFDO0FBQ3BCLGNBQU07QUFBQSxBQUNSO0FBQ0UsY0FBTSxJQUFJLEVBQUUsQ0FBQztBQUNiLGNBQU07QUFBQSxLQUNUO0dBQ0Y7QUFDRCxRQUFNLElBQUksSUFBRyxDQUFDO0FBQ2QsU0FBTyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7Q0FDMUI7O0FBRUQsU0FBUyxDQUFDLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUU7QUFDOUIsU0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDeEQ7O0lBRUssT0FBTztNQUFQLE9BQU8sR0FDQSxTQURQLE9BQU8sR0FDRztBQUNaLFFBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQzNCLFFBQUksQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUM7QUFDdkMsUUFBSSxDQUFDLG1CQUFtQixHQUFHLEtBQUssQ0FBQztHQUNsQzs7QUFORyxTQUFPLFdBUVgsSUFBSSxHQUFBLFVBQUMsTUFBTSxFQUFFLElBQUksRUFBRTtBQUNqQixVQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7R0FDcEM7O1NBVkcsT0FBTzs7O0lBYVAsS0FBSyxjQUFTLE9BQU87TUFBckIsS0FBSyxZQUFMLEtBQUs7QUFBUyxXQUFPOzs7V0FBckIsS0FBSyxFQUFTLE9BQU87O0FBQXJCLE9BQUssV0FDVCxJQUFJLEdBQUEsWUFBRyxFQUFFOztTQURMLEtBQUs7R0FBUyxPQUFPOztJQUlyQixLQUFLLGNBQVMsT0FBTztNQUFyQixLQUFLLEdBQ0UsU0FEUCxLQUFLLENBQ0csS0FBSyxFQUFFO0FBREQsQUFFaEIsV0FGdUIsV0FFaEIsQ0FBQztBQUNSLFFBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0dBQ3BCOztXQUpHLEtBQUssRUFBUyxPQUFPOztBQUFyQixPQUFLLFdBTVQsSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFO0FBQ1AsTUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDcEI7O1NBUkcsS0FBSztHQUFTLE9BQU87O0lBV3JCLGFBQWEsY0FBUyxPQUFPO01BQTdCLGFBQWEsR0FDTixTQURQLGFBQWEsQ0FDTCxNQUFNLEVBQUU7QUFETSxBQUV4QixXQUYrQixXQUV4QixDQUFDO0FBQ1IsUUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7R0FDdEI7O1dBSkcsYUFBYSxFQUFTLE9BQU87O0FBQTdCLGVBQWEsV0FNakIsSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFO0FBQ1AsTUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7R0FDM0I7O1NBUkcsYUFBYTtHQUFTLE9BQU87O0lBVzdCLEtBQUssY0FBUyxPQUFPO01BQXJCLEtBQUssR0FDRSxTQURQLEtBQUssQ0FDRyxJQUFJLEVBQUU7QUFEQSxBQUVoQixXQUZ1QixXQUVoQixDQUFDO0FBQ1IsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7R0FDbEI7O1dBSkcsS0FBSyxFQUFTLE9BQU87O0FBQXJCLE9BQUssV0FNVCxJQUFJLEdBQUEsVUFBQyxFQUFFLEVBQUU7QUFDUCxNQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1osUUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFCLE1BQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDYjs7U0FWRyxLQUFLO0dBQVMsT0FBTzs7SUFhckIsT0FBTyxjQUFTLE9BQU87TUFBdkIsT0FBTyxHQUNBLFNBRFAsT0FBTyxDQUNDLElBQUksRUFBRTtBQURFLEFBRWxCLFdBRnlCLFdBRWxCLENBQUM7QUFDUixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztHQUNsQjs7V0FKRyxPQUFPLEVBQVMsT0FBTzs7QUFBdkIsU0FBTyxXQU1YLElBQUksR0FBQSxVQUFDLEVBQUUsRUFBRTtBQUNQLE1BQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDWixRQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUIsTUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNiOztTQVZHLE9BQU87R0FBUyxPQUFPOztJQWF2QixLQUFLLGNBQVMsT0FBTztNQUFyQixLQUFLLEdBQ0UsU0FEUCxLQUFLLENBQ0csSUFBSSxFQUFFO0FBREEsQUFFaEIsV0FGdUIsV0FFaEIsQ0FBQztBQUNSLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0dBQ2xCOztXQUpHLEtBQUssRUFBUyxPQUFPOztBQUFyQixPQUFLLFdBTVQsSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFO0FBQ1AsTUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLFFBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixNQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQ2I7O1NBVkcsS0FBSztHQUFTLE9BQU87O0lBYXJCLElBQUksY0FBUyxPQUFPO01BQXBCLElBQUksR0FDRyxTQURQLElBQUksQ0FDSSxJQUFJLEVBQUU7QUFERCxBQUVmLFdBRnNCLFdBRWYsQ0FBQztBQUNSLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0dBQ2xCOztXQUpHLElBQUksRUFBUyxPQUFPOztBQUFwQixNQUFJLFdBTVIsSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFO0FBQ1AsUUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzFCOztTQVJHLElBQUk7R0FBUyxPQUFPOztJQVdwQixVQUFVLGNBQVMsT0FBTztNQUExQixVQUFVLEdBQ0gsU0FEUCxVQUFVLENBQ0YsSUFBSSxFQUFFO0FBREssQUFFckIsV0FGNEIsV0FFckIsQ0FBQztBQUNSLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0dBQ2xCOztXQUpHLFVBQVUsRUFBUyxPQUFPOztBQUExQixZQUFVLFdBTWQsSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFLElBQUksRUFBRTtBQUNiLFFBQUksSUFBSSxFQUFFO0FBQ1IsUUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLFVBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixRQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2IsTUFBTTtBQUNMLFVBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMzQjtHQUNGOztTQWRHLFVBQVU7R0FBUyxPQUFPOztJQWlCMUIsR0FBRyxjQUFTLE9BQU87TUFBbkIsR0FBRyxHQUNJLFNBRFAsR0FBRyxDQUNLLFFBQVEsRUFBRTtBQUROLEFBRWQsV0FGcUIsV0FFZCxDQUFDO0FBQ1IsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7R0FDMUI7O1dBSkcsR0FBRyxFQUFTLE9BQU87O0FBQW5CLEtBQUcsV0FNUCxJQUFJLEdBQUEsVUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQ2IsUUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFO2FBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDO0tBQUEsQ0FBQyxDQUFDO0dBQ2hEOztTQVJHLEdBQUc7R0FBUyxPQUFPOztJQVduQixJQUFJLGNBQVMsS0FBSztNQUFsQixJQUFJLEdBQ0csU0FEUCxJQUFJLEdBQ007QUFERyxBQUVmLFNBRm9CLFlBRWQsR0FBRyxDQUFDLENBQUM7R0FDWjs7V0FIRyxJQUFJLEVBQVMsS0FBSzs7U0FBbEIsSUFBSTtHQUFTLEtBQUs7O0lBTWxCLFFBQVEsY0FBUyxPQUFPO01BQXhCLFFBQVEsR0FDRCxTQURQLFFBQVEsQ0FDQSxRQUFRLEVBQUU7QUFERCxBQUVuQixXQUYwQixXQUVuQixDQUFDO0FBQ1IsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7R0FDMUI7O1dBSkcsUUFBUSxFQUFTLE9BQU87O0FBQXhCLFVBQVEsV0FNWixJQUFJLEdBQUEsVUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQ2IsUUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUMsRUFBRSxFQUFLO0FBQzVCLFVBQUksS0FBSyxFQUFFO0FBQ1QsYUFBSyxHQUFHLEtBQUssQ0FBQztPQUNmLE1BQU07QUFDTCxVQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2I7QUFDRCxRQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNuQixDQUFDLENBQUM7R0FDSjs7U0FoQkcsUUFBUTtHQUFTLE9BQU87O0lBbUJ4QixNQUFNLGNBQVMsT0FBTztNQUF0QixNQUFNLFlBQU4sTUFBTTtBQUFTLFdBQU87OztXQUF0QixNQUFNLEVBQVMsT0FBTzs7QUFBdEIsUUFBTSxXQUNWLElBQUksR0FBQSxVQUFDLEVBQUUsRUFBRTtBQUNQLE1BQUUsQ0FBQyxlQUFlLEVBQUUsQ0FBQztHQUN0Qjs7U0FIRyxNQUFNO0dBQVMsT0FBTzs7SUFNdEIsSUFBSSxjQUFTLE9BQU87TUFBcEIsSUFBSSxHQUNHLFNBRFAsSUFBSSxDQUNJLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFEVixBQUVmLFdBRnNCLFdBRWYsQ0FBQztBQUNSLFFBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0dBQ2xCOztXQUxHLElBQUksRUFBUyxPQUFPOztBQUFwQixNQUFJLFdBT1IsSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFLElBQUksRUFBRTtBQUNiLFFBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RCLFFBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDckIsUUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLFVBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMxQjtHQUNGOztTQWJHLElBQUk7R0FBUyxPQUFPOztBQWdCMUIsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFO0FBQ2hCLFNBQU8sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDekI7O0FBRUQsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFO0FBQ2xCLFNBQU8sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDdkI7O0FBRUQsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ3BCLFNBQU8sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDekI7O0FBRUQsU0FBUyxJQUFJLENBQUMsR0FBRyxFQUFFO0FBQ2pCLFNBQU8sSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDdEI7O0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBSyxFQUFFO0FBQzdCLFNBQU8sS0FBSyxDQUFDLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7Q0FDekQ7O0FBRUQsU0FBUyxHQUFHLEdBQVU7TUFBTixJQUFJOztBQUNsQixTQUFPLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3RCOztBQUVELFNBQVMsSUFBSSxHQUFHO0FBQ2QsU0FBTyxJQUFJLElBQUksRUFBQSxDQUFDO0NBQ2pCOztBQUVELFNBQVMsS0FBSyxHQUFHO0FBQ2YsU0FBTyxJQUFJLEtBQUssRUFBQSxDQUFDO0NBQ2xCOztBQUVELFNBQVMsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUN4QixTQUFPLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQzdCOztBQUVELFNBQVMsS0FBSyxDQUFDLEdBQUcsRUFBRTtBQUNsQixTQUFPLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3ZCOztBQUVELFNBQVMsTUFBTSxHQUFHO0FBQ2hCLFNBQU8sSUFBSSxNQUFNLEVBQUEsQ0FBQztDQUNuQjs7QUFFRCxTQUFTLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUU7QUFDckQsTUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxxQkFBcUIsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyx5QkFBeUIsRUFBRTtBQUM5RyxXQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7R0FDbkQ7QUFDRCxTQUFPLFFBQVEsQ0FBQztDQUNqQjs7QUFFRCxTQUFTLGlCQUFpQixDQUFDLEtBQUssRUFBRTtBQUNoQyxTQUFPLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDO0NBQ3ZFOztJQUVLLE9BQU87TUFBUCxPQUFPLFlBQVAsT0FBTzs7QUFBUCxTQUFPLFdBRVgscUJBQXFCLEdBQUEsVUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFFO0FBQ3BDLFFBQUksUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDekIsYUFBTyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztLQUN6Qjs7QUFFRCxRQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7QUFDeEQsUUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDaEUsYUFBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDaEM7QUFDRCxXQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUN6Qjs7QUFaRyxTQUFPLFdBY1gsMEJBQTBCLEdBQUEsVUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRTtBQUNwRCxRQUFJLFNBQVMsR0FBRyxVQUFVLENBQUM7QUFDM0IsUUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztBQUN2QyxRQUFJLHlCQUF5QixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztBQUNsRSxRQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3hELGVBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDN0IsZ0JBQVUsR0FBRyxLQUFLLENBQUM7S0FDcEI7QUFDRCxXQUFPLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBQyxVQUFVLEVBQVYsVUFBVSxFQUFFLHlCQUF5QixFQUF6Qix5QkFBeUIsRUFBQyxDQUFDLENBQUM7R0FDekc7O0FBdkJHLFNBQU8sV0F5Qlgsc0JBQXNCLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUN4QyxRQUFJLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDcEIsUUFBSSx5QkFBeUIsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUM7QUFDL0QsUUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUNyQyxRQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xELGNBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0IsK0JBQXlCLEdBQUcsS0FBSyxDQUFDO0FBQ2xDLG9CQUFjLEdBQUcsS0FBSyxDQUFDO0tBQ3hCO0FBQ0QsUUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFFBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7QUFDdkMsUUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNwRCxlQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdCLHFCQUFlLEdBQUcsS0FBSyxDQUFDO0tBQ3pCO0FBQ0QsV0FBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsRUFDMUM7QUFDRSxnQkFBVSxFQUFFLGNBQWMsSUFBSSxlQUFlLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJO0FBQ3ZFLG1CQUFhLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHO0FBQ25DLCtCQUF5QixFQUF6Qix5QkFBeUI7S0FDMUIsQ0FBQyxDQUFDO0dBQ047O0FBL0NHLFNBQU8sV0FpRFgsV0FBVyxHQUFBLFVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUM1QixXQUFPLEtBQUssQ0FBQyxHQUFHLHNCQUFJLFVBQVUsRUFBQyxDQUFDLENBQUM7R0FDbEM7O0FBbkRHLFNBQU8sV0FxRFgsb0JBQW9CLEdBQUEsVUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLFdBQU8sS0FBSyxDQUFDO0dBQ2Q7O0FBdkRHLFNBQU8sV0F5RFgsb0JBQW9CLEdBQUEsVUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLElBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztHQUNwRDs7QUEzREcsU0FBTyxXQTZEWCxvQkFBb0IsR0FBQSxVQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ3ZDLFdBQU8sWUFBWSxDQUNqQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUN2RSxFQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyx5QkFBeUIsRUFBQyxDQUFDLENBQUM7R0FDbEU7O0FBakVHLFNBQU8sV0FtRVgsaUJBQWlCLEdBQUEsVUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtBQUNuQyxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQzVDOztBQXJFRyxTQUFPLFdBdUVYLDhCQUE4QixHQUFBLFVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUU7QUFDdkQsV0FBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQ3JFLEVBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLHlCQUF5QixFQUFDLENBQUMsQ0FBQztHQUNsRTs7QUEzRUcsU0FBTyxXQTZFWCwyQkFBMkIsR0FBQSxVQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRTtBQUM3RCxRQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFDekQsUUFBSSx5QkFBeUIsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUM7QUFDL0QsV0FBTyxZQUFZLENBQ2pCLEdBQUcsQ0FDRCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFDaEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzdELENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRTtBQUNwRCxnQkFBVSxFQUFWLFVBQVU7QUFDViwrQkFBeUIsRUFBekIseUJBQXlCO0tBQzFCLENBQUMsQ0FBQztHQUNSOztBQXhGRyxTQUFPLFdBMEZYLHVCQUF1QixHQUFBLFVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNuQyxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxJQUFJLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7R0FDdkQ7O0FBNUZHLFNBQU8sV0E4Rlgsa0JBQWtCLEdBQUEsVUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUNuQyxXQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7R0FDbkQ7O0FBaEdHLFNBQU8sV0FrR1gsdUJBQXVCLEdBQUEsVUFBQyxJQUFJLEVBQUU7QUFDNUIsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7R0FDckM7O0FBcEdHLFNBQU8sV0FzR1gsc0JBQXNCLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtBQUN2QyxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztHQUM5RDs7QUF4R0csU0FBTyxXQTBHWCxvQkFBb0IsR0FBQSxVQUFDLElBQUksRUFBRTtBQUN6QixXQUFPLElBQUksRUFBRSxDQUFDO0dBQ2Y7O0FBNUdHLFNBQU8sV0E4R1gseUJBQXlCLEdBQUEsVUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQzFDLFdBQU8sR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLHlCQUF5QixHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0dBQy9GOztBQWhIRyxTQUFPLFdBa0hYLG9CQUFvQixHQUFBLFVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQzVDLFdBQU8sWUFBWSxDQUNqQixHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUMzRSxFQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBQyxDQUFDLENBQUM7R0FDcEQ7O0FBdEhHLFNBQU8sV0F3SFgsa0JBQWtCLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ2pELFdBQU8sWUFBWSxDQUNqQixHQUFHLENBQ0QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUNSLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsRUFDM0csSUFBSSxDQUFDLEVBQ0w7QUFDRSx5QkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CO0tBQzlDLENBQUMsQ0FBQztHQUNSOztBQWpJRyxTQUFPLFdBbUlYLGtCQUFrQixHQUFBLFVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUU7QUFDbkQsUUFBSSxjQUFjLENBQUMsTUFBTSxFQUFFO0FBQ3pCLG9CQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsMEJBQTBCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN2RjtBQUNELFdBQU8sR0FBRyxzQkFBSSxVQUFVLGtCQUFLLGNBQWMsR0FBQyxDQUFDO0dBQzlDOztBQXhJRyxTQUFPLFdBMElYLHlCQUF5QixHQUFBLFVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ2hELFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0dBQ3JFOztBQTVJRyxTQUFPLFdBOElYLHdCQUF3QixHQUFBLFVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQy9DLFFBQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUQsUUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztBQUNoRSxTQUFLLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLFdBQU8sS0FBSyxDQUFDO0dBQ2Q7O0FBbkpHLFNBQU8sV0FxSlgsWUFBWSxHQUFBLFVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7QUFDNUIsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztHQUN4RDs7QUF2SkcsU0FBTyxXQXlKWCxnQkFBZ0IsR0FBQSxVQUFDLElBQUksRUFBRTtBQUNyQixXQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDckI7O0FBM0pHLFNBQU8sV0E2SlgsMEJBQTBCLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3JDLFdBQU8sSUFBSSxDQUFDO0dBQ2I7O0FBL0pHLFNBQU8sV0FpS1gsaUJBQWlCLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUU7QUFDbkQsUUFBSSxTQUFTLElBQUksVUFBVSxDQUFDLG1CQUFtQixFQUFFO0FBQy9DLGdCQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ2hDO0FBQ0QsV0FBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUN0RixFQUFDLG1CQUFtQixFQUFFLFNBQVMsR0FBRyxTQUFTLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxFQUFDLENBQUMsQ0FBQztHQUM1RTs7QUF4S0csU0FBTyxXQTBLWCxzQkFBc0IsR0FBQSxVQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQ3hDLFdBQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFDLENBQUMsQ0FBQztHQUNoRzs7QUE1S0csU0FBTyxXQThLWCw4QkFBOEIsR0FBQSxVQUFDLElBQUksRUFBRTtBQUNuQyxXQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7R0FDakM7O0FBaExHLFNBQU8sV0FrTFgsMkJBQTJCLEdBQUEsVUFBQyxJQUFJLEVBQUU7QUFDaEMsV0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7R0FDbEI7O0FBcExHLFNBQU8sV0FzTFgsOEJBQThCLEdBQUEsVUFBQyxJQUFJLEVBQUU7QUFDbkMsV0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDdEM7O0FBeExHLFNBQU8sV0EwTFgsNkJBQTZCLEdBQUEsVUFBQyxJQUFJLEVBQUU7QUFDbEMsV0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0dBQ3RCOztBQTVMRyxTQUFPLFdBOExYLDZCQUE2QixHQUFBLFVBQUMsSUFBSSxFQUFFO0FBQ2xDLFdBQU8sQ0FBQyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0dBQzNDOztBQWhNRyxTQUFPLFdBa01YLG1CQUFtQixHQUFBLFVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDdEMsUUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FDM0UsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDdEY7O0FBdE1HLFNBQU8sV0F3TVgsc0JBQXNCLEdBQUEsVUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQ3ZDLFFBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUN4QyxTQUFLLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLFdBQU8sS0FBSyxDQUFDO0dBQ2Q7O0FBNU1HLFNBQU8sV0E4TVgsdUJBQXVCLEdBQUEsVUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ3JDLFdBQU8sWUFBWSxDQUNqQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsRUFDcEUsRUFBQyx5QkFBeUIsRUFBRSxPQUFPLENBQUMseUJBQXlCLEVBQUMsQ0FBQyxDQUFDO0dBQ25FOztBQWxORyxTQUFPLFdBb05YLHNCQUFzQixHQUFBLFVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUNwQyxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0dBQzdFOztBQXRORyxTQUFPLFdBd05YLGtCQUFrQixHQUFBLFVBQUMsSUFBSSxFQUFFO0FBQ3ZCLFFBQUksSUFBSSxDQUFDLElBQUksSUFBSSxRQUFRLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxZQUFZLEVBQUU7QUFDdEQsYUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0tBQ2pDO0FBQ0QsV0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztHQUN0Qzs7QUE3TkcsU0FBTyxXQStOWCxxQkFBcUIsR0FBQSxVQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDcEMsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFFBQVEsSUFBSSxLQUFLLEVBQUUsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0dBQ3hEOztBQWpPRyxTQUFPLFdBbU9YLFlBQVksR0FBQSxVQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDdkIsV0FBTyxJQUFJLENBQUM7R0FDYjs7QUFyT0csU0FBTyxXQXVPWCxZQUFZLEdBQUEsVUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7QUFDdkMsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDMUQ7O0FBek9HLFNBQU8sV0EyT1gsNEJBQTRCLEdBQUEsVUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRTtBQUNuRCxRQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNqRixTQUFLLENBQUMseUJBQXlCLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFDO0FBQ25FLFdBQU8sS0FBSyxDQUFDO0dBQ2Q7O0FBL09HLFNBQU8sV0FpUFgsZ0JBQWdCLEdBQUEsVUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUN2QyxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLHNCQUFJLFVBQVUsRUFBQyxDQUFDLENBQUM7R0FDekQ7O0FBblBHLFNBQU8sV0FxUFgsbUJBQW1CLEdBQUEsVUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQ3BDLFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxzQkFBSSxVQUFVLEVBQUMsQ0FBQyxDQUFDO0dBQ3REOztBQXZQRyxTQUFPLFdBeVBYLHFCQUFxQixHQUFBLFVBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUU7QUFDL0MsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxzQkFBSSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUM7R0FDcEU7O0FBM1BHLFNBQU8sV0E2UFgsZ0NBQWdDLEdBQUEsVUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUU7QUFDekYsV0FBTyxHQUFHLENBQ1IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUNYLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFDbkIsS0FBSyxDQUFDLEdBQUcsc0JBQUksS0FBSyxVQUFFLFdBQVcsWUFBSyxnQkFBZ0IsR0FBQyxDQUFDLENBQUMsQ0FBQztHQUMzRDs7QUFsUUcsU0FBTyxXQW9RWCxvQkFBb0IsR0FBQSxVQUFDLElBQUksRUFBRTtBQUN6QixXQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztHQUNsQjs7QUF0UUcsU0FBTyxXQXdRWCxvQkFBb0IsR0FBQSxVQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDbkMsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0dBQzVDOztBQTFRRyxTQUFPLFdBNFFYLHVCQUF1QixHQUFBLFVBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7QUFDaEQsV0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztHQUMxQzs7QUE5UUcsU0FBTyxXQWdSWCx5QkFBeUIsR0FBQSxVQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRTtBQUM3RCxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7R0FDOUU7O0FBbFJHLFNBQU8sV0FvUlgsc0JBQXNCLEdBQUEsVUFBQyxJQUFJLEVBQUU7QUFDM0IsUUFBSSxJQUFJLEdBQUcsWUFBWSxLQUFLLElBQUksQ0FBQyxLQUFLLEdBQUcsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN6RSxXQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0dBQzdDOztBQXZSRyxTQUFPLFdBeVJYLHdCQUF3QixHQUFBLFVBQUMsSUFBSSxFQUFFO0FBQzdCLFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7R0FDM0M7O0FBM1JHLFNBQU8sV0E2UlgseUJBQXlCLEdBQUEsVUFBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO0FBQzNDLFdBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7R0FDakQ7O0FBL1JHLFNBQU8sV0FpU1gsa0NBQWtDLEdBQUEsVUFBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO0FBQ3BELFdBQU8sR0FBRyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0dBQ25DOztBQW5TRyxTQUFPLFdBcVNYLHdCQUF3QixHQUFBLFVBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUU7QUFDdkMsUUFBSSxVQUFVLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQ2hFLFFBQUksSUFBSSxFQUFFO0FBQ1IsVUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLFlBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDcEIsTUFBTTtBQUNMLFlBQUksR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDN0I7S0FDRjtBQUNELFdBQU8sWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFDLFVBQVUsRUFBVixVQUFVLEVBQUMsQ0FBQyxDQUFDO0dBQ3ZEOztBQS9TRyxTQUFPLFdBaVRYLG9CQUFvQixHQUFBLFVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDckMsV0FBTyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUMsQ0FBQyxDQUFDO0dBQzFHOztBQW5URyxTQUFPLFdBcVRYLG1CQUFtQixHQUFBLFVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDdEMsV0FBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUNuQyxFQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBQyxDQUFDLENBQUM7R0FDcEQ7O1NBelRHLE9BQU87OztBQTRUYixJQUFNLFFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBQSxDQUFDIiwiZmlsZSI6InNyYy9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCByZWR1Y2UgZnJvbSBcInNoaWZ0LXJlZHVjZXJcIjtcbmltcG9ydCAqIGFzIG9iamVjdEFzc2lnbiBmcm9tIFwib2JqZWN0LWFzc2lnblwiO1xuaW1wb3J0IHtUb2tlblN0cmVhbX0gZnJvbSBcIi4vdG9rZW5fc3RyZWFtXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvZGVHZW4oc2NyaXB0KSB7XG4gIGxldCB0cyA9IG5ldyBUb2tlblN0cmVhbTtcbiAgbGV0IHJlcCA9IHJlZHVjZShJTlNUQU5DRSwgc2NyaXB0KTtcbiAgcmVwLmVtaXQodHMpO1xuICByZXR1cm4gdHMucmVzdWx0O1xufVxuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBQcmVmaXg6IDEzLFxuICBQb3N0Zml4OiAxNCxcbiAgTmV3OiAxNSxcbiAgQ2FsbDogMTYsXG4gIFRhZ2dlZFRlbXBsYXRlOiAxNyxcbiAgTWVtYmVyOiAxOCxcbiAgUHJpbWFyeTogMTlcbn07XG5cbmNvbnN0IEJpbmFyeVByZWNlZGVuY2UgPSB7XG4gIFwiLFwiOiBQcmVjZWRlbmNlLlNlcXVlbmNlLFxuICBcInx8XCI6IFByZWNlZGVuY2UuTG9naWNhbE9SLFxuICBcIiYmXCI6IFByZWNlZGVuY2UuTG9naWNhbEFORCxcbiAgXCJ8XCI6IFByZWNlZGVuY2UuQml0d2lzZU9SLFxuICBcIl5cIjogUHJlY2VkZW5jZS5CaXR3aXNlWE9SLFxuICBcIiZcIjogUHJlY2VkZW5jZS5CaXR3aXNlQU5ELFxuICBcIj09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCI9PT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCI8XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI8PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPj1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluXCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpbnN0YW5jZW9mXCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI8PFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCI+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCI+Pj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiK1wiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIi1cIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCIqXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiJVwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIi9cIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZVxufTtcblxuZnVuY3Rpb24gZ2V0UHJlY2VkZW5jZShub2RlKSB7XG4gIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxOdWxsRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUHJpbWFyeTtcblxuICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuQXNzaWdubWVudDtcblxuICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLkNvbmRpdGlvbmFsO1xuXG4gICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBzd2l0Y2ggKG5vZGUub2JqZWN0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgICByZXR1cm4gZ2V0UHJlY2VkZW5jZShub2RlLm9iamVjdCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIFByZWNlZGVuY2UuTWVtYmVyO1xuICAgICAgfVxuXG4gICAgY2FzZSBcIkJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBCaW5hcnlQcmVjZWRlbmNlW25vZGUub3BlcmF0b3JdO1xuXG4gICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5DYWxsO1xuICAgIGNhc2UgXCJOZXdFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gbm9kZS5hcmd1bWVudHMubGVuZ3RoID09PSAwID8gUHJlY2VkZW5jZS5OZXcgOiBQcmVjZWRlbmNlLk1lbWJlcjtcbiAgICBjYXNlIFwiUG9zdGZpeEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLlBvc3RmaXg7XG4gICAgY2FzZSBcIlByZWZpeEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLlByZWZpeDtcbiAgfVxufVxuXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmdMaXRlcmFsKHN0cmluZ1ZhbHVlKSB7XG4gIGxldCByZXN1bHQgPSBcIlwiO1xuICByZXN1bHQgKz0gKCdcIicpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmluZ1ZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoID0gc3RyaW5nVmFsdWUuY2hhckF0KGkpO1xuICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgIGNhc2UgXCJcXGJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXGJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx0XCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx0XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcblwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcblwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUwMDBCXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx2XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTAwMENcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXGZcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxyXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxyXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcXCJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXFxcXCJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxcXFwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcXFxcXFwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUyMDI4XCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx1MjAyOFwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUyMDI5XCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx1MjAyOVwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJlc3VsdCArPSBjaDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJlc3VsdCArPSAnXCInO1xuICByZXR1cm4gcmVzdWx0LnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIHAobm9kZSwgcHJlY2VkZW5jZSwgYSkge1xuICByZXR1cm4gZ2V0UHJlY2VkZW5jZShub2RlKSA8IHByZWNlZGVuY2UgPyBwYXJlbihhKSA6IGE7XG59XG5cbmNsYXNzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmNvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB0aGlzLmNvbnRhaW5zR3JvdXAgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBmYWxzZTtcbiAgICB0aGlzLmVuZHNXaXRoTWlzc2luZ0Vsc2UgPSBmYWxzZTtcbiAgfVxuXG4gIGVtaXQoc3RyZWFtLCBub0luKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG59XG5cbmNsYXNzIEVtcHR5IGV4dGVuZHMgQ29kZVJlcCB7XG4gIGVtaXQoKSB7fVxufVxuXG5jbGFzcyBUb2tlbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3Rvcih0b2tlbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy50b2tlbiA9IHRva2VuO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dCh0aGlzLnRva2VuKTtcbiAgfVxufVxuXG5jbGFzcyBOdW1iZXJDb2RlUmVwIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKG51bWJlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5udW1iZXIgPSBudW1iZXI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0TnVtYmVyKHRoaXMubnVtYmVyKTtcbiAgfVxufVxuXG5jbGFzcyBQYXJlbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIihcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCIpXCIpO1xuICB9XG59XG5cbmNsYXNzIEJyYWNrZXQgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXQoXCJbXCIpO1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgdHMucHV0KFwiXVwiKTtcbiAgfVxufVxuXG5jbGFzcyBCcmFjZSBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIntcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCJ9XCIpO1xuICB9XG59XG5cbmNsYXNzIE5vSW4gZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgdHJ1ZSk7XG4gIH1cbn1cblxuY2xhc3MgQ29udGFpbnNJbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIGlmIChub0luKSB7XG4gICAgICB0cy5wdXQoXCIoXCIpO1xuICAgICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICAgIHRzLnB1dChcIilcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIFNlcSBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihjaGlsZHJlbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjciA9PiBjci5lbWl0KHRzLCBub0luKSk7XG4gIH1cbn1cblxuY2xhc3MgU2VtaSBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoXCI7XCIpO1xuICB9XG59XG5cbmNsYXNzIENvbW1hU2VwIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGNoaWxkcmVuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goKGNyKSA9PiB7XG4gICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRzLnB1dChcIixcIik7XG4gICAgICB9XG4gICAgICBjci5lbWl0KHRzLCBub0luKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBTZW1pT3AgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dE9wdGlvbmFsU2VtaSgpO1xuICB9XG59XG5cbmNsYXNzIEluaXQgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoYmluZGluZywgaW5pdCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5iaW5kaW5nID0gYmluZGluZztcbiAgICB0aGlzLmluaXQgPSBpbml0O1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIHRoaXMuYmluZGluZy5lbWl0KHRzKTtcbiAgICBpZiAodGhpcy5pbml0ICE9IG51bGwpIHtcbiAgICAgIHRzLnB1dChcIj1cIik7XG4gICAgICB0aGlzLmluaXQuZW1pdCh0cywgbm9Jbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHQodG9rZW4pIHtcbiAgcmV0dXJuIG5ldyBUb2tlbih0b2tlbik7XG59XG5cbmZ1bmN0aW9uIHBhcmVuKHJlcCkge1xuICByZXR1cm4gbmV3IFBhcmVuKHJlcCk7XG59XG5cbmZ1bmN0aW9uIGJyYWNrZXQocmVwKSB7XG4gIHJldHVybiBuZXcgQnJhY2tldChyZXApO1xufVxuXG5mdW5jdGlvbiBub0luKHJlcCkge1xuICByZXR1cm4gbmV3IE5vSW4ocmVwKTtcbn1cblxuZnVuY3Rpb24gbWFya0NvbnRhaW5zSW4oc3RhdGUpIHtcbiAgcmV0dXJuIHN0YXRlLmNvbnRhaW5zSW4gPyBuZXcgQ29udGFpbnNJbihzdGF0ZSkgOiBzdGF0ZTtcbn1cblxuZnVuY3Rpb24gc2VxKC4uLnJlcHMpIHtcbiAgcmV0dXJuIG5ldyBTZXEocmVwcyk7XG59XG5cbmZ1bmN0aW9uIHNlbWkoKSB7XG4gIHJldHVybiBuZXcgU2VtaTtcbn1cblxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBuZXcgRW1wdHk7XG59XG5cbmZ1bmN0aW9uIGNvbW1hU2VwKHBpZWNlcykge1xuICByZXR1cm4gbmV3IENvbW1hU2VwKHBpZWNlcyk7XG59XG5cbmZ1bmN0aW9uIGJyYWNlKHJlcCkge1xuICByZXR1cm4gbmV3IEJyYWNlKHJlcCk7XG59XG5cbmZ1bmN0aW9uIHNlbWlPcCgpIHtcbiAgcmV0dXJuIG5ldyBTZW1pT3A7XG59XG5cbmZ1bmN0aW9uIHBhcmVuVG9Bdm9pZEJlaW5nRGlyZWN0aXZlKGVsZW1lbnQsIG9yaWdpbmFsKSB7XG4gIGlmIChlbGVtZW50ICYmIGVsZW1lbnQudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIgJiYgZWxlbWVudC5leHByZXNzaW9uLnR5cGUgPT09IFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIikge1xuICAgIHJldHVybiBzZXEocGFyZW4ob3JpZ2luYWwuY2hpbGRyZW5bMF0pLCBzZW1pT3AoKSk7XG4gIH1cbiAgcmV0dXJuIG9yaWdpbmFsO1xufVxuXG5mdW5jdGlvbiBnZXRBc3NpZ25tZW50RXhwcihzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUgPyAoc3RhdGUuY29udGFpbnNHcm91cCA/IHBhcmVuKHN0YXRlKSA6IHN0YXRlKSA6IGVtcHR5KCk7XG59XG5cbmNsYXNzIENvZGVHZW4ge1xuXG4gIHJlZHVjZUFycmF5RXhwcmVzc2lvbihub2RlLCBlbGVtZW50cykge1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFja2V0KGVtcHR5KCkpO1xuICAgIH1cblxuICAgIGxldCBjb250ZW50ID0gY29tbWFTZXAoZWxlbWVudHMubWFwKGdldEFzc2lnbm1lbnRFeHByKSk7XG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA+IDAgJiYgZWxlbWVudHNbZWxlbWVudHMubGVuZ3RoIC0gMV0gPT0gbnVsbCkge1xuICAgICAgY29udGVudCA9IHNlcShjb250ZW50LCB0KFwiLFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBicmFja2V0KGNvbnRlbnQpO1xuICB9XG5cbiAgcmVkdWNlQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSwgYmluZGluZywgZXhwcmVzc2lvbikge1xuICAgIGxldCByaWdodENvZGUgPSBleHByZXNzaW9uO1xuICAgIGxldCBjb250YWluc0luID0gZXhwcmVzc2lvbi5jb250YWluc0luO1xuICAgIGxldCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gYmluZGluZy5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUuZXhwcmVzc2lvbikgPCBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICByaWdodENvZGUgPSBwYXJlbihyaWdodENvZGUpO1xuICAgICAgY29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcShiaW5kaW5nLCB0KG5vZGUub3BlcmF0b3IpLCByaWdodENvZGUpLCB7Y29udGFpbnNJbiwgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlQmluYXJ5RXhwcmVzc2lvbihub2RlLCBsZWZ0LCByaWdodCkge1xuICAgIGxldCBsZWZ0Q29kZSA9IGxlZnQ7XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBsZWZ0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgbGV0IGxlZnRDb250YWluc0luID0gbGVmdC5jb250YWluc0luO1xuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUubGVmdCkgPCBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICBsZWZ0Q29kZSA9IHBhcmVuKGxlZnRDb2RlKTtcbiAgICAgIHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBmYWxzZTtcbiAgICAgIGxlZnRDb250YWluc0luID0gZmFsc2U7XG4gICAgfVxuICAgIGxldCByaWdodENvZGUgPSByaWdodDtcbiAgICBsZXQgcmlnaHRDb250YWluc0luID0gcmlnaHQuY29udGFpbnNJbjtcbiAgICBpZiAoZ2V0UHJlY2VkZW5jZShub2RlLnJpZ2h0KSA8PSBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICByaWdodENvZGUgPSBwYXJlbihyaWdodENvZGUpO1xuICAgICAgcmlnaHRDb250YWluc0luID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEobGVmdENvZGUsIHQobm9kZS5vcGVyYXRvciksIHJpZ2h0Q29kZSksXG4gICAgICB7XG4gICAgICAgIGNvbnRhaW5zSW46IGxlZnRDb250YWluc0luIHx8IHJpZ2h0Q29udGFpbnNJbiB8fCBub2RlLm9wZXJhdG9yID09PSBcImluXCIsXG4gICAgICAgIGNvbnRhaW5zR3JvdXA6IG5vZGUub3BlcmF0b3IgPT0gXCIsXCIsXG4gICAgICAgIHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHlcbiAgICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlQmxvY2sobm9kZSwgc3RhdGVtZW50cykge1xuICAgIHJldHVybiBicmFjZShzZXEoLi4uc3RhdGVtZW50cykpO1xuICB9XG5cbiAgcmVkdWNlQmxvY2tTdGF0ZW1lbnQobm9kZSwgYmxvY2spIHtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cblxuICByZWR1Y2VCcmVha1N0YXRlbWVudChub2RlLCBsYWJlbCkge1xuICAgIHJldHVybiBzZXEodChcImJyZWFrXCIpLCBsYWJlbCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VDYWxsRXhwcmVzc2lvbihub2RlLCBjYWxsZWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHAobm9kZS5jYWxsZWUsIGdldFByZWNlZGVuY2Uobm9kZSksIGNhbGxlZSksIHBhcmVuKGNvbW1hU2VwKGFyZ3MpKSksXG4gICAgICB7c3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTogY2FsbGVlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHl9KTtcbiAgfVxuXG4gIHJlZHVjZUNhdGNoQ2xhdXNlKG5vZGUsIHBhcmFtLCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiY2F0Y2hcIiksIHBhcmVuKHBhcmFtKSwgYm9keSk7XG4gIH1cblxuICByZWR1Y2VDb21wdXRlZE1lbWJlckV4cHJlc3Npb24obm9kZSwgb2JqZWN0LCBleHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShwKG5vZGUub2JqZWN0LCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBvYmplY3QpLCBicmFja2V0KGV4cHJlc3Npb24pKSxcbiAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBvYmplY3Quc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKG5vZGUsIHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSkge1xuICAgIGxldCBjb250YWluc0luID0gdGVzdC5jb250YWluc0luIHx8IGFsdGVybmF0ZS5jb250YWluc0luO1xuICAgIGxldCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gdGVzdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEoXG4gICAgICAgIHAobm9kZS50ZXN0LCBQcmVjZWRlbmNlLkxvZ2ljYWxPUiwgdGVzdCksIHQoXCI/XCIpLFxuICAgICAgICBwKG5vZGUuY29uc2VxdWVudCwgUHJlY2VkZW5jZS5Bc3NpZ25tZW50LCBjb25zZXF1ZW50KSwgdChcIjpcIiksXG4gICAgICAgIHAobm9kZS5hbHRlcm5hdGUsIFByZWNlZGVuY2UuQXNzaWdubWVudCwgYWx0ZXJuYXRlKSksIHtcbiAgICAgICAgICBjb250YWluc0luLFxuICAgICAgICAgIHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHlcbiAgICAgICAgfSk7XG4gIH1cblxuICByZWR1Y2VDb250aW51ZVN0YXRlbWVudChub2RlLCBsYWJlbCkge1xuICAgIHJldHVybiBzZXEodChcImNvbnRpbnVlXCIpLCBsYWJlbCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VEYXRhUHJvcGVydHkobm9kZSwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBzZXEoa2V5LCB0KFwiOlwiKSwgZ2V0QXNzaWdubWVudEV4cHIodmFsdWUpKTtcbiAgfVxuXG4gIHJlZHVjZURlYnVnZ2VyU3RhdGVtZW50KG5vZGUpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJkZWJ1Z2dlclwiKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRG9XaGlsZVN0YXRlbWVudChub2RlLCBib2R5LCB0ZXN0KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZG9cIiksIGJvZHksIHQoXCJ3aGlsZVwiKSwgcGFyZW4odGVzdCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZUVtcHR5U3RhdGVtZW50KG5vZGUpIHtcbiAgICByZXR1cm4gc2VtaSgpO1xuICB9XG5cbiAgcmVkdWNlRXhwcmVzc2lvblN0YXRlbWVudChub2RlLCBleHByZXNzaW9uKSB7XG4gICAgcmV0dXJuIHNlcSgoZXhwcmVzc2lvbi5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID8gcGFyZW4oZXhwcmVzc2lvbikgOiBleHByZXNzaW9uKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRm9ySW5TdGF0ZW1lbnQobm9kZSwgbGVmdCwgcmlnaHQsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHQoXCJmb3JcIiksIHBhcmVuKHNlcShub0luKG1hcmtDb250YWluc0luKGxlZnQpKSwgdChcImluXCIpLCByaWdodCkpLCBib2R5KSxcbiAgICAgIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZUZvclN0YXRlbWVudChub2RlLCBpbml0LCB0ZXN0LCB1cGRhdGUsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKFxuICAgICAgICB0KFwiZm9yXCIpLFxuICAgICAgICBwYXJlbihzZXEoaW5pdCA/IG5vSW4obWFya0NvbnRhaW5zSW4oaW5pdCkpIDogZW1wdHkoKSwgc2VtaSgpLCB0ZXN0IHx8IGVtcHR5KCksIHNlbWkoKSwgdXBkYXRlIHx8IGVtcHR5KCkpKSxcbiAgICAgICAgYm9keSksXG4gICAgICAgIHtcbiAgICAgICAgICBlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2VcbiAgICAgICAgfSk7XG4gIH1cblxuICByZWR1Y2VGdW5jdGlvbkJvZHkobm9kZSwgZGlyZWN0aXZlcywgc291cmNlRWxlbWVudHMpIHtcbiAgICBpZiAoc291cmNlRWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICBzb3VyY2VFbGVtZW50c1swXSA9IHBhcmVuVG9Bdm9pZEJlaW5nRGlyZWN0aXZlKG5vZGUuc3RhdGVtZW50c1swXSwgc291cmNlRWxlbWVudHNbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gc2VxKC4uLmRpcmVjdGl2ZXMsIC4uLnNvdXJjZUVsZW1lbnRzKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSwgaWQsIHBhcmFtcywgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcImZ1bmN0aW9uXCIpLCBpZCwgcGFyZW4oY29tbWFTZXAocGFyYW1zKSksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRXhwcmVzc2lvbihub2RlLCBpZCwgcGFyYW1zLCBib2R5KSB7XG4gICAgY29uc3QgYXJnQm9keSA9IHNlcShwYXJlbihjb21tYVNlcChwYXJhbXMpKSwgYnJhY2UoYm9keSkpO1xuICAgIGxldCBzdGF0ZSA9IHNlcSh0KFwiZnVuY3Rpb25cIiksIGlkID8gc2VxKGlkLCBhcmdCb2R5KSA6IGFyZ0JvZHkpO1xuICAgIHN0YXRlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0cnVlO1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZUdldHRlcihub2RlLCBrZXksIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJnZXRcIiksIGtleSwgcGFyZW4oZW1wdHkoKSksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXIobm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUubmFtZSk7XG4gIH1cblxuICByZWR1Y2VJZGVudGlmaWVyRXhwcmVzc2lvbihub2RlLCBuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICByZWR1Y2VJZlN0YXRlbWVudChub2RlLCB0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpIHtcbiAgICBpZiAoYWx0ZXJuYXRlICYmIGNvbnNlcXVlbnQuZW5kc1dpdGhNaXNzaW5nRWxzZSkge1xuICAgICAgY29uc2VxdWVudCA9IGJyYWNlKGNvbnNlcXVlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHQoXCJpZlwiKSwgcGFyZW4odGVzdCksIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSA/IHNlcSh0KFwiZWxzZVwiKSwgYWx0ZXJuYXRlKSA6IGVtcHR5KCkpLFxuICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGFsdGVybmF0ZSA/IGFsdGVybmF0ZS5lbmRzV2l0aE1pc3NpbmdFbHNlIDogdHJ1ZX0pO1xuICB9XG5cbiAgcmVkdWNlTGFiZWxlZFN0YXRlbWVudChub2RlLCBsYWJlbCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oc2VxKGxhYmVsLCB0KFwiOlwiKSwgYm9keSksIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQobm9kZS52YWx1ZS50b1N0cmluZygpKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxOdWxsRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoXCJudWxsXCIpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gbmV3IE51bWJlckNvZGVSZXAobm9kZS52YWx1ZSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQobm9kZS52YWx1ZSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoZXNjYXBlU3RyaW5nTGl0ZXJhbChub2RlLnZhbHVlKSk7XG4gIH1cblxuICByZWR1Y2VOZXdFeHByZXNzaW9uKG5vZGUsIGNhbGxlZSwgYXJncykge1xuICAgIGxldCBjYWxsZWVSZXAgPSBnZXRQcmVjZWRlbmNlKG5vZGUuY2FsbGVlKSA9PSBQcmVjZWRlbmNlLkNhbGwgPyBwYXJlbihjYWxsZWUpIDpcbiAgICAgIHAobm9kZS5jYWxsZWUsIGdldFByZWNlZGVuY2Uobm9kZSksIGNhbGxlZSk7XG4gICAgcmV0dXJuIHNlcSh0KFwibmV3XCIpLCBjYWxsZWVSZXAsIGFyZ3MubGVuZ3RoID09PSAwID8gZW1wdHkoKSA6IHBhcmVuKGNvbW1hU2VwKGFyZ3MpKSk7XG4gIH1cblxuICByZWR1Y2VPYmplY3RFeHByZXNzaW9uKG5vZGUsIHByb3BlcnRpZXMpIHtcbiAgICBsZXQgc3RhdGUgPSBicmFjZShjb21tYVNlcChwcm9wZXJ0aWVzKSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IHRydWU7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmVkdWNlUG9zdGZpeEV4cHJlc3Npb24obm9kZSwgb3BlcmFuZCkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEocChub2RlLm9wZXJhbmQsIGdldFByZWNlZGVuY2Uobm9kZSksIG9wZXJhbmQpLCB0KG5vZGUub3BlcmF0b3IpKSxcbiAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBvcGVyYW5kLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHl9KTtcbiAgfVxuXG4gIHJlZHVjZVByZWZpeEV4cHJlc3Npb24obm9kZSwgb3BlcmFuZCkge1xuICAgIHJldHVybiBzZXEodChub2RlLm9wZXJhdG9yKSwgcChub2RlLm9wZXJhbmQsIGdldFByZWNlZGVuY2Uobm9kZSksIG9wZXJhbmQpKTtcbiAgfVxuXG4gIHJlZHVjZVByb3BlcnR5TmFtZShub2RlKSB7XG4gICAgaWYgKG5vZGUua2luZCA9PSBcIm51bWJlclwiIHx8IG5vZGUua2luZCA9PSBcImlkZW50aWZpZXJcIikge1xuICAgICAgcmV0dXJuIHQobm9kZS52YWx1ZS50b1N0cmluZygpKTtcbiAgICB9XG4gICAgcmV0dXJuIHQoSlNPTi5zdHJpbmdpZnkobm9kZS52YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlUmV0dXJuU3RhdGVtZW50KG5vZGUsIGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwicmV0dXJuXCIpLCBhcmd1bWVudCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VTY3JpcHQobm9kZSwgYm9keSkge1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcmVkdWNlU2V0dGVyKG5vZGUsIGtleSwgcGFyYW1ldGVyLCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwic2V0XCIpLCBrZXksIHBhcmVuKHBhcmFtZXRlciksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZVN0YXRpY01lbWJlckV4cHJlc3Npb24obm9kZSwgb2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNvbnN0IHN0YXRlID0gc2VxKHAobm9kZS5vYmplY3QsIGdldFByZWNlZGVuY2Uobm9kZSksIG9iamVjdCksIHQoXCIuXCIpLCBwcm9wZXJ0eSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IG9iamVjdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaENhc2Uobm9kZSwgdGVzdCwgY29uc2VxdWVudCkge1xuICAgIHJldHVybiBzZXEodChcImNhc2VcIiksIHRlc3QsIHQoXCI6XCIpLCBzZXEoLi4uY29uc2VxdWVudCkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoRGVmYXVsdChub2RlLCBjb25zZXF1ZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZGVmYXVsdFwiKSwgdChcIjpcIiksIHNlcSguLi5jb25zZXF1ZW50KSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hTdGF0ZW1lbnQobm9kZSwgZGlzY3JpbWluYW50LCBjYXNlcykge1xuICAgIHJldHVybiBzZXEodChcInN3aXRjaFwiKSwgcGFyZW4oZGlzY3JpbWluYW50KSwgYnJhY2Uoc2VxKC4uLmNhc2VzKSkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQobm9kZSwgZGlzY3JpbWluYW50LCBjYXNlcywgZGVmYXVsdENhc2UsIHBvc3REZWZhdWx0Q2FzZXMpIHtcbiAgICByZXR1cm4gc2VxKFxuICAgICAgdChcInN3aXRjaFwiKSxcbiAgICAgIHBhcmVuKGRpc2NyaW1pbmFudCksXG4gICAgICBicmFjZShzZXEoLi4uY2FzZXMsIGRlZmF1bHRDYXNlLCAuLi5wb3N0RGVmYXVsdENhc2VzKSkpO1xuICB9XG5cbiAgcmVkdWNlVGhpc0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KFwidGhpc1wiKTtcbiAgfVxuXG4gIHJlZHVjZVRocm93U3RhdGVtZW50KG5vZGUsIGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidGhyb3dcIiksIGFyZ3VtZW50LCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VUcnlDYXRjaFN0YXRlbWVudChub2RlLCBibG9jaywgY2F0Y2hDbGF1c2UpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJ0cnlcIiksIGJsb2NrLCBjYXRjaENsYXVzZSk7XG4gIH1cblxuICByZWR1Y2VUcnlGaW5hbGx5U3RhdGVtZW50KG5vZGUsIGJsb2NrLCBjYXRjaENsYXVzZSwgZmluYWxpemVyKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidHJ5XCIpLCBibG9jaywgY2F0Y2hDbGF1c2UgfHwgZW1wdHkoKSwgdChcImZpbmFsbHlcIiksIGZpbmFsaXplcik7XG4gIH1cblxuICByZWR1Y2VVbmtub3duRGlyZWN0aXZlKG5vZGUpIHtcbiAgICB2YXIgbmFtZSA9IFwidXNlIHN0cmljdFwiID09PSBub2RlLnZhbHVlID8gXCJ1c2VcXFxcdTAwMjBzdHJpY3RcIiA6IG5vZGUudmFsdWU7XG4gICAgcmV0dXJuIHNlcSh0KFwiXFxcIlwiICsgbmFtZSArIFwiXFxcIlwiKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlVXNlU3RyaWN0RGlyZWN0aXZlKG5vZGUpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJcXFwidXNlIHN0cmljdFxcXCJcIiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSwgZGVjbGFyYXRvcnMpIHtcbiAgICByZXR1cm4gc2VxKHQobm9kZS5raW5kKSwgY29tbWFTZXAoZGVjbGFyYXRvcnMpKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQobm9kZSwgZGVjbGFyYXRpb24pIHtcbiAgICByZXR1cm4gc2VxKGRlY2xhcmF0aW9uLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0b3Iobm9kZSwgaWQsIGluaXQpIHtcbiAgICBsZXQgY29udGFpbnNJbiA9IGluaXQgJiYgaW5pdC5jb250YWluc0luICYmICFpbml0LmNvbnRhaW5zR3JvdXA7XG4gICAgaWYgKGluaXQpIHtcbiAgICAgIGlmIChpbml0LmNvbnRhaW5zR3JvdXApIHtcbiAgICAgICAgaW5pdCA9IHBhcmVuKGluaXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5pdCA9IG1hcmtDb250YWluc0luKGluaXQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKG5ldyBJbml0KGlkLCBpbml0KSwge2NvbnRhaW5zSW59KTtcbiAgfVxuXG4gIHJlZHVjZVdoaWxlU3RhdGVtZW50KG5vZGUsIHRlc3QsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcSh0KFwid2hpbGVcIiksIHBhcmVuKHRlc3QpLCBib2R5KSwge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlV2l0aFN0YXRlbWVudChub2RlLCBvYmplY3QsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHQoXCJ3aXRoXCIpLCBwYXJlbihvYmplY3QpLCBib2R5KSxcbiAgICAgIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxufVxuXG5jb25zdCBJTlNUQU5DRSA9IG5ldyBDb2RlR2VuO1xuIl19