"use strict";

// istanbul ignore next
var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

// istanbul ignore next
var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

// istanbul ignore next
var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next
var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// istanbul ignore next
var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports["default"] = codeGen;
var reduce = require("shift-reducer")["default"];
var objectAssign = require("object-assign");

var TokenStream = require("./token_stream").TokenStream;
function codeGen(script) {
  var ts = new TokenStream();
  var rep = reduce(INSTANCE, script);
  rep.emit(ts);
  return ts.result;
}

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

function getPrecedence(_x) {
  _function: while (true) {
    var node = _x;
    switch (node.type) {
      case "ArrayExpression":
      case "FunctionExpression":
      case "IdentifierExpression":
      case "LiteralBooleanExpression":
      case "LiteralNullExpression":
      case "LiteralNumericExpression":
      case "LiteralInfinityExpression":
      case "LiteralRegExpExpression":
      case "LiteralStringExpression":
      case "ObjectExpression":
      case "ThisExpression":
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
            _x = node.object;
            continue _function;
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
}

function escapeStringLiteral(stringValue) {
  var result = "";
  result += "\"";
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

var CodeRep = function CodeRep() {
  _classCallCheck(this, CodeRep);

  this.containsIn = false;
  this.containsGroup = false;
  this.startsWithFunctionOrCurly = false;
  this.endsWithMissingElse = false;
};

var Empty = (function (CodeRep) {
  function Empty() {
    _classCallCheck(this, Empty);

    _get(Object.getPrototypeOf(Empty.prototype), "constructor", this).call(this);
  }

  _inherits(Empty, CodeRep);

  _prototypeProperties(Empty, null, {
    emit: {
      value: function emit() {},
      writable: true,
      configurable: true
    }
  });

  return Empty;
})(CodeRep);

var Token = (function (CodeRep) {
  function Token(token) {
    _classCallCheck(this, Token);

    _get(Object.getPrototypeOf(Token.prototype), "constructor", this).call(this);
    this.token = token;
  }

  _inherits(Token, CodeRep);

  _prototypeProperties(Token, null, {
    emit: {
      value: function emit(ts) {
        ts.put(this.token);
      },
      writable: true,
      configurable: true
    }
  });

  return Token;
})(CodeRep);

var NumberCodeRep = (function (CodeRep) {
  function NumberCodeRep(number) {
    _classCallCheck(this, NumberCodeRep);

    _get(Object.getPrototypeOf(NumberCodeRep.prototype), "constructor", this).call(this);
    this.number = number;
  }

  _inherits(NumberCodeRep, CodeRep);

  _prototypeProperties(NumberCodeRep, null, {
    emit: {
      value: function emit(ts) {
        ts.putNumber(this.number);
      },
      writable: true,
      configurable: true
    }
  });

  return NumberCodeRep;
})(CodeRep);

var Paren = (function (CodeRep) {
  function Paren(expr) {
    _classCallCheck(this, Paren);

    _get(Object.getPrototypeOf(Paren.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(Paren, CodeRep);

  _prototypeProperties(Paren, null, {
    emit: {
      value: function emit(ts) {
        ts.put("(");
        this.expr.emit(ts, false);
        ts.put(")");
      },
      writable: true,
      configurable: true
    }
  });

  return Paren;
})(CodeRep);

var Bracket = (function (CodeRep) {
  function Bracket(expr) {
    _classCallCheck(this, Bracket);

    _get(Object.getPrototypeOf(Bracket.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(Bracket, CodeRep);

  _prototypeProperties(Bracket, null, {
    emit: {
      value: function emit(ts) {
        ts.put("[");
        this.expr.emit(ts, false);
        ts.put("]");
      },
      writable: true,
      configurable: true
    }
  });

  return Bracket;
})(CodeRep);

var Brace = (function (CodeRep) {
  function Brace(expr) {
    _classCallCheck(this, Brace);

    _get(Object.getPrototypeOf(Brace.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(Brace, CodeRep);

  _prototypeProperties(Brace, null, {
    emit: {
      value: function emit(ts) {
        ts.put("{");
        this.expr.emit(ts, false);
        ts.put("}");
      },
      writable: true,
      configurable: true
    }
  });

  return Brace;
})(CodeRep);

var NoIn = (function (CodeRep) {
  function NoIn(expr) {
    _classCallCheck(this, NoIn);

    _get(Object.getPrototypeOf(NoIn.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(NoIn, CodeRep);

  _prototypeProperties(NoIn, null, {
    emit: {
      value: function emit(ts) {
        this.expr.emit(ts, true);
      },
      writable: true,
      configurable: true
    }
  });

  return NoIn;
})(CodeRep);

var ContainsIn = (function (CodeRep) {
  function ContainsIn(expr) {
    _classCallCheck(this, ContainsIn);

    _get(Object.getPrototypeOf(ContainsIn.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(ContainsIn, CodeRep);

  _prototypeProperties(ContainsIn, null, {
    emit: {
      value: function emit(ts, noIn) {
        if (noIn) {
          ts.put("(");
          this.expr.emit(ts, false);
          ts.put(")");
        } else {
          this.expr.emit(ts, false);
        }
      },
      writable: true,
      configurable: true
    }
  });

  return ContainsIn;
})(CodeRep);

var Seq = (function (CodeRep) {
  function Seq(children) {
    _classCallCheck(this, Seq);

    _get(Object.getPrototypeOf(Seq.prototype), "constructor", this).call(this);
    this.children = children;
  }

  _inherits(Seq, CodeRep);

  _prototypeProperties(Seq, null, {
    emit: {
      value: function emit(ts, noIn) {
        this.children.forEach(function (cr) {
          return cr.emit(ts, noIn);
        });
      },
      writable: true,
      configurable: true
    }
  });

  return Seq;
})(CodeRep);

var Semi = (function (Token) {
  function Semi() {
    _classCallCheck(this, Semi);

    _get(Object.getPrototypeOf(Semi.prototype), "constructor", this).call(this, ";");
  }

  _inherits(Semi, Token);

  return Semi;
})(Token);

var CommaSep = (function (CodeRep) {
  function CommaSep(children) {
    _classCallCheck(this, CommaSep);

    _get(Object.getPrototypeOf(CommaSep.prototype), "constructor", this).call(this);
    this.children = children;
  }

  _inherits(CommaSep, CodeRep);

  _prototypeProperties(CommaSep, null, {
    emit: {
      value: function emit(ts, noIn) {
        var first = true;
        this.children.forEach(function (cr) {
          if (first) {
            first = false;
          } else {
            ts.put(",");
          }
          cr.emit(ts, noIn);
        });
      },
      writable: true,
      configurable: true
    }
  });

  return CommaSep;
})(CodeRep);

var SemiOp = (function (CodeRep) {
  function SemiOp() {
    _classCallCheck(this, SemiOp);

    _get(Object.getPrototypeOf(SemiOp.prototype), "constructor", this).call(this);
  }

  _inherits(SemiOp, CodeRep);

  _prototypeProperties(SemiOp, null, {
    emit: {
      value: function emit(ts) {
        ts.putOptionalSemi();
      },
      writable: true,
      configurable: true
    }
  });

  return SemiOp;
})(CodeRep);

var Init = (function (CodeRep) {
  function Init(binding, init) {
    _classCallCheck(this, Init);

    _get(Object.getPrototypeOf(Init.prototype), "constructor", this).call(this);
    this.binding = binding;
    this.init = init;
  }

  _inherits(Init, CodeRep);

  _prototypeProperties(Init, null, {
    emit: {
      value: function emit(ts, noIn) {
        this.binding.emit(ts);
        if (this.init != null) {
          ts.put("=");
          this.init.emit(ts, noIn);
        }
      },
      writable: true,
      configurable: true
    }
  });

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
  for (var _len = arguments.length, reps = Array(_len), _key = 0; _key < _len; _key++) {
    reps[_key] = arguments[_key];
  }

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
  return state ? state.containsGroup ? paren(state) : state : empty();
}

var CodeGen = (function () {
  function CodeGen() {
    _classCallCheck(this, CodeGen);
  }

  _prototypeProperties(CodeGen, null, {
    reduceArrayExpression: {
      value: function reduceArrayExpression(node, elements) {
        if (elements.length === 0) {
          return bracket(empty());
        }

        var content = commaSep(elements.map(getAssignmentExpr));
        if (elements.length > 0 && elements[elements.length - 1] == null) {
          content = seq(content, t(","));
        }
        return bracket(content);
      },
      writable: true,
      configurable: true
    },
    reduceAssignmentExpression: {
      value: function reduceAssignmentExpression(node, binding, expression) {
        var leftCode = binding;
        var rightCode = expression;
        var containsIn = expression.containsIn;
        var startsWithFunctionOrCurly = binding.startsWithFunctionOrCurly;
        if (getPrecedence(node.binding) < Precedence.New) {
          leftCode = paren(leftCode);
          startsWithFunctionOrCurly = false;
        }
        if (getPrecedence(node.expression) < getPrecedence(node)) {
          rightCode = paren(rightCode);
          containsIn = false;
        }
        return objectAssign(seq(leftCode, t(node.operator), rightCode), { containsIn: containsIn, startsWithFunctionOrCurly: startsWithFunctionOrCurly });
      },
      writable: true,
      configurable: true
    },
    reduceBinaryExpression: {
      value: function reduceBinaryExpression(node, left, right) {
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
      },
      writable: true,
      configurable: true
    },
    reduceBlock: {
      value: function reduceBlock(node, statements) {
        return brace(seq.apply(undefined, _toConsumableArray(statements)));
      },
      writable: true,
      configurable: true
    },
    reduceBlockStatement: {
      value: function reduceBlockStatement(node, block) {
        return block;
      },
      writable: true,
      configurable: true
    },
    reduceBreakStatement: {
      value: function reduceBreakStatement(node, label) {
        return seq(t("break"), label || empty(), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceCallExpression: {
      value: function reduceCallExpression(node, callee, args) {
        return objectAssign(seq(p(node.callee, getPrecedence(node), callee), paren(commaSep(args))), { startsWithFunctionOrCurly: callee.startsWithFunctionOrCurly });
      },
      writable: true,
      configurable: true
    },
    reduceCatchClause: {
      value: function reduceCatchClause(node, param, body) {
        return seq(t("catch"), paren(param), body);
      },
      writable: true,
      configurable: true
    },
    reduceComputedMemberExpression: {
      value: function reduceComputedMemberExpression(node, object, expression) {
        return objectAssign(seq(p(node.object, getPrecedence(node), object), bracket(expression)), { startsWithFunctionOrCurly: object.startsWithFunctionOrCurly });
      },
      writable: true,
      configurable: true
    },
    reduceConditionalExpression: {
      value: function reduceConditionalExpression(node, test, consequent, alternate) {
        var containsIn = test.containsIn || alternate.containsIn;
        var startsWithFunctionOrCurly = test.startsWithFunctionOrCurly;
        return objectAssign(seq(p(node.test, Precedence.LogicalOR, test), t("?"), p(node.consequent, Precedence.Assignment, consequent), t(":"), p(node.alternate, Precedence.Assignment, alternate)), {
          containsIn: containsIn,
          startsWithFunctionOrCurly: startsWithFunctionOrCurly
        });
      },
      writable: true,
      configurable: true
    },
    reduceContinueStatement: {
      value: function reduceContinueStatement(node, label) {
        return seq(t("continue"), label || empty(), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceDataProperty: {
      value: function reduceDataProperty(node, key, value) {
        return seq(key, t(":"), getAssignmentExpr(value));
      },
      writable: true,
      configurable: true
    },
    reduceDebuggerStatement: {
      value: function reduceDebuggerStatement(node) {
        return seq(t("debugger"), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceDoWhileStatement: {
      value: function reduceDoWhileStatement(node, body, test) {
        return seq(t("do"), body, t("while"), paren(test), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceEmptyStatement: {
      value: function reduceEmptyStatement(node) {
        return semi();
      },
      writable: true,
      configurable: true
    },
    reduceExpressionStatement: {
      value: function reduceExpressionStatement(node, expression) {
        return seq(expression.startsWithFunctionOrCurly ? paren(expression) : expression, semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceForInStatement: {
      value: function reduceForInStatement(node, left, right, body) {
        var leftP = node.left.type === "VariableDeclaration" ? left : p(node.left, Precedence.New, left);
        return objectAssign(seq(t("for"), paren(seq(noIn(markContainsIn(leftP)), t("in"), right)), body), { endsWithMissingElse: body.endsWithMissingElse });
      },
      writable: true,
      configurable: true
    },
    reduceForStatement: {
      value: function reduceForStatement(node, init, test, update, body) {
        return objectAssign(seq(t("for"), paren(seq(init ? noIn(markContainsIn(init)) : empty(), semi(), test || empty(), semi(), update || empty())), body), {
          endsWithMissingElse: body.endsWithMissingElse
        });
      },
      writable: true,
      configurable: true
    },
    reduceFunctionBody: {
      value: function reduceFunctionBody(node, directives, sourceElements) {
        if (sourceElements.length) {
          sourceElements[0] = parenToAvoidBeingDirective(node.statements[0], sourceElements[0]);
        }
        return seq.apply(undefined, _toConsumableArray(directives).concat(_toConsumableArray(sourceElements)));
      },
      writable: true,
      configurable: true
    },
    reduceFunctionDeclaration: {
      value: function reduceFunctionDeclaration(node, id, params, body) {
        return seq(t("function"), id, paren(commaSep(params)), brace(body));
      },
      writable: true,
      configurable: true
    },
    reduceFunctionExpression: {
      value: function reduceFunctionExpression(node, id, params, body) {
        var argBody = seq(paren(commaSep(params)), brace(body));
        var state = seq(t("function"), id ? seq(id, argBody) : argBody);
        state.startsWithFunctionOrCurly = true;
        return state;
      },
      writable: true,
      configurable: true
    },
    reduceGetter: {
      value: function reduceGetter(node, key, body) {
        return seq(t("get"), key, paren(empty()), brace(body));
      },
      writable: true,
      configurable: true
    },
    reduceIdentifier: {
      value: function reduceIdentifier(node) {
        return t(node.name);
      },
      writable: true,
      configurable: true
    },
    reduceIdentifierExpression: {
      value: function reduceIdentifierExpression(node, name) {
        return name;
      },
      writable: true,
      configurable: true
    },
    reduceIfStatement: {
      value: function reduceIfStatement(node, test, consequent, alternate) {
        if (alternate && consequent.endsWithMissingElse) {
          consequent = brace(consequent);
        }
        return objectAssign(seq(t("if"), paren(test), consequent, alternate ? seq(t("else"), alternate) : empty()), { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
      },
      writable: true,
      configurable: true
    },
    reduceLabeledStatement: {
      value: function reduceLabeledStatement(node, label, body) {
        return objectAssign(seq(label, t(":"), body), { endsWithMissingElse: body.endsWithMissingElse });
      },
      writable: true,
      configurable: true
    },
    reduceLiteralBooleanExpression: {
      value: function reduceLiteralBooleanExpression(node) {
        return t(node.value.toString());
      },
      writable: true,
      configurable: true
    },
    reduceLiteralNullExpression: {
      value: function reduceLiteralNullExpression(node) {
        return t("null");
      },
      writable: true,
      configurable: true
    },
    reduceLiteralInfinityExpression: {
      value: function reduceLiteralInfinityExpression(node) {
        return t("2e308");
      },
      writable: true,
      configurable: true
    },
    reduceLiteralNumericExpression: {
      value: function reduceLiteralNumericExpression(node) {
        return new NumberCodeRep(node.value);
      },
      writable: true,
      configurable: true
    },
    reduceLiteralRegExpExpression: {
      value: function reduceLiteralRegExpExpression(node) {
        return t(node.value);
      },
      writable: true,
      configurable: true
    },
    reduceLiteralStringExpression: {
      value: function reduceLiteralStringExpression(node) {
        return t(escapeStringLiteral(node.value));
      },
      writable: true,
      configurable: true
    },
    reduceNewExpression: {
      value: function reduceNewExpression(node, callee, args) {
        var calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) : p(node.callee, getPrecedence(node), callee);
        return seq(t("new"), calleeRep, args.length === 0 ? empty() : paren(commaSep(args)));
      },
      writable: true,
      configurable: true
    },
    reduceObjectExpression: {
      value: function reduceObjectExpression(node, properties) {
        var state = brace(commaSep(properties));
        state.startsWithFunctionOrCurly = true;
        return state;
      },
      writable: true,
      configurable: true
    },
    reducePostfixExpression: {
      value: function reducePostfixExpression(node, operand) {
        return objectAssign(seq(p(node.operand, Precedence.New, operand), t(node.operator)), { startsWithFunctionOrCurly: operand.startsWithFunctionOrCurly });
      },
      writable: true,
      configurable: true
    },
    reducePrefixExpression: {
      value: function reducePrefixExpression(node, operand) {
        return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
      },
      writable: true,
      configurable: true
    },
    reducePropertyName: {
      value: function reducePropertyName(node) {
        if (node.kind == "number" || node.kind == "identifier") {
          return t(node.value.toString());
        }
        return t(JSON.stringify(node.value));
      },
      writable: true,
      configurable: true
    },
    reduceReturnStatement: {
      value: function reduceReturnStatement(node, argument) {
        return seq(t("return"), argument || empty(), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceScript: {
      value: function reduceScript(node, body) {
        return body;
      },
      writable: true,
      configurable: true
    },
    reduceSetter: {
      value: function reduceSetter(node, key, parameter, body) {
        return seq(t("set"), key, paren(parameter), brace(body));
      },
      writable: true,
      configurable: true
    },
    reduceStaticMemberExpression: {
      value: function reduceStaticMemberExpression(node, object, property) {
        var state = seq(p(node.object, getPrecedence(node), object), t("."), property);
        state.startsWithFunctionOrCurly = object.startsWithFunctionOrCurly;
        return state;
      },
      writable: true,
      configurable: true
    },
    reduceSwitchCase: {
      value: function reduceSwitchCase(node, test, consequent) {
        return seq(t("case"), test, t(":"), seq.apply(undefined, _toConsumableArray(consequent)));
      },
      writable: true,
      configurable: true
    },
    reduceSwitchDefault: {
      value: function reduceSwitchDefault(node, consequent) {
        return seq(t("default"), t(":"), seq.apply(undefined, _toConsumableArray(consequent)));
      },
      writable: true,
      configurable: true
    },
    reduceSwitchStatement: {
      value: function reduceSwitchStatement(node, discriminant, cases) {
        return seq(t("switch"), paren(discriminant), brace(seq.apply(undefined, _toConsumableArray(cases))));
      },
      writable: true,
      configurable: true
    },
    reduceSwitchStatementWithDefault: {
      value: function reduceSwitchStatementWithDefault(node, discriminant, cases, defaultCase, postDefaultCases) {
        return seq(t("switch"), paren(discriminant), brace(seq.apply(undefined, _toConsumableArray(cases).concat([defaultCase], _toConsumableArray(postDefaultCases)))));
      },
      writable: true,
      configurable: true
    },
    reduceThisExpression: {
      value: function reduceThisExpression(node) {
        return t("this");
      },
      writable: true,
      configurable: true
    },
    reduceThrowStatement: {
      value: function reduceThrowStatement(node, argument) {
        return seq(t("throw"), argument, semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceTryCatchStatement: {
      value: function reduceTryCatchStatement(node, block, catchClause) {
        return seq(t("try"), block, catchClause);
      },
      writable: true,
      configurable: true
    },
    reduceTryFinallyStatement: {
      value: function reduceTryFinallyStatement(node, block, catchClause, finalizer) {
        return seq(t("try"), block, catchClause || empty(), t("finally"), finalizer);
      },
      writable: true,
      configurable: true
    },
    reduceUnknownDirective: {
      value: function reduceUnknownDirective(node) {
        var name = "use strict" === node.value ? "use\\u0020strict" : node.value;
        return seq(t("\"" + name + "\""), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceUseStrictDirective: {
      value: function reduceUseStrictDirective(node) {
        return seq(t("\"use strict\""), semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceVariableDeclaration: {
      value: function reduceVariableDeclaration(node, declarators) {
        return seq(t(node.kind), commaSep(declarators));
      },
      writable: true,
      configurable: true
    },
    reduceVariableDeclarationStatement: {
      value: function reduceVariableDeclarationStatement(node, declaration) {
        return seq(declaration, semiOp());
      },
      writable: true,
      configurable: true
    },
    reduceVariableDeclarator: {
      value: function reduceVariableDeclarator(node, id, init) {
        var containsIn = init && init.containsIn && !init.containsGroup;
        if (init) {
          if (init.containsGroup) {
            init = paren(init);
          } else {
            init = markContainsIn(init);
          }
        }
        return objectAssign(new Init(id, init), { containsIn: containsIn });
      },
      writable: true,
      configurable: true
    },
    reduceWhileStatement: {
      value: function reduceWhileStatement(node, test, body) {
        return objectAssign(seq(t("while"), paren(test), body), { endsWithMissingElse: body.endsWithMissingElse });
      },
      writable: true,
      configurable: true
    },
    reduceWithStatement: {
      value: function reduceWithStatement(node, object, body) {
        return objectAssign(seq(t("with"), paren(object), body), { endsWithMissingElse: body.endsWithMissingElse });
      },
      writable: true,
      configurable: true
    }
  });

  return CodeGen;
})();

var INSTANCE = new CodeGen();
//# sourceMappingURL=data:application/json;base64,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RUQsd0JBQW9CO2FBQUEsOEJBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDckMsZUFBTyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUMsQ0FBQyxDQUFDO09BQzFHOzs7O0FBRUQsdUJBQW1CO2FBQUEsNkJBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDdEMsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUNuQyxFQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBQyxDQUFDLENBQUM7T0FDcEQ7Ozs7OztTQW5VRyxPQUFPOzs7QUFzVWIsSUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLEVBQUEsQ0FBQyIsImZpbGUiOiJzcmMvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcmVkdWNlIGZyb20gXCJzaGlmdC1yZWR1Y2VyXCI7XG5pbXBvcnQgKiBhcyBvYmplY3RBc3NpZ24gZnJvbSBcIm9iamVjdC1hc3NpZ25cIjtcbmltcG9ydCB7VG9rZW5TdHJlYW19IGZyb20gXCIuL3Rva2VuX3N0cmVhbVwiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb2RlR2VuKHNjcmlwdCkge1xuICBsZXQgdHMgPSBuZXcgVG9rZW5TdHJlYW07XG4gIGxldCByZXAgPSByZWR1Y2UoSU5TVEFOQ0UsIHNjcmlwdCk7XG4gIHJlcC5lbWl0KHRzKTtcbiAgcmV0dXJuIHRzLnJlc3VsdDtcbn1cblxuY29uc3QgUHJlY2VkZW5jZSA9IHtcbiAgU2VxdWVuY2U6IDAsXG4gIFlpZWxkOiAxLFxuICBBc3NpZ25tZW50OiAxLFxuICBDb25kaXRpb25hbDogMixcbiAgQXJyb3dGdW5jdGlvbjogMixcbiAgTG9naWNhbE9SOiAzLFxuICBMb2dpY2FsQU5EOiA0LFxuICBCaXR3aXNlT1I6IDUsXG4gIEJpdHdpc2VYT1I6IDYsXG4gIEJpdHdpc2VBTkQ6IDcsXG4gIEVxdWFsaXR5OiA4LFxuICBSZWxhdGlvbmFsOiA5LFxuICBCaXR3aXNlU0hJRlQ6IDEwLFxuICBBZGRpdGl2ZTogMTEsXG4gIE11bHRpcGxpY2F0aXZlOiAxMixcbiAgUHJlZml4OiAxMyxcbiAgUG9zdGZpeDogMTQsXG4gIE5ldzogMTUsXG4gIENhbGw6IDE2LFxuICBUYWdnZWRUZW1wbGF0ZTogMTcsXG4gIE1lbWJlcjogMTgsXG4gIFByaW1hcnk6IDE5XG59O1xuXG5jb25zdCBCaW5hcnlQcmVjZWRlbmNlID0ge1xuICBcIixcIjogUHJlY2VkZW5jZS5TZXF1ZW5jZSxcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmVcbn07XG5cbmZ1bmN0aW9uIGdldFByZWNlZGVuY2Uobm9kZSkge1xuICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiRnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsTnVsbEV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJUaGlzRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUHJpbWFyeTtcblxuICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuQXNzaWdubWVudDtcblxuICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLkNvbmRpdGlvbmFsO1xuXG4gICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBzd2l0Y2ggKG5vZGUub2JqZWN0LnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgICByZXR1cm4gZ2V0UHJlY2VkZW5jZShub2RlLm9iamVjdCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIFByZWNlZGVuY2UuTWVtYmVyO1xuICAgICAgfVxuXG4gICAgY2FzZSBcIkJpbmFyeUV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBCaW5hcnlQcmVjZWRlbmNlW25vZGUub3BlcmF0b3JdO1xuXG4gICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5DYWxsO1xuICAgIGNhc2UgXCJOZXdFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gbm9kZS5hcmd1bWVudHMubGVuZ3RoID09PSAwID8gUHJlY2VkZW5jZS5OZXcgOiBQcmVjZWRlbmNlLk1lbWJlcjtcbiAgICBjYXNlIFwiUG9zdGZpeEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLlBvc3RmaXg7XG4gICAgY2FzZSBcIlByZWZpeEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLlByZWZpeDtcbiAgfVxufVxuXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmdMaXRlcmFsKHN0cmluZ1ZhbHVlKSB7XG4gIGxldCByZXN1bHQgPSBcIlwiO1xuICByZXN1bHQgKz0gKCdcIicpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmluZ1ZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGNoID0gc3RyaW5nVmFsdWUuY2hhckF0KGkpO1xuICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgIGNhc2UgXCJcXGJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXGJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx0XCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx0XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcblwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcblwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUwMDBCXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx2XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTAwMENcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXGZcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxyXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxyXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcXCJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXFxcXCJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxcXFwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcXFxcXFwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUyMDI4XCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx1MjAyOFwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHUyMDI5XCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFx1MjAyOVwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJlc3VsdCArPSBjaDtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJlc3VsdCArPSAnXCInO1xuICByZXR1cm4gcmVzdWx0LnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIHAobm9kZSwgcHJlY2VkZW5jZSwgYSkge1xuICByZXR1cm4gZ2V0UHJlY2VkZW5jZShub2RlKSA8IHByZWNlZGVuY2UgPyBwYXJlbihhKSA6IGE7XG59XG5cbmNsYXNzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmNvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB0aGlzLmNvbnRhaW5zR3JvdXAgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBmYWxzZTtcbiAgICB0aGlzLmVuZHNXaXRoTWlzc2luZ0Vsc2UgPSBmYWxzZTtcbiAgfVxufVxuXG5jbGFzcyBFbXB0eSBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgZW1pdCgpIHt9XG59XG5cbmNsYXNzIFRva2VuIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKHRva2VuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnRva2VuID0gdG9rZW47XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KHRoaXMudG9rZW4pO1xuICB9XG59XG5cbmNsYXNzIE51bWJlckNvZGVSZXAgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IobnVtYmVyKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm51bWJlciA9IG51bWJlcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXROdW1iZXIodGhpcy5udW1iZXIpO1xuICB9XG59XG5cbmNsYXNzIFBhcmVuIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwiKFwiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIilcIik7XG4gIH1cbn1cblxuY2xhc3MgQnJhY2tldCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dChcIltcIik7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB0cy5wdXQoXCJdXCIpO1xuICB9XG59XG5cbmNsYXNzIEJyYWNlIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwie1wiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIn1cIik7XG4gIH1cbn1cblxuY2xhc3MgTm9JbiBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCB0cnVlKTtcbiAgfVxufVxuXG5jbGFzcyBDb250YWluc0luIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgaWYgKG5vSW4pIHtcbiAgICAgIHRzLnB1dChcIihcIik7XG4gICAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgICAgdHMucHV0KFwiKVwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5leHByLmVtaXQodHMsIGZhbHNlKTtcbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgU2VxIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGNoaWxkcmVuKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoaWxkcmVuID0gY2hpbGRyZW47XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNyID0+IGNyLmVtaXQodHMsIG5vSW4pKTtcbiAgfVxufVxuXG5jbGFzcyBTZW1pIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcihcIjtcIik7XG4gIH1cbn1cblxuY2xhc3MgQ29tbWFTZXAgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoY2hpbGRyZW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuXG4gIGVtaXQodHMsIG5vSW4pIHtcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaCgoY3IpID0+IHtcbiAgICAgIGlmIChmaXJzdCkge1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHMucHV0KFwiLFwiKTtcbiAgICAgIH1cbiAgICAgIGNyLmVtaXQodHMsIG5vSW4pO1xuICAgIH0pO1xuICB9XG59XG5cbmNsYXNzIFNlbWlPcCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dE9wdGlvbmFsU2VtaSgpO1xuICB9XG59XG5cbmNsYXNzIEluaXQgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoYmluZGluZywgaW5pdCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5iaW5kaW5nID0gYmluZGluZztcbiAgICB0aGlzLmluaXQgPSBpbml0O1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIHRoaXMuYmluZGluZy5lbWl0KHRzKTtcbiAgICBpZiAodGhpcy5pbml0ICE9IG51bGwpIHtcbiAgICAgIHRzLnB1dChcIj1cIik7XG4gICAgICB0aGlzLmluaXQuZW1pdCh0cywgbm9Jbik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHQodG9rZW4pIHtcbiAgcmV0dXJuIG5ldyBUb2tlbih0b2tlbik7XG59XG5cbmZ1bmN0aW9uIHBhcmVuKHJlcCkge1xuICByZXR1cm4gbmV3IFBhcmVuKHJlcCk7XG59XG5cbmZ1bmN0aW9uIGJyYWNrZXQocmVwKSB7XG4gIHJldHVybiBuZXcgQnJhY2tldChyZXApO1xufVxuXG5mdW5jdGlvbiBub0luKHJlcCkge1xuICByZXR1cm4gbmV3IE5vSW4ocmVwKTtcbn1cblxuZnVuY3Rpb24gbWFya0NvbnRhaW5zSW4oc3RhdGUpIHtcbiAgcmV0dXJuIHN0YXRlLmNvbnRhaW5zSW4gPyBuZXcgQ29udGFpbnNJbihzdGF0ZSkgOiBzdGF0ZTtcbn1cblxuZnVuY3Rpb24gc2VxKC4uLnJlcHMpIHtcbiAgcmV0dXJuIG5ldyBTZXEocmVwcyk7XG59XG5cbmZ1bmN0aW9uIHNlbWkoKSB7XG4gIHJldHVybiBuZXcgU2VtaTtcbn1cblxuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBuZXcgRW1wdHk7XG59XG5cbmZ1bmN0aW9uIGNvbW1hU2VwKHBpZWNlcykge1xuICByZXR1cm4gbmV3IENvbW1hU2VwKHBpZWNlcyk7XG59XG5cbmZ1bmN0aW9uIGJyYWNlKHJlcCkge1xuICByZXR1cm4gbmV3IEJyYWNlKHJlcCk7XG59XG5cbmZ1bmN0aW9uIHNlbWlPcCgpIHtcbiAgcmV0dXJuIG5ldyBTZW1pT3A7XG59XG5cbmZ1bmN0aW9uIHBhcmVuVG9Bdm9pZEJlaW5nRGlyZWN0aXZlKGVsZW1lbnQsIG9yaWdpbmFsKSB7XG4gIGlmIChlbGVtZW50ICYmIGVsZW1lbnQudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIgJiYgZWxlbWVudC5leHByZXNzaW9uLnR5cGUgPT09IFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIikge1xuICAgIHJldHVybiBzZXEocGFyZW4ob3JpZ2luYWwuY2hpbGRyZW5bMF0pLCBzZW1pT3AoKSk7XG4gIH1cbiAgcmV0dXJuIG9yaWdpbmFsO1xufVxuXG5mdW5jdGlvbiBnZXRBc3NpZ25tZW50RXhwcihzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUgPyAoc3RhdGUuY29udGFpbnNHcm91cCA/IHBhcmVuKHN0YXRlKSA6IHN0YXRlKSA6IGVtcHR5KCk7XG59XG5cbmNsYXNzIENvZGVHZW4ge1xuXG4gIHJlZHVjZUFycmF5RXhwcmVzc2lvbihub2RlLCBlbGVtZW50cykge1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBicmFja2V0KGVtcHR5KCkpO1xuICAgIH1cblxuICAgIGxldCBjb250ZW50ID0gY29tbWFTZXAoZWxlbWVudHMubWFwKGdldEFzc2lnbm1lbnRFeHByKSk7XG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA+IDAgJiYgZWxlbWVudHNbZWxlbWVudHMubGVuZ3RoIC0gMV0gPT0gbnVsbCkge1xuICAgICAgY29udGVudCA9IHNlcShjb250ZW50LCB0KFwiLFwiKSk7XG4gICAgfVxuICAgIHJldHVybiBicmFja2V0KGNvbnRlbnQpO1xuICB9XG5cbiAgcmVkdWNlQXNzaWdubWVudEV4cHJlc3Npb24obm9kZSwgYmluZGluZywgZXhwcmVzc2lvbikge1xuICAgIGxldCBsZWZ0Q29kZSA9IGJpbmRpbmc7XG4gICAgbGV0IHJpZ2h0Q29kZSA9IGV4cHJlc3Npb247XG4gICAgbGV0IGNvbnRhaW5zSW4gPSBleHByZXNzaW9uLmNvbnRhaW5zSW47XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSBiaW5kaW5nLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgaWYoZ2V0UHJlY2VkZW5jZShub2RlLmJpbmRpbmcpIDwgUHJlY2VkZW5jZS5OZXcpIHtcbiAgICAgIGxlZnRDb2RlID0gcGFyZW4obGVmdENvZGUpO1xuICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZ2V0UHJlY2VkZW5jZShub2RlLmV4cHJlc3Npb24pIDwgZ2V0UHJlY2VkZW5jZShub2RlKSkge1xuICAgICAgcmlnaHRDb2RlID0gcGFyZW4ocmlnaHRDb2RlKTtcbiAgICAgIGNvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihzZXEobGVmdENvZGUsIHQobm9kZS5vcGVyYXRvciksIHJpZ2h0Q29kZSksIHtjb250YWluc0luLCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VCaW5hcnlFeHByZXNzaW9uKG5vZGUsIGxlZnQsIHJpZ2h0KSB7XG4gICAgbGV0IGxlZnRDb2RlID0gbGVmdDtcbiAgICBsZXQgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGxlZnQuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTtcbiAgICBsZXQgbGVmdENvbnRhaW5zSW4gPSBsZWZ0LmNvbnRhaW5zSW47XG4gICAgaWYgKGdldFByZWNlZGVuY2Uobm9kZS5sZWZ0KSA8IGdldFByZWNlZGVuY2Uobm9kZSkpIHtcbiAgICAgIGxlZnRDb2RlID0gcGFyZW4obGVmdENvZGUpO1xuICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGZhbHNlO1xuICAgICAgbGVmdENvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB9XG4gICAgbGV0IHJpZ2h0Q29kZSA9IHJpZ2h0O1xuICAgIGxldCByaWdodENvbnRhaW5zSW4gPSByaWdodC5jb250YWluc0luO1xuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUucmlnaHQpIDw9IGdldFByZWNlZGVuY2Uobm9kZSkpIHtcbiAgICAgIHJpZ2h0Q29kZSA9IHBhcmVuKHJpZ2h0Q29kZSk7XG4gICAgICByaWdodENvbnRhaW5zSW4gPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShsZWZ0Q29kZSwgdChub2RlLm9wZXJhdG9yKSwgcmlnaHRDb2RlKSxcbiAgICAgIHtcbiAgICAgICAgY29udGFpbnNJbjogbGVmdENvbnRhaW5zSW4gfHwgcmlnaHRDb250YWluc0luIHx8IG5vZGUub3BlcmF0b3IgPT09IFwiaW5cIixcbiAgICAgICAgY29udGFpbnNHcm91cDogbm9kZS5vcGVyYXRvciA9PSBcIixcIixcbiAgICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseVxuICAgICAgfSk7XG4gIH1cblxuICByZWR1Y2VCbG9jayhub2RlLCBzdGF0ZW1lbnRzKSB7XG4gICAgcmV0dXJuIGJyYWNlKHNlcSguLi5zdGF0ZW1lbnRzKSk7XG4gIH1cblxuICByZWR1Y2VCbG9ja1N0YXRlbWVudChub2RlLCBibG9jaykge1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuXG4gIHJlZHVjZUJyZWFrU3RhdGVtZW50KG5vZGUsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiYnJlYWtcIiksIGxhYmVsIHx8IGVtcHR5KCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZUNhbGxFeHByZXNzaW9uKG5vZGUsIGNhbGxlZSwgYXJncykge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEocChub2RlLmNhbGxlZSwgZ2V0UHJlY2VkZW5jZShub2RlKSwgY2FsbGVlKSwgcGFyZW4oY29tbWFTZXAoYXJncykpKSxcbiAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBjYWxsZWUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlQ2F0Y2hDbGF1c2Uobm9kZSwgcGFyYW0sIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJjYXRjaFwiKSwgcGFyZW4ocGFyYW0pLCBib2R5KTtcbiAgfVxuXG4gIHJlZHVjZUNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihub2RlLCBvYmplY3QsIGV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHAobm9kZS5vYmplY3QsIGdldFByZWNlZGVuY2Uobm9kZSksIG9iamVjdCksIGJyYWNrZXQoZXhwcmVzc2lvbikpLFxuICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IG9iamVjdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VDb25kaXRpb25hbEV4cHJlc3Npb24obm9kZSwgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSB7XG4gICAgbGV0IGNvbnRhaW5zSW4gPSB0ZXN0LmNvbnRhaW5zSW4gfHwgYWx0ZXJuYXRlLmNvbnRhaW5zSW47XG4gICAgbGV0IHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0ZXN0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShcbiAgICAgICAgcChub2RlLnRlc3QsIFByZWNlZGVuY2UuTG9naWNhbE9SLCB0ZXN0KSwgdChcIj9cIiksXG4gICAgICAgIHAobm9kZS5jb25zZXF1ZW50LCBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsIGNvbnNlcXVlbnQpLCB0KFwiOlwiKSxcbiAgICAgICAgcChub2RlLmFsdGVybmF0ZSwgUHJlY2VkZW5jZS5Bc3NpZ25tZW50LCBhbHRlcm5hdGUpKSwge1xuICAgICAgICAgIGNvbnRhaW5zSW4sXG4gICAgICAgICAgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseVxuICAgICAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUNvbnRpbnVlU3RhdGVtZW50KG5vZGUsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiY29udGludWVcIiksIGxhYmVsIHx8IGVtcHR5KCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZURhdGFQcm9wZXJ0eShub2RlLCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHNlcShrZXksIHQoXCI6XCIpLCBnZXRBc3NpZ25tZW50RXhwcih2YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlRGVidWdnZXJTdGF0ZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBzZXEodChcImRlYnVnZ2VyXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VEb1doaWxlU3RhdGVtZW50KG5vZGUsIGJvZHksIHRlc3QpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJkb1wiKSwgYm9keSwgdChcIndoaWxlXCIpLCBwYXJlbih0ZXN0KSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRW1wdHlTdGF0ZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBzZW1pKCk7XG4gIH1cblxuICByZWR1Y2VFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUsIGV4cHJlc3Npb24pIHtcbiAgICByZXR1cm4gc2VxKChleHByZXNzaW9uLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPyBwYXJlbihleHByZXNzaW9uKSA6IGV4cHJlc3Npb24pLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VGb3JJblN0YXRlbWVudChub2RlLCBsZWZ0LCByaWdodCwgYm9keSkge1xuICAgIGxldCBsZWZ0UCA9IG5vZGUubGVmdC50eXBlID09PSAnVmFyaWFibGVEZWNsYXJhdGlvbicgPyBsZWZ0IDogcChub2RlLmxlZnQsIFByZWNlZGVuY2UuTmV3LCBsZWZ0KTtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHQoXCJmb3JcIiksIHBhcmVuKHNlcShub0luKG1hcmtDb250YWluc0luKGxlZnRQKSksIHQoXCJpblwiKSwgcmlnaHQpKSwgYm9keSksXG4gICAgICB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlfSk7XG4gIH1cblxuICByZWR1Y2VGb3JTdGF0ZW1lbnQobm9kZSwgaW5pdCwgdGVzdCwgdXBkYXRlLCBib2R5KSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShcbiAgICAgICAgdChcImZvclwiKSxcbiAgICAgICAgcGFyZW4oc2VxKGluaXQgPyBub0luKG1hcmtDb250YWluc0luKGluaXQpKSA6IGVtcHR5KCksIHNlbWkoKSwgdGVzdCB8fCBlbXB0eSgpLCBzZW1pKCksIHVwZGF0ZSB8fCBlbXB0eSgpKSksXG4gICAgICAgIGJvZHkpLFxuICAgICAgICB7XG4gICAgICAgICAgZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlXG4gICAgICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlRnVuY3Rpb25Cb2R5KG5vZGUsIGRpcmVjdGl2ZXMsIHNvdXJjZUVsZW1lbnRzKSB7XG4gICAgaWYgKHNvdXJjZUVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgc291cmNlRWxlbWVudHNbMF0gPSBwYXJlblRvQXZvaWRCZWluZ0RpcmVjdGl2ZShub2RlLnN0YXRlbWVudHNbMF0sIHNvdXJjZUVsZW1lbnRzWzBdKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcSguLi5kaXJlY3RpdmVzLCAuLi5zb3VyY2VFbGVtZW50cyk7XG4gIH1cblxuICByZWR1Y2VGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUsIGlkLCBwYXJhbXMsIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJmdW5jdGlvblwiKSwgaWQsIHBhcmVuKGNvbW1hU2VwKHBhcmFtcykpLCBicmFjZShib2R5KSk7XG4gIH1cblxuICByZWR1Y2VGdW5jdGlvbkV4cHJlc3Npb24obm9kZSwgaWQsIHBhcmFtcywgYm9keSkge1xuICAgIGNvbnN0IGFyZ0JvZHkgPSBzZXEocGFyZW4oY29tbWFTZXAocGFyYW1zKSksIGJyYWNlKGJvZHkpKTtcbiAgICBsZXQgc3RhdGUgPSBzZXEodChcImZ1bmN0aW9uXCIpLCBpZCA/IHNlcShpZCwgYXJnQm9keSkgOiBhcmdCb2R5KTtcbiAgICBzdGF0ZS5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gdHJ1ZTtcbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICByZWR1Y2VHZXR0ZXIobm9kZSwga2V5LCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZ2V0XCIpLCBrZXksIHBhcmVuKGVtcHR5KCkpLCBicmFjZShib2R5KSk7XG4gIH1cblxuICByZWR1Y2VJZGVudGlmaWVyKG5vZGUpIHtcbiAgICByZXR1cm4gdChub2RlLm5hbWUpO1xuICB9XG5cbiAgcmVkdWNlSWRlbnRpZmllckV4cHJlc3Npb24obm9kZSwgbmFtZSkge1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgcmVkdWNlSWZTdGF0ZW1lbnQobm9kZSwgdGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSB7XG4gICAgaWYgKGFsdGVybmF0ZSAmJiBjb25zZXF1ZW50LmVuZHNXaXRoTWlzc2luZ0Vsc2UpIHtcbiAgICAgIGNvbnNlcXVlbnQgPSBicmFjZShjb25zZXF1ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcSh0KFwiaWZcIiksIHBhcmVuKHRlc3QpLCBjb25zZXF1ZW50LCBhbHRlcm5hdGUgPyBzZXEodChcImVsc2VcIiksIGFsdGVybmF0ZSkgOiBlbXB0eSgpKSxcbiAgICAgIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBhbHRlcm5hdGUgPyBhbHRlcm5hdGUuZW5kc1dpdGhNaXNzaW5nRWxzZSA6IHRydWV9KTtcbiAgfVxuXG4gIHJlZHVjZUxhYmVsZWRTdGF0ZW1lbnQobm9kZSwgbGFiZWwsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcShsYWJlbCwgdChcIjpcIiksIGJvZHkpLCB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlfSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUudmFsdWUudG9TdHJpbmcoKSk7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVsbEV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KFwibnVsbFwiKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KFwiMmUzMDhcIik7XG4gIH1cblxuICByZWR1Y2VMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiBuZXcgTnVtYmVyQ29kZVJlcChub2RlLnZhbHVlKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChub2RlLnZhbHVlKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUpIHtcbiAgICByZXR1cm4gdChlc2NhcGVTdHJpbmdMaXRlcmFsKG5vZGUudmFsdWUpKTtcbiAgfVxuXG4gIHJlZHVjZU5ld0V4cHJlc3Npb24obm9kZSwgY2FsbGVlLCBhcmdzKSB7XG4gICAgbGV0IGNhbGxlZVJlcCA9IGdldFByZWNlZGVuY2Uobm9kZS5jYWxsZWUpID09IFByZWNlZGVuY2UuQ2FsbCA/IHBhcmVuKGNhbGxlZSkgOlxuICAgICAgcChub2RlLmNhbGxlZSwgZ2V0UHJlY2VkZW5jZShub2RlKSwgY2FsbGVlKTtcbiAgICByZXR1cm4gc2VxKHQoXCJuZXdcIiksIGNhbGxlZVJlcCwgYXJncy5sZW5ndGggPT09IDAgPyBlbXB0eSgpIDogcGFyZW4oY29tbWFTZXAoYXJncykpKTtcbiAgfVxuXG4gIHJlZHVjZU9iamVjdEV4cHJlc3Npb24obm9kZSwgcHJvcGVydGllcykge1xuICAgIGxldCBzdGF0ZSA9IGJyYWNlKGNvbW1hU2VwKHByb3BlcnRpZXMpKTtcbiAgICBzdGF0ZS5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gdHJ1ZTtcbiAgICByZXR1cm4gc3RhdGU7XG4gIH1cblxuICByZWR1Y2VQb3N0Zml4RXhwcmVzc2lvbihub2RlLCBvcGVyYW5kKSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShwKG5vZGUub3BlcmFuZCwgUHJlY2VkZW5jZS5OZXcsIG9wZXJhbmQpLCB0KG5vZGUub3BlcmF0b3IpKSxcbiAgICAgIHtzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5OiBvcGVyYW5kLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHl9KTtcbiAgfVxuXG4gIHJlZHVjZVByZWZpeEV4cHJlc3Npb24obm9kZSwgb3BlcmFuZCkge1xuICAgIHJldHVybiBzZXEodChub2RlLm9wZXJhdG9yKSwgcChub2RlLm9wZXJhbmQsIGdldFByZWNlZGVuY2Uobm9kZSksIG9wZXJhbmQpKTtcbiAgfVxuXG4gIHJlZHVjZVByb3BlcnR5TmFtZShub2RlKSB7XG4gICAgaWYgKG5vZGUua2luZCA9PSBcIm51bWJlclwiIHx8IG5vZGUua2luZCA9PSBcImlkZW50aWZpZXJcIikge1xuICAgICAgcmV0dXJuIHQobm9kZS52YWx1ZS50b1N0cmluZygpKTtcbiAgICB9XG4gICAgcmV0dXJuIHQoSlNPTi5zdHJpbmdpZnkobm9kZS52YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlUmV0dXJuU3RhdGVtZW50KG5vZGUsIGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwicmV0dXJuXCIpLCBhcmd1bWVudCB8fCBlbXB0eSgpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VTY3JpcHQobm9kZSwgYm9keSkge1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcmVkdWNlU2V0dGVyKG5vZGUsIGtleSwgcGFyYW1ldGVyLCBib2R5KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwic2V0XCIpLCBrZXksIHBhcmVuKHBhcmFtZXRlciksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZVN0YXRpY01lbWJlckV4cHJlc3Npb24obm9kZSwgb2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgIGNvbnN0IHN0YXRlID0gc2VxKHAobm9kZS5vYmplY3QsIGdldFByZWNlZGVuY2Uobm9kZSksIG9iamVjdCksIHQoXCIuXCIpLCBwcm9wZXJ0eSk7XG4gICAgc3RhdGUuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IG9iamVjdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaENhc2Uobm9kZSwgdGVzdCwgY29uc2VxdWVudCkge1xuICAgIHJldHVybiBzZXEodChcImNhc2VcIiksIHRlc3QsIHQoXCI6XCIpLCBzZXEoLi4uY29uc2VxdWVudCkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoRGVmYXVsdChub2RlLCBjb25zZXF1ZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZGVmYXVsdFwiKSwgdChcIjpcIiksIHNlcSguLi5jb25zZXF1ZW50KSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hTdGF0ZW1lbnQobm9kZSwgZGlzY3JpbWluYW50LCBjYXNlcykge1xuICAgIHJldHVybiBzZXEodChcInN3aXRjaFwiKSwgcGFyZW4oZGlzY3JpbWluYW50KSwgYnJhY2Uoc2VxKC4uLmNhc2VzKSkpO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQobm9kZSwgZGlzY3JpbWluYW50LCBjYXNlcywgZGVmYXVsdENhc2UsIHBvc3REZWZhdWx0Q2FzZXMpIHtcbiAgICByZXR1cm4gc2VxKFxuICAgICAgdChcInN3aXRjaFwiKSxcbiAgICAgIHBhcmVuKGRpc2NyaW1pbmFudCksXG4gICAgICBicmFjZShzZXEoLi4uY2FzZXMsIGRlZmF1bHRDYXNlLCAuLi5wb3N0RGVmYXVsdENhc2VzKSkpO1xuICB9XG5cbiAgcmVkdWNlVGhpc0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KFwidGhpc1wiKTtcbiAgfVxuXG4gIHJlZHVjZVRocm93U3RhdGVtZW50KG5vZGUsIGFyZ3VtZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidGhyb3dcIiksIGFyZ3VtZW50LCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VUcnlDYXRjaFN0YXRlbWVudChub2RlLCBibG9jaywgY2F0Y2hDbGF1c2UpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJ0cnlcIiksIGJsb2NrLCBjYXRjaENsYXVzZSk7XG4gIH1cblxuICByZWR1Y2VUcnlGaW5hbGx5U3RhdGVtZW50KG5vZGUsIGJsb2NrLCBjYXRjaENsYXVzZSwgZmluYWxpemVyKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwidHJ5XCIpLCBibG9jaywgY2F0Y2hDbGF1c2UgfHwgZW1wdHkoKSwgdChcImZpbmFsbHlcIiksIGZpbmFsaXplcik7XG4gIH1cblxuICByZWR1Y2VVbmtub3duRGlyZWN0aXZlKG5vZGUpIHtcbiAgICB2YXIgbmFtZSA9IFwidXNlIHN0cmljdFwiID09PSBub2RlLnZhbHVlID8gXCJ1c2VcXFxcdTAwMjBzdHJpY3RcIiA6IG5vZGUudmFsdWU7XG4gICAgcmV0dXJuIHNlcSh0KFwiXFxcIlwiICsgbmFtZSArIFwiXFxcIlwiKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlVXNlU3RyaWN0RGlyZWN0aXZlKG5vZGUpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJcXFwidXNlIHN0cmljdFxcXCJcIiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSwgZGVjbGFyYXRvcnMpIHtcbiAgICByZXR1cm4gc2VxKHQobm9kZS5raW5kKSwgY29tbWFTZXAoZGVjbGFyYXRvcnMpKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQobm9kZSwgZGVjbGFyYXRpb24pIHtcbiAgICByZXR1cm4gc2VxKGRlY2xhcmF0aW9uLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VWYXJpYWJsZURlY2xhcmF0b3Iobm9kZSwgaWQsIGluaXQpIHtcbiAgICBsZXQgY29udGFpbnNJbiA9IGluaXQgJiYgaW5pdC5jb250YWluc0luICYmICFpbml0LmNvbnRhaW5zR3JvdXA7XG4gICAgaWYgKGluaXQpIHtcbiAgICAgIGlmIChpbml0LmNvbnRhaW5zR3JvdXApIHtcbiAgICAgICAgaW5pdCA9IHBhcmVuKGluaXQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5pdCA9IG1hcmtDb250YWluc0luKGluaXQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKG5ldyBJbml0KGlkLCBpbml0KSwge2NvbnRhaW5zSW59KTtcbiAgfVxuXG4gIHJlZHVjZVdoaWxlU3RhdGVtZW50KG5vZGUsIHRlc3QsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcSh0KFwid2hpbGVcIiksIHBhcmVuKHRlc3QpLCBib2R5KSwge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG5cbiAgcmVkdWNlV2l0aFN0YXRlbWVudChub2RlLCBvYmplY3QsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHQoXCJ3aXRoXCIpLCBwYXJlbihvYmplY3QpLCBib2R5KSxcbiAgICAgIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxufVxuXG5jb25zdCBJTlNUQU5DRSA9IG5ldyBDb2RlR2VuO1xuIl19