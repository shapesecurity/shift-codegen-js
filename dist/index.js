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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztxQkFJd0IsT0FBTztJQUp4QixNQUFNLFdBQU0sZUFBZTtJQUN0QixZQUFZLFdBQU0sZUFBZTs7SUFDckMsV0FBVyxXQUFPLGdCQUFnQixFQUFsQyxXQUFXO0FBRUosU0FBUyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3RDLE1BQUksRUFBRSxHQUFHLElBQUksV0FBVyxFQUFBLENBQUM7QUFDekIsTUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNuQyxLQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2IsU0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDO0NBQ2xCOztBQUVELElBQU0sVUFBVSxHQUFHO0FBQ2pCLFVBQVEsRUFBRSxDQUFDO0FBQ1gsT0FBSyxFQUFFLENBQUM7QUFDUixZQUFVLEVBQUUsQ0FBQztBQUNiLGFBQVcsRUFBRSxDQUFDO0FBQ2QsZUFBYSxFQUFFLENBQUM7QUFDaEIsV0FBUyxFQUFFLENBQUM7QUFDWixZQUFVLEVBQUUsQ0FBQztBQUNiLFdBQVMsRUFBRSxDQUFDO0FBQ1osWUFBVSxFQUFFLENBQUM7QUFDYixZQUFVLEVBQUUsQ0FBQztBQUNiLFVBQVEsRUFBRSxDQUFDO0FBQ1gsWUFBVSxFQUFFLENBQUM7QUFDYixjQUFZLEVBQUUsRUFBRTtBQUNoQixVQUFRLEVBQUUsRUFBRTtBQUNaLGdCQUFjLEVBQUUsRUFBRTtBQUNsQixRQUFNLEVBQUUsRUFBRTtBQUNWLFNBQU8sRUFBRSxFQUFFO0FBQ1gsS0FBRyxFQUFFLEVBQUU7QUFDUCxNQUFJLEVBQUUsRUFBRTtBQUNSLGdCQUFjLEVBQUUsRUFBRTtBQUNsQixRQUFNLEVBQUUsRUFBRTtBQUNWLFNBQU8sRUFBRSxFQUFFO0NBQ1osQ0FBQzs7QUFFRixJQUFNLGdCQUFnQixHQUFHO0FBQ3ZCLEtBQUcsRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN4QixNQUFJLEVBQUUsVUFBVSxDQUFDLFNBQVM7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLEtBQUcsRUFBRSxVQUFVLENBQUMsU0FBUztBQUN6QixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzFCLE1BQUksRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN6QixNQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDekIsT0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQzFCLE9BQUssRUFBRSxVQUFVLENBQUMsUUFBUTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzFCLE1BQUksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMzQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLGNBQVksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUNuQyxNQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVk7QUFDN0IsTUFBSSxFQUFFLFVBQVUsQ0FBQyxZQUFZO0FBQzdCLE9BQUssRUFBRSxVQUFVLENBQUMsWUFBWTtBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDeEIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3hCLEtBQUcsRUFBRSxVQUFVLENBQUMsY0FBYztBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLGNBQWM7QUFDOUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxjQUFjO0NBQy9CLENBQUM7O0FBRUYsU0FBUyxhQUFhOzBCQUFPO1FBQU4sSUFBSTtBQUN6QixZQUFRLElBQUksQ0FBQyxJQUFJO0FBQ2YsV0FBSyxpQkFBaUI7QUFBQyxBQUN2QixXQUFLLG9CQUFvQjtBQUFDLEFBQzFCLFdBQUssc0JBQXNCO0FBQUMsQUFDNUIsV0FBSywwQkFBMEI7QUFBQyxBQUNoQyxXQUFLLHVCQUF1QjtBQUFDLEFBQzdCLFdBQUssMEJBQTBCO0FBQUMsQUFDaEMsV0FBSyx5QkFBeUI7QUFBQyxBQUMvQixXQUFLLHlCQUF5QjtBQUFDLEFBQy9CLFdBQUssa0JBQWtCO0FBQUMsQUFDeEIsV0FBSyxnQkFBZ0I7QUFDbkIsZUFBTyxVQUFVLENBQUMsT0FBTyxDQUFDOztBQUFBLEFBRTVCLFdBQUssc0JBQXNCO0FBQ3pCLGVBQU8sVUFBVSxDQUFDLFVBQVUsQ0FBQzs7QUFBQSxBQUUvQixXQUFLLHVCQUF1QjtBQUMxQixlQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUM7O0FBQUEsQUFFaEMsV0FBSywwQkFBMEI7QUFBQyxBQUNoQyxXQUFLLHdCQUF3QjtBQUMzQixnQkFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7QUFDdEIsZUFBSyxnQkFBZ0I7QUFBQyxBQUN0QixlQUFLLDBCQUEwQjtBQUFDLEFBQ2hDLGVBQUssd0JBQXdCO2lCQUNOLElBQUksQ0FBQyxNQUFNOztBQUFFLEFBQ3BDO0FBQ0UsbUJBQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUFBLFNBQzVCOztBQUFBLEFBRUgsV0FBSyxrQkFBa0I7QUFDckIsZUFBTyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBQUEsQUFFekMsV0FBSyxnQkFBZ0I7QUFDbkIsZUFBTyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQUEsQUFDekIsV0FBSyxlQUFlO0FBQ2xCLGVBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUFBLEFBQzFFLFdBQUssbUJBQW1CO0FBQ3RCLGVBQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQztBQUFBLEFBQzVCLFdBQUssa0JBQWtCO0FBQ3JCLGVBQU8sVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUFBLEtBQzVCO0dBQ0Y7Q0FBQTs7QUFFRCxTQUFTLG1CQUFtQixDQUFDLFdBQVcsRUFBRTtBQUN4QyxNQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsUUFBTSxJQUFLLElBQUcsQUFBQyxDQUFDO0FBQ2hCLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNDLFFBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsWUFBUSxFQUFFO0FBQ1IsV0FBSyxJQUFJO0FBQ1AsY0FBTSxJQUFJLEtBQUssQ0FBQztBQUNoQixjQUFNO0FBQUEsQUFDUixXQUFLLElBQUk7QUFDUCxjQUFNLElBQUksS0FBSyxDQUFDO0FBQ2hCLGNBQU07QUFBQSxBQUNSLFdBQUssSUFBSTtBQUNQLGNBQU0sSUFBSSxLQUFLLENBQUM7QUFDaEIsY0FBTTtBQUFBLEFBQ1IsV0FBSyxRQUFRO0FBQ1gsY0FBTSxJQUFJLEtBQUssQ0FBQztBQUNoQixjQUFNO0FBQUEsQUFDUixXQUFLLElBQVE7QUFDWCxjQUFNLElBQUksS0FBSyxDQUFDO0FBQ2hCLGNBQU07QUFBQSxBQUNSLFdBQUssSUFBSTtBQUNQLGNBQU0sSUFBSSxLQUFLLENBQUM7QUFDaEIsY0FBTTtBQUFBLEFBQ1IsV0FBSyxJQUFJO0FBQ1AsY0FBTSxJQUFJLE1BQU0sQ0FBQztBQUNqQixjQUFNO0FBQUEsQUFDUixXQUFLLElBQUk7QUFDUCxjQUFNLElBQUksTUFBTSxDQUFDO0FBQ2pCLGNBQU07QUFBQSxBQUNSLFdBQUssUUFBUTtBQUNYLGNBQU0sSUFBSSxTQUFTLENBQUM7QUFDcEIsY0FBTTtBQUFBLEFBQ1IsV0FBSyxRQUFRO0FBQ1gsY0FBTSxJQUFJLFNBQVMsQ0FBQztBQUNwQixjQUFNO0FBQUEsQUFDUjtBQUNFLGNBQU0sSUFBSSxFQUFFLENBQUM7QUFDYixjQUFNO0FBQUEsS0FDVDtHQUNGO0FBQ0QsUUFBTSxJQUFJLElBQUcsQ0FBQztBQUNkLFNBQU8sTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0NBQzFCOztBQUVELFNBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFO0FBQzlCLFNBQU8sYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3hEOztJQUVLLE9BQU8sR0FDQSxTQURQLE9BQU87d0JBQVAsT0FBTzs7QUFFVCxNQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixNQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUMzQixNQUFJLENBQUMseUJBQXlCLEdBQUcsS0FBSyxDQUFDO0FBQ3ZDLE1BQUksQ0FBQyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7Q0FDbEM7O0lBR0csS0FBSyxjQUFTLE9BQU87QUFDZCxXQURQLEtBQUs7MEJBQUwsS0FBSzs7QUFFUCwrQkFGRSxLQUFLLDZDQUVDO0dBQ1Q7O1lBSEcsS0FBSyxFQUFTLE9BQU87O3VCQUFyQixLQUFLO0FBS1QsUUFBSTthQUFBLGdCQUFHLEVBQUU7Ozs7OztTQUxMLEtBQUs7R0FBUyxPQUFPOztJQVFyQixLQUFLLGNBQVMsT0FBTztBQUNkLFdBRFAsS0FBSyxDQUNHLEtBQUs7MEJBRGIsS0FBSzs7QUFFUCwrQkFGRSxLQUFLLDZDQUVDO0FBQ1IsUUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7R0FDcEI7O1lBSkcsS0FBSyxFQUFTLE9BQU87O3VCQUFyQixLQUFLO0FBTVQsUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFO0FBQ1AsVUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDcEI7Ozs7OztTQVJHLEtBQUs7R0FBUyxPQUFPOztJQVdyQixhQUFhLGNBQVMsT0FBTztBQUN0QixXQURQLGFBQWEsQ0FDTCxNQUFNOzBCQURkLGFBQWE7O0FBRWYsK0JBRkUsYUFBYSw2Q0FFUDtBQUNSLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0dBQ3RCOztZQUpHLGFBQWEsRUFBUyxPQUFPOzt1QkFBN0IsYUFBYTtBQU1qQixRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUU7QUFDUCxVQUFFLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUMzQjs7Ozs7O1NBUkcsYUFBYTtHQUFTLE9BQU87O0lBVzdCLEtBQUssY0FBUyxPQUFPO0FBQ2QsV0FEUCxLQUFLLENBQ0csSUFBSTswQkFEWixLQUFLOztBQUVQLCtCQUZFLEtBQUssNkNBRUM7QUFDUixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztHQUNsQjs7WUFKRyxLQUFLLEVBQVMsT0FBTzs7dUJBQXJCLEtBQUs7QUFNVCxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUU7QUFDUCxVQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1osWUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFCLFVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDYjs7Ozs7O1NBVkcsS0FBSztHQUFTLE9BQU87O0lBYXJCLE9BQU8sY0FBUyxPQUFPO0FBQ2hCLFdBRFAsT0FBTyxDQUNDLElBQUk7MEJBRFosT0FBTzs7QUFFVCwrQkFGRSxPQUFPLDZDQUVEO0FBQ1IsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7R0FDbEI7O1lBSkcsT0FBTyxFQUFTLE9BQU87O3VCQUF2QixPQUFPO0FBTVgsUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFO0FBQ1AsVUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLFlBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixVQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2I7Ozs7OztTQVZHLE9BQU87R0FBUyxPQUFPOztJQWF2QixLQUFLLGNBQVMsT0FBTztBQUNkLFdBRFAsS0FBSyxDQUNHLElBQUk7MEJBRFosS0FBSzs7QUFFUCwrQkFGRSxLQUFLLDZDQUVDO0FBQ1IsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7R0FDbEI7O1lBSkcsS0FBSyxFQUFTLE9BQU87O3VCQUFyQixLQUFLO0FBTVQsUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFO0FBQ1AsVUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLFlBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixVQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2I7Ozs7OztTQVZHLEtBQUs7R0FBUyxPQUFPOztJQWFyQixJQUFJLGNBQVMsT0FBTztBQUNiLFdBRFAsSUFBSSxDQUNJLElBQUk7MEJBRFosSUFBSTs7QUFFTiwrQkFGRSxJQUFJLDZDQUVFO0FBQ1IsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7R0FDbEI7O1lBSkcsSUFBSSxFQUFTLE9BQU87O3VCQUFwQixJQUFJO0FBTVIsUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFO0FBQ1AsWUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO09BQzFCOzs7Ozs7U0FSRyxJQUFJO0dBQVMsT0FBTzs7SUFXcEIsVUFBVSxjQUFTLE9BQU87QUFDbkIsV0FEUCxVQUFVLENBQ0YsSUFBSTswQkFEWixVQUFVOztBQUVaLCtCQUZFLFVBQVUsNkNBRUo7QUFDUixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztHQUNsQjs7WUFKRyxVQUFVLEVBQVMsT0FBTzs7dUJBQTFCLFVBQVU7QUFNZCxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQ2IsWUFBSSxJQUFJLEVBQUU7QUFDUixZQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ1osY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFCLFlBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDYixNQUFNO0FBQ0wsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzNCO09BQ0Y7Ozs7OztTQWRHLFVBQVU7R0FBUyxPQUFPOztJQWlCMUIsR0FBRyxjQUFTLE9BQU87QUFDWixXQURQLEdBQUcsQ0FDSyxRQUFROzBCQURoQixHQUFHOztBQUVMLCtCQUZFLEdBQUcsNkNBRUc7QUFDUixRQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztHQUMxQjs7WUFKRyxHQUFHLEVBQVMsT0FBTzs7dUJBQW5CLEdBQUc7QUFNUCxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQ2IsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFO2lCQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQztTQUFBLENBQUMsQ0FBQztPQUNoRDs7Ozs7O1NBUkcsR0FBRztHQUFTLE9BQU87O0lBV25CLElBQUksY0FBUyxLQUFLO0FBQ1gsV0FEUCxJQUFJOzBCQUFKLElBQUk7O0FBRU4sK0JBRkUsSUFBSSw2Q0FFQSxHQUFHLEVBQUU7R0FDWjs7WUFIRyxJQUFJLEVBQVMsS0FBSzs7U0FBbEIsSUFBSTtHQUFTLEtBQUs7O0lBTWxCLFFBQVEsY0FBUyxPQUFPO0FBQ2pCLFdBRFAsUUFBUSxDQUNBLFFBQVE7MEJBRGhCLFFBQVE7O0FBRVYsK0JBRkUsUUFBUSw2Q0FFRjtBQUNSLFFBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0dBQzFCOztZQUpHLFFBQVEsRUFBUyxPQUFPOzt1QkFBeEIsUUFBUTtBQU1aLFFBQUk7YUFBQSxjQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUU7QUFDYixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFFLEVBQUs7QUFDNUIsY0FBSSxLQUFLLEVBQUU7QUFDVCxpQkFBSyxHQUFHLEtBQUssQ0FBQztXQUNmLE1BQU07QUFDTCxjQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ2I7QUFDRCxZQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQixDQUFDLENBQUM7T0FDSjs7Ozs7O1NBaEJHLFFBQVE7R0FBUyxPQUFPOztJQW1CeEIsTUFBTSxjQUFTLE9BQU87QUFDZixXQURQLE1BQU07MEJBQU4sTUFBTTs7QUFFUiwrQkFGRSxNQUFNLDZDQUVBO0dBQ1Q7O1lBSEcsTUFBTSxFQUFTLE9BQU87O3VCQUF0QixNQUFNO0FBS1YsUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFO0FBQ1AsVUFBRSxDQUFDLGVBQWUsRUFBRSxDQUFDO09BQ3RCOzs7Ozs7U0FQRyxNQUFNO0dBQVMsT0FBTzs7SUFVdEIsSUFBSSxjQUFTLE9BQU87QUFDYixXQURQLElBQUksQ0FDSSxPQUFPLEVBQUUsSUFBSTswQkFEckIsSUFBSTs7QUFFTiwrQkFGRSxJQUFJLDZDQUVFO0FBQ1IsUUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7R0FDbEI7O1lBTEcsSUFBSSxFQUFTLE9BQU87O3VCQUFwQixJQUFJO0FBT1IsUUFBSTthQUFBLGNBQUMsRUFBRSxFQUFFLElBQUksRUFBRTtBQUNiLFlBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RCLFlBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDckIsWUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUMxQjtPQUNGOzs7Ozs7U0FiRyxJQUFJO0dBQVMsT0FBTzs7QUFnQjFCLFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRTtBQUNoQixTQUFPLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3pCOztBQUVELFNBQVMsS0FBSyxDQUFDLEdBQUcsRUFBRTtBQUNsQixTQUFPLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3ZCOztBQUVELFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUNwQixTQUFPLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3pCOztBQUVELFNBQVMsSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUNqQixTQUFPLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3RCOztBQUVELFNBQVMsY0FBYyxDQUFDLEtBQUssRUFBRTtBQUM3QixTQUFPLEtBQUssQ0FBQyxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQ3pEOztBQUVELFNBQVMsR0FBRyxHQUFVO29DQUFOLElBQUk7QUFBSixRQUFJOzs7QUFDbEIsU0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN0Qjs7QUFFRCxTQUFTLElBQUksR0FBRztBQUNkLFNBQU8sSUFBSSxJQUFJLEVBQUEsQ0FBQztDQUNqQjs7QUFFRCxTQUFTLEtBQUssR0FBRztBQUNmLFNBQU8sSUFBSSxLQUFLLEVBQUEsQ0FBQztDQUNsQjs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDeEIsU0FBTyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztDQUM3Qjs7QUFFRCxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUU7QUFDbEIsU0FBTyxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN2Qjs7QUFFRCxTQUFTLE1BQU0sR0FBRztBQUNoQixTQUFPLElBQUksTUFBTSxFQUFBLENBQUM7Q0FDbkI7O0FBRUQsU0FBUywwQkFBMEIsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFO0FBQ3JELE1BQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUsscUJBQXFCLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUsseUJBQXlCLEVBQUU7QUFDOUcsV0FBTyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0dBQ25EO0FBQ0QsU0FBTyxRQUFRLENBQUM7Q0FDakI7O0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUU7QUFDaEMsU0FBTyxLQUFLLEdBQUksS0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxHQUFJLEtBQUssRUFBRSxDQUFDO0NBQ3ZFOztJQUVLLE9BQU87V0FBUCxPQUFPOzBCQUFQLE9BQU87Ozt1QkFBUCxPQUFPO0FBRVgseUJBQXFCO2FBQUEsK0JBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxZQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ3pCLGlCQUFPLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQ3pCOztBQUVELFlBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztBQUN4RCxZQUFJLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNoRSxpQkFBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDaEM7QUFDRCxlQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUN6Qjs7OztBQUVELDhCQUEwQjthQUFBLG9DQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFO0FBQ3BELFlBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQztBQUN2QixZQUFJLFNBQVMsR0FBRyxVQUFVLENBQUM7QUFDM0IsWUFBSSxVQUFVLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztBQUN2QyxZQUFJLHlCQUF5QixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztBQUNsRSxZQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRTtBQUMvQyxrQkFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMzQixtQ0FBeUIsR0FBRyxLQUFLLENBQUM7U0FDbkM7QUFDRCxZQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3hELG1CQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdCLG9CQUFVLEdBQUcsS0FBSyxDQUFDO1NBQ3BCO0FBQ0QsZUFBTyxZQUFZLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUMsVUFBVSxFQUFWLFVBQVUsRUFBRSx5QkFBeUIsRUFBekIseUJBQXlCLEVBQUMsQ0FBQyxDQUFDO09BQzFHOzs7O0FBRUQsMEJBQXNCO2FBQUEsZ0NBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDeEMsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQUkseUJBQXlCLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixDQUFDO0FBQy9ELFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDckMsWUFBSSxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNsRCxrQkFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMzQixtQ0FBeUIsR0FBRyxLQUFLLENBQUM7QUFDbEMsd0JBQWMsR0FBRyxLQUFLLENBQUM7U0FDeEI7QUFDRCxZQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDdEIsWUFBSSxlQUFlLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztBQUN2QyxZQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3BELG1CQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzdCLHlCQUFlLEdBQUcsS0FBSyxDQUFDO1NBQ3pCO0FBQ0QsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxTQUFTLENBQUMsRUFDMUM7QUFDRSxvQkFBVSxFQUFFLGNBQWMsSUFBSSxlQUFlLElBQUksSUFBSSxDQUFDLFFBQVEsS0FBSyxJQUFJO0FBQ3ZFLHVCQUFhLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHO0FBQ25DLG1DQUF5QixFQUF6Qix5QkFBeUI7U0FDMUIsQ0FBQyxDQUFDO09BQ047Ozs7QUFFRCxlQUFXO2FBQUEscUJBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUM1QixlQUFPLEtBQUssQ0FBQyxHQUFHLHFDQUFJLFVBQVUsRUFBQyxDQUFDLENBQUM7T0FDbEM7Ozs7QUFFRCx3QkFBb0I7YUFBQSw4QkFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLGVBQU8sS0FBSyxDQUFDO09BQ2Q7Ozs7QUFFRCx3QkFBb0I7YUFBQSw4QkFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2hDLGVBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLElBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztPQUNwRDs7OztBQUVELHdCQUFvQjthQUFBLDhCQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ3ZDLGVBQU8sWUFBWSxDQUNqQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUN2RSxFQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyx5QkFBeUIsRUFBQyxDQUFDLENBQUM7T0FDbEU7Ozs7QUFFRCxxQkFBaUI7YUFBQSwyQkFBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtBQUNuQyxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO09BQzVDOzs7O0FBRUQsa0NBQThCO2FBQUEsd0NBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUU7QUFDdkQsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQ3JFLEVBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLHlCQUF5QixFQUFDLENBQUMsQ0FBQztPQUNsRTs7OztBQUVELCtCQUEyQjthQUFBLHFDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRTtBQUM3RCxZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFDekQsWUFBSSx5QkFBeUIsR0FBRyxJQUFJLENBQUMseUJBQXlCLENBQUM7QUFDL0QsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FDRCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFDaEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQzdELENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRTtBQUNwRCxvQkFBVSxFQUFWLFVBQVU7QUFDVixtQ0FBeUIsRUFBekIseUJBQXlCO1NBQzFCLENBQUMsQ0FBQztPQUNSOzs7O0FBRUQsMkJBQXVCO2FBQUEsaUNBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNuQyxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxJQUFJLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDdkQ7Ozs7QUFFRCxzQkFBa0I7YUFBQSw0QkFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRTtBQUNuQyxlQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7T0FDbkQ7Ozs7QUFFRCwyQkFBdUI7YUFBQSxpQ0FBQyxJQUFJLEVBQUU7QUFDNUIsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDckM7Ozs7QUFFRCwwQkFBc0I7YUFBQSxnQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtBQUN2QyxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztPQUM5RDs7OztBQUVELHdCQUFvQjthQUFBLDhCQUFDLElBQUksRUFBRTtBQUN6QixlQUFPLElBQUksRUFBRSxDQUFDO09BQ2Y7Ozs7QUFFRCw2QkFBeUI7YUFBQSxtQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQzFDLGVBQU8sR0FBRyxDQUFFLFVBQVUsQ0FBQyx5QkFBeUIsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsVUFBVSxFQUFHLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDL0Y7Ozs7QUFFRCx3QkFBb0I7YUFBQSw4QkFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7QUFDNUMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUsscUJBQXFCLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakcsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQzVFLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFDLENBQUMsQ0FBQztPQUNwRDs7OztBQUVELHNCQUFrQjthQUFBLDRCQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDakQsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FDRCxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQ1IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUMzRyxJQUFJLENBQUMsRUFDTDtBQUNFLDZCQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7U0FDOUMsQ0FBQyxDQUFDO09BQ1I7Ozs7QUFFRCxzQkFBa0I7YUFBQSw0QkFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRTtBQUNuRCxZQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUU7QUFDekIsd0JBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRywwQkFBMEIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3ZGO0FBQ0QsZUFBTyxHQUFHLHFDQUFJLFVBQVUsNEJBQUssY0FBYyxHQUFDLENBQUM7T0FDOUM7Ozs7QUFFRCw2QkFBeUI7YUFBQSxtQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDaEQsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7T0FDckU7Ozs7QUFFRCw0QkFBd0I7YUFBQSxrQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDL0MsWUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMxRCxZQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBQ2hFLGFBQUssQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUM7QUFDdkMsZUFBTyxLQUFLLENBQUM7T0FDZDs7OztBQUVELGdCQUFZO2FBQUEsc0JBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUU7QUFDNUIsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztPQUN4RDs7OztBQUVELG9CQUFnQjthQUFBLDBCQUFDLElBQUksRUFBRTtBQUNyQixlQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDckI7Ozs7QUFFRCw4QkFBMEI7YUFBQSxvQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3JDLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCxxQkFBaUI7YUFBQSwyQkFBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUU7QUFDbkQsWUFBSSxTQUFTLElBQUksVUFBVSxDQUFDLG1CQUFtQixFQUFFO0FBQy9DLG9CQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ2hDO0FBQ0QsZUFBTyxZQUFZLENBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUN0RixFQUFDLG1CQUFtQixFQUFFLFNBQVMsR0FBRyxTQUFTLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxFQUFDLENBQUMsQ0FBQztPQUM1RTs7OztBQUVELDBCQUFzQjthQUFBLGdDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQ3hDLGVBQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFDLENBQUMsQ0FBQztPQUNoRzs7OztBQUVELGtDQUE4QjthQUFBLHdDQUFDLElBQUksRUFBRTtBQUNuQyxlQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7T0FDakM7Ozs7QUFFRCwrQkFBMkI7YUFBQSxxQ0FBQyxJQUFJLEVBQUU7QUFDaEMsZUFBTyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDbEI7Ozs7QUFFRCxtQ0FBK0I7YUFBQSx5Q0FBQyxJQUFJLEVBQUU7QUFDcEMsZUFBTyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDbkI7Ozs7QUFFRCxrQ0FBOEI7YUFBQSx3Q0FBQyxJQUFJLEVBQUU7QUFDbkMsZUFBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDdEM7Ozs7QUFFRCxpQ0FBNkI7YUFBQSx1Q0FBQyxJQUFJLEVBQUU7QUFDbEMsZUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ3RCOzs7O0FBRUQsaUNBQTZCO2FBQUEsdUNBQUMsSUFBSSxFQUFFO0FBQ2xDLGVBQU8sQ0FBQyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO09BQzNDOzs7O0FBRUQsdUJBQW1CO2FBQUEsNkJBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7QUFDdEMsWUFBSSxTQUFTLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FDM0UsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLGVBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDdEY7Ozs7QUFFRCwwQkFBc0I7YUFBQSxnQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO0FBQ3ZDLFlBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztBQUN4QyxhQUFLLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLGVBQU8sS0FBSyxDQUFDO09BQ2Q7Ozs7QUFFRCwyQkFBdUI7YUFBQSxpQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ3JDLGVBQU8sWUFBWSxDQUNqQixHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQy9ELEVBQUMseUJBQXlCLEVBQUUsT0FBTyxDQUFDLHlCQUF5QixFQUFDLENBQUMsQ0FBQztPQUNuRTs7OztBQUVELDBCQUFzQjthQUFBLGdDQUFDLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDcEMsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztPQUM3RTs7OztBQUVELHNCQUFrQjthQUFBLDRCQUFDLElBQUksRUFBRTtBQUN2QixZQUFJLElBQUksQ0FBQyxJQUFJLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxFQUFFO0FBQ3RELGlCQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDakM7QUFDRCxlQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO09BQ3RDOzs7O0FBRUQseUJBQXFCO2FBQUEsK0JBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsUUFBUSxJQUFJLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDeEQ7Ozs7QUFFRCxnQkFBWTthQUFBLHNCQUFDLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDdkIsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELGdCQUFZO2FBQUEsc0JBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFO0FBQ3ZDLGVBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO09BQzFEOzs7O0FBRUQsZ0NBQTRCO2FBQUEsc0NBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUU7QUFDbkQsWUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDakYsYUFBSyxDQUFDLHlCQUF5QixHQUFHLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQztBQUNuRSxlQUFPLEtBQUssQ0FBQztPQUNkOzs7O0FBRUQsb0JBQWdCO2FBQUEsMEJBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUU7QUFDdkMsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxxQ0FBSSxVQUFVLEVBQUMsQ0FBQyxDQUFDO09BQ3pEOzs7O0FBRUQsdUJBQW1CO2FBQUEsNkJBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtBQUNwQyxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcscUNBQUksVUFBVSxFQUFDLENBQUMsQ0FBQztPQUN0RDs7OztBQUVELHlCQUFxQjthQUFBLCtCQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFO0FBQy9DLGVBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcscUNBQUksS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3BFOzs7O0FBRUQsb0NBQWdDO2FBQUEsMENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFO0FBQ3pGLGVBQU8sR0FBRyxDQUNSLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFDWCxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQ25CLEtBQUssQ0FBQyxHQUFHLHFDQUFJLEtBQUssVUFBRSxXQUFXLHNCQUFLLGdCQUFnQixHQUFDLENBQUMsQ0FBQyxDQUFDO09BQzNEOzs7O0FBRUQsd0JBQW9CO2FBQUEsOEJBQUMsSUFBSSxFQUFFO0FBQ3pCLGVBQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ2xCOzs7O0FBRUQsd0JBQW9CO2FBQUEsOEJBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNuQyxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDNUM7Ozs7QUFFRCwyQkFBdUI7YUFBQSxpQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtBQUNoRCxlQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO09BQzFDOzs7O0FBRUQsNkJBQXlCO2FBQUEsbUNBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFO0FBQzdELGVBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsV0FBVyxJQUFJLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztPQUM5RTs7OztBQUVELDBCQUFzQjthQUFBLGdDQUFDLElBQUksRUFBRTtBQUMzQixZQUFJLElBQUksR0FBRyxZQUFZLEtBQUssSUFBSSxDQUFDLEtBQUssR0FBRyxrQkFBa0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0FBQ3pFLGVBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDN0M7Ozs7QUFFRCw0QkFBd0I7YUFBQSxrQ0FBQyxJQUFJLEVBQUU7QUFDN0IsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztPQUMzQzs7OztBQUVELDZCQUF5QjthQUFBLG1DQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7QUFDM0MsZUFBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztPQUNqRDs7OztBQUVELHNDQUFrQzthQUFBLDRDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7QUFDcEQsZUFBTyxHQUFHLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7T0FDbkM7Ozs7QUFFRCw0QkFBd0I7YUFBQSxrQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtBQUN2QyxZQUFJLFVBQVUsR0FBRyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDaEUsWUFBSSxJQUFJLEVBQUU7QUFDUixjQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDdEIsZ0JBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7V0FDcEIsTUFBTTtBQUNMLGdCQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQzdCO1NBQ0Y7QUFDRCxlQUFPLFlBQVksQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBQyxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUMsQ0FBQztPQUN2RDs7OztBQUVELHdCQUFvQjthQUFBLDhCQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ3JDLGVBQU8sWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFDLENBQUMsQ0FBQztPQUMxRzs7OztBQUVELHVCQUFtQjthQUFBLDZCQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO0FBQ3RDLGVBQU8sWUFBWSxDQUNqQixHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsRUFDbkMsRUFBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUMsQ0FBQyxDQUFDO09BQ3BEOzs7Ozs7U0FuVUcsT0FBTzs7O0FBc1ViLElBQU0sUUFBUSxHQUFHLElBQUksT0FBTyxFQUFBLENBQUMiLCJmaWxlIjoic3JjL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJlZHVjZSBmcm9tIFwic2hpZnQtcmVkdWNlclwiO1xuaW1wb3J0ICogYXMgb2JqZWN0QXNzaWduIGZyb20gXCJvYmplY3QtYXNzaWduXCI7XG5pbXBvcnQge1Rva2VuU3RyZWFtfSBmcm9tIFwiLi90b2tlbl9zdHJlYW1cIjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29kZUdlbihzY3JpcHQpIHtcbiAgbGV0IHRzID0gbmV3IFRva2VuU3RyZWFtO1xuICBsZXQgcmVwID0gcmVkdWNlKElOU1RBTkNFLCBzY3JpcHQpO1xuICByZXAuZW1pdCh0cyk7XG4gIHJldHVybiB0cy5yZXN1bHQ7XG59XG5cbmNvbnN0IFByZWNlZGVuY2UgPSB7XG4gIFNlcXVlbmNlOiAwLFxuICBZaWVsZDogMSxcbiAgQXNzaWdubWVudDogMSxcbiAgQ29uZGl0aW9uYWw6IDIsXG4gIEFycm93RnVuY3Rpb246IDIsXG4gIExvZ2ljYWxPUjogMyxcbiAgTG9naWNhbEFORDogNCxcbiAgQml0d2lzZU9SOiA1LFxuICBCaXR3aXNlWE9SOiA2LFxuICBCaXR3aXNlQU5EOiA3LFxuICBFcXVhbGl0eTogOCxcbiAgUmVsYXRpb25hbDogOSxcbiAgQml0d2lzZVNISUZUOiAxMCxcbiAgQWRkaXRpdmU6IDExLFxuICBNdWx0aXBsaWNhdGl2ZTogMTIsXG4gIFByZWZpeDogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBOZXc6IDE1LFxuICBDYWxsOiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCIsXCI6IFByZWNlZGVuY2UuU2VxdWVuY2UsXG4gIFwifHxcIjogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gIFwiJiZcIjogUHJlY2VkZW5jZS5Mb2dpY2FsQU5ELFxuICBcInxcIjogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gIFwiXlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VYT1IsXG4gIFwiJlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VBTkQsXG4gIFwiPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIj09PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIjxcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw9XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluc3RhbmNlb2ZcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw8XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCIrXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiLVwiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIipcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIlXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiL1wiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlXG59O1xuXG5mdW5jdGlvbiBnZXRQcmVjZWRlbmNlKG5vZGUpIHtcbiAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIjpcbiAgICBjYXNlIFwiTGl0ZXJhbE51bGxFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsUmVnRXhwRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiOlxuICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIlRoaXNFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5QcmltYXJ5O1xuXG4gICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICByZXR1cm4gUHJlY2VkZW5jZS5Bc3NpZ25tZW50O1xuXG4gICAgY2FzZSBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuQ29uZGl0aW9uYWw7XG5cbiAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIHN3aXRjaCAobm9kZS5vYmplY3QudHlwZSkge1xuICAgICAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICAgIHJldHVybiBnZXRQcmVjZWRlbmNlKG5vZGUub2JqZWN0KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gUHJlY2VkZW5jZS5NZW1iZXI7XG4gICAgICB9XG5cbiAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIEJpbmFyeVByZWNlZGVuY2Vbbm9kZS5vcGVyYXRvcl07XG5cbiAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBQcmVjZWRlbmNlLkNhbGw7XG4gICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgIHJldHVybiBub2RlLmFyZ3VtZW50cy5sZW5ndGggPT09IDAgPyBQcmVjZWRlbmNlLk5ldyA6IFByZWNlZGVuY2UuTWVtYmVyO1xuICAgIGNhc2UgXCJQb3N0Zml4RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUG9zdGZpeDtcbiAgICBjYXNlIFwiUHJlZml4RXhwcmVzc2lvblwiOlxuICAgICAgcmV0dXJuIFByZWNlZGVuY2UuUHJlZml4O1xuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZ0xpdGVyYWwoc3RyaW5nVmFsdWUpIHtcbiAgbGV0IHJlc3VsdCA9IFwiXCI7XG4gIHJlc3VsdCArPSAoJ1wiJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaW5nVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgY2ggPSBzdHJpbmdWYWx1ZS5jaGFyQXQoaSk7XG4gICAgc3dpdGNoIChjaCkge1xuICAgICAgY2FzZSBcIlxcYlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcYlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHRcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHRcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxuXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxuXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTAwMEJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHZcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFx1MDAwQ1wiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcZlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXHJcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHJcIjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiXFxcIlwiOlxuICAgICAgICByZXN1bHQgKz0gXCJcXFxcXFxcIlwiO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJcXFxcXCI6XG4gICAgICAgIHJlc3VsdCArPSBcIlxcXFxcXFxcXCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTIwMjhcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHUyMDI4XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlxcdTIwMjlcIjpcbiAgICAgICAgcmVzdWx0ICs9IFwiXFxcXHUyMDI5XCI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmVzdWx0ICs9IGNoO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmVzdWx0ICs9ICdcIic7XG4gIHJldHVybiByZXN1bHQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gcChub2RlLCBwcmVjZWRlbmNlLCBhKSB7XG4gIHJldHVybiBnZXRQcmVjZWRlbmNlKG5vZGUpIDwgcHJlY2VkZW5jZSA/IHBhcmVuKGEpIDogYTtcbn1cblxuY2xhc3MgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY29udGFpbnNJbiA9IGZhbHNlO1xuICAgIHRoaXMuY29udGFpbnNHcm91cCA9IGZhbHNlO1xuICAgIHRoaXMuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGZhbHNlO1xuICAgIHRoaXMuZW5kc1dpdGhNaXNzaW5nRWxzZSA9IGZhbHNlO1xuICB9XG59XG5cbmNsYXNzIEVtcHR5IGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBlbWl0KCkge31cbn1cblxuY2xhc3MgVG9rZW4gZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IodG9rZW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXQodGhpcy50b2tlbik7XG4gIH1cbn1cblxuY2xhc3MgTnVtYmVyQ29kZVJlcCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihudW1iZXIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMubnVtYmVyID0gbnVtYmVyO1xuICB9XG5cbiAgZW1pdCh0cykge1xuICAgIHRzLnB1dE51bWJlcih0aGlzLm51bWJlcik7XG4gIH1cbn1cblxuY2xhc3MgUGFyZW4gZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXQoXCIoXCIpO1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgdHMucHV0KFwiKVwiKTtcbiAgfVxufVxuXG5jbGFzcyBCcmFja2V0IGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0KFwiW1wiKTtcbiAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIHRzLnB1dChcIl1cIik7XG4gIH1cbn1cblxuY2xhc3MgQnJhY2UgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMpIHtcbiAgICB0cy5wdXQoXCJ7XCIpO1xuICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgdHMucHV0KFwifVwiKTtcbiAgfVxufVxuXG5jbGFzcyBOb0luIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKGV4cHIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZXhwciA9IGV4cHI7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdGhpcy5leHByLmVtaXQodHMsIHRydWUpO1xuICB9XG59XG5cbmNsYXNzIENvbnRhaW5zSW4gZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxuXG4gIGVtaXQodHMsIG5vSW4pIHtcbiAgICBpZiAobm9Jbikge1xuICAgICAgdHMucHV0KFwiKFwiKTtcbiAgICAgIHRoaXMuZXhwci5lbWl0KHRzLCBmYWxzZSk7XG4gICAgICB0cy5wdXQoXCIpXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmV4cHIuZW1pdCh0cywgZmFsc2UpO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBTZXEgZXh0ZW5kcyBDb2RlUmVwIHtcbiAgY29uc3RydWN0b3IoY2hpbGRyZW4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgfVxuXG4gIGVtaXQodHMsIG5vSW4pIHtcbiAgICB0aGlzLmNoaWxkcmVuLmZvckVhY2goY3IgPT4gY3IuZW1pdCh0cywgbm9JbikpO1xuICB9XG59XG5cbmNsYXNzIFNlbWkgZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiO1wiKTtcbiAgfVxufVxuXG5jbGFzcyBDb21tYVNlcCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihjaGlsZHJlbikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICB9XG5cbiAgZW1pdCh0cywgbm9Jbikge1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKChjcikgPT4ge1xuICAgICAgaWYgKGZpcnN0KSB7XG4gICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cy5wdXQoXCIsXCIpO1xuICAgICAgfVxuICAgICAgY3IuZW1pdCh0cywgbm9Jbik7XG4gICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgU2VtaU9wIGV4dGVuZHMgQ29kZVJlcCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBlbWl0KHRzKSB7XG4gICAgdHMucHV0T3B0aW9uYWxTZW1pKCk7XG4gIH1cbn1cblxuY2xhc3MgSW5pdCBleHRlbmRzIENvZGVSZXAge1xuICBjb25zdHJ1Y3RvcihiaW5kaW5nLCBpbml0KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmJpbmRpbmcgPSBiaW5kaW5nO1xuICAgIHRoaXMuaW5pdCA9IGluaXQ7XG4gIH1cblxuICBlbWl0KHRzLCBub0luKSB7XG4gICAgdGhpcy5iaW5kaW5nLmVtaXQodHMpO1xuICAgIGlmICh0aGlzLmluaXQgIT0gbnVsbCkge1xuICAgICAgdHMucHV0KFwiPVwiKTtcbiAgICAgIHRoaXMuaW5pdC5lbWl0KHRzLCBub0luKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdCh0b2tlbikge1xuICByZXR1cm4gbmV3IFRva2VuKHRva2VuKTtcbn1cblxuZnVuY3Rpb24gcGFyZW4ocmVwKSB7XG4gIHJldHVybiBuZXcgUGFyZW4ocmVwKTtcbn1cblxuZnVuY3Rpb24gYnJhY2tldChyZXApIHtcbiAgcmV0dXJuIG5ldyBCcmFja2V0KHJlcCk7XG59XG5cbmZ1bmN0aW9uIG5vSW4ocmVwKSB7XG4gIHJldHVybiBuZXcgTm9JbihyZXApO1xufVxuXG5mdW5jdGlvbiBtYXJrQ29udGFpbnNJbihzdGF0ZSkge1xuICByZXR1cm4gc3RhdGUuY29udGFpbnNJbiA/IG5ldyBDb250YWluc0luKHN0YXRlKSA6IHN0YXRlO1xufVxuXG5mdW5jdGlvbiBzZXEoLi4ucmVwcykge1xuICByZXR1cm4gbmV3IFNlcShyZXBzKTtcbn1cblxuZnVuY3Rpb24gc2VtaSgpIHtcbiAgcmV0dXJuIG5ldyBTZW1pO1xufVxuXG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgcmV0dXJuIG5ldyBFbXB0eTtcbn1cblxuZnVuY3Rpb24gY29tbWFTZXAocGllY2VzKSB7XG4gIHJldHVybiBuZXcgQ29tbWFTZXAocGllY2VzKTtcbn1cblxuZnVuY3Rpb24gYnJhY2UocmVwKSB7XG4gIHJldHVybiBuZXcgQnJhY2UocmVwKTtcbn1cblxuZnVuY3Rpb24gc2VtaU9wKCkge1xuICByZXR1cm4gbmV3IFNlbWlPcDtcbn1cblxuZnVuY3Rpb24gcGFyZW5Ub0F2b2lkQmVpbmdEaXJlY3RpdmUoZWxlbWVudCwgb3JpZ2luYWwpIHtcbiAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC50eXBlID09PSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiAmJiBlbGVtZW50LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgcmV0dXJuIHNlcShwYXJlbihvcmlnaW5hbC5jaGlsZHJlblswXSksIHNlbWlPcCgpKTtcbiAgfVxuICByZXR1cm4gb3JpZ2luYWw7XG59XG5cbmZ1bmN0aW9uIGdldEFzc2lnbm1lbnRFeHByKHN0YXRlKSB7XG4gIHJldHVybiBzdGF0ZSA/IChzdGF0ZS5jb250YWluc0dyb3VwID8gcGFyZW4oc3RhdGUpIDogc3RhdGUpIDogZW1wdHkoKTtcbn1cblxuY2xhc3MgQ29kZUdlbiB7XG5cbiAgcmVkdWNlQXJyYXlFeHByZXNzaW9uKG5vZGUsIGVsZW1lbnRzKSB7XG4gICAgaWYgKGVsZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJyYWNrZXQoZW1wdHkoKSk7XG4gICAgfVxuXG4gICAgbGV0IGNvbnRlbnQgPSBjb21tYVNlcChlbGVtZW50cy5tYXAoZ2V0QXNzaWdubWVudEV4cHIpKTtcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoID4gMCAmJiBlbGVtZW50c1tlbGVtZW50cy5sZW5ndGggLSAxXSA9PSBudWxsKSB7XG4gICAgICBjb250ZW50ID0gc2VxKGNvbnRlbnQsIHQoXCIsXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGJyYWNrZXQoY29udGVudCk7XG4gIH1cblxuICByZWR1Y2VBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlLCBiaW5kaW5nLCBleHByZXNzaW9uKSB7XG4gICAgbGV0IGxlZnRDb2RlID0gYmluZGluZztcbiAgICBsZXQgcmlnaHRDb2RlID0gZXhwcmVzc2lvbjtcbiAgICBsZXQgY29udGFpbnNJbiA9IGV4cHJlc3Npb24uY29udGFpbnNJbjtcbiAgICBsZXQgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IGJpbmRpbmcuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTtcbiAgICBpZihnZXRQcmVjZWRlbmNlKG5vZGUuYmluZGluZykgPCBQcmVjZWRlbmNlLk5ldykge1xuICAgICAgbGVmdENvZGUgPSBwYXJlbihsZWZ0Q29kZSk7XG4gICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChnZXRQcmVjZWRlbmNlKG5vZGUuZXhwcmVzc2lvbikgPCBnZXRQcmVjZWRlbmNlKG5vZGUpKSB7XG4gICAgICByaWdodENvZGUgPSBwYXJlbihyaWdodENvZGUpO1xuICAgICAgY29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKHNlcShsZWZ0Q29kZSwgdChub2RlLm9wZXJhdG9yKSwgcmlnaHRDb2RlKSwge2NvbnRhaW5zSW4sIHN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHl9KTtcbiAgfVxuXG4gIHJlZHVjZUJpbmFyeUV4cHJlc3Npb24obm9kZSwgbGVmdCwgcmlnaHQpIHtcbiAgICBsZXQgbGVmdENvZGUgPSBsZWZ0O1xuICAgIGxldCBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gbGVmdC5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5O1xuICAgIGxldCBsZWZ0Q29udGFpbnNJbiA9IGxlZnQuY29udGFpbnNJbjtcbiAgICBpZiAoZ2V0UHJlY2VkZW5jZShub2RlLmxlZnQpIDwgZ2V0UHJlY2VkZW5jZShub2RlKSkge1xuICAgICAgbGVmdENvZGUgPSBwYXJlbihsZWZ0Q29kZSk7XG4gICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gZmFsc2U7XG4gICAgICBsZWZ0Q29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cbiAgICBsZXQgcmlnaHRDb2RlID0gcmlnaHQ7XG4gICAgbGV0IHJpZ2h0Q29udGFpbnNJbiA9IHJpZ2h0LmNvbnRhaW5zSW47XG4gICAgaWYgKGdldFByZWNlZGVuY2Uobm9kZS5yaWdodCkgPD0gZ2V0UHJlY2VkZW5jZShub2RlKSkge1xuICAgICAgcmlnaHRDb2RlID0gcGFyZW4ocmlnaHRDb2RlKTtcbiAgICAgIHJpZ2h0Q29udGFpbnNJbiA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKGxlZnRDb2RlLCB0KG5vZGUub3BlcmF0b3IpLCByaWdodENvZGUpLFxuICAgICAge1xuICAgICAgICBjb250YWluc0luOiBsZWZ0Q29udGFpbnNJbiB8fCByaWdodENvbnRhaW5zSW4gfHwgbm9kZS5vcGVyYXRvciA9PT0gXCJpblwiLFxuICAgICAgICBjb250YWluc0dyb3VwOiBub2RlLm9wZXJhdG9yID09IFwiLFwiLFxuICAgICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5XG4gICAgICB9KTtcbiAgfVxuXG4gIHJlZHVjZUJsb2NrKG5vZGUsIHN0YXRlbWVudHMpIHtcbiAgICByZXR1cm4gYnJhY2Uoc2VxKC4uLnN0YXRlbWVudHMpKTtcbiAgfVxuXG4gIHJlZHVjZUJsb2NrU3RhdGVtZW50KG5vZGUsIGJsb2NrKSB7XG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG5cbiAgcmVkdWNlQnJlYWtTdGF0ZW1lbnQobm9kZSwgbGFiZWwpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJicmVha1wiKSwgbGFiZWwgfHwgZW1wdHkoKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlQ2FsbEV4cHJlc3Npb24obm9kZSwgY2FsbGVlLCBhcmdzKSB7XG4gICAgcmV0dXJuIG9iamVjdEFzc2lnbihcbiAgICAgIHNlcShwKG5vZGUuY2FsbGVlLCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBjYWxsZWUpLCBwYXJlbihjb21tYVNlcChhcmdzKSkpLFxuICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IGNhbGxlZS5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5fSk7XG4gIH1cblxuICByZWR1Y2VDYXRjaENsYXVzZShub2RlLCBwYXJhbSwgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcImNhdGNoXCIpLCBwYXJlbihwYXJhbSksIGJvZHkpO1xuICB9XG5cbiAgcmVkdWNlQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKG5vZGUsIG9iamVjdCwgZXhwcmVzc2lvbikge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEocChub2RlLm9iamVjdCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb2JqZWN0KSwgYnJhY2tldChleHByZXNzaW9uKSksXG4gICAgICB7c3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTogb2JqZWN0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHl9KTtcbiAgfVxuXG4gIHJlZHVjZUNvbmRpdGlvbmFsRXhwcmVzc2lvbihub2RlLCB0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpIHtcbiAgICBsZXQgY29udGFpbnNJbiA9IHRlc3QuY29udGFpbnNJbiB8fCBhbHRlcm5hdGUuY29udGFpbnNJbjtcbiAgICBsZXQgc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA9IHRlc3Quc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseTtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKFxuICAgICAgICBwKG5vZGUudGVzdCwgUHJlY2VkZW5jZS5Mb2dpY2FsT1IsIHRlc3QpLCB0KFwiP1wiKSxcbiAgICAgICAgcChub2RlLmNvbnNlcXVlbnQsIFByZWNlZGVuY2UuQXNzaWdubWVudCwgY29uc2VxdWVudCksIHQoXCI6XCIpLFxuICAgICAgICBwKG5vZGUuYWx0ZXJuYXRlLCBQcmVjZWRlbmNlLkFzc2lnbm1lbnQsIGFsdGVybmF0ZSkpLCB7XG4gICAgICAgICAgY29udGFpbnNJbixcbiAgICAgICAgICBzdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5XG4gICAgICAgIH0pO1xuICB9XG5cbiAgcmVkdWNlQ29udGludWVTdGF0ZW1lbnQobm9kZSwgbGFiZWwpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJjb250aW51ZVwiKSwgbGFiZWwgfHwgZW1wdHkoKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlRGF0YVByb3BlcnR5KG5vZGUsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gc2VxKGtleSwgdChcIjpcIiksIGdldEFzc2lnbm1lbnRFeHByKHZhbHVlKSk7XG4gIH1cblxuICByZWR1Y2VEZWJ1Z2dlclN0YXRlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiZGVidWdnZXJcIiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZURvV2hpbGVTdGF0ZW1lbnQobm9kZSwgYm9keSwgdGVzdCkge1xuICAgIHJldHVybiBzZXEodChcImRvXCIpLCBib2R5LCB0KFwid2hpbGVcIiksIHBhcmVuKHRlc3QpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VFbXB0eVN0YXRlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIHNlbWkoKTtcbiAgfVxuXG4gIHJlZHVjZUV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSwgZXhwcmVzc2lvbikge1xuICAgIHJldHVybiBzZXEoKGV4cHJlc3Npb24uc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseSA/IHBhcmVuKGV4cHJlc3Npb24pIDogZXhwcmVzc2lvbiksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZUZvckluU3RhdGVtZW50KG5vZGUsIGxlZnQsIHJpZ2h0LCBib2R5KSB7XG4gICAgbGV0IGxlZnRQID0gbm9kZS5sZWZ0LnR5cGUgPT09ICdWYXJpYWJsZURlY2xhcmF0aW9uJyA/IGxlZnQgOiBwKG5vZGUubGVmdCwgUHJlY2VkZW5jZS5OZXcsIGxlZnQpO1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEodChcImZvclwiKSwgcGFyZW4oc2VxKG5vSW4obWFya0NvbnRhaW5zSW4obGVmdFApKSwgdChcImluXCIpLCByaWdodCkpLCBib2R5KSxcbiAgICAgIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZUZvclN0YXRlbWVudChub2RlLCBpbml0LCB0ZXN0LCB1cGRhdGUsIGJvZHkpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKFxuICAgICAgICB0KFwiZm9yXCIpLFxuICAgICAgICBwYXJlbihzZXEoaW5pdCA/IG5vSW4obWFya0NvbnRhaW5zSW4oaW5pdCkpIDogZW1wdHkoKSwgc2VtaSgpLCB0ZXN0IHx8IGVtcHR5KCksIHNlbWkoKSwgdXBkYXRlIHx8IGVtcHR5KCkpKSxcbiAgICAgICAgYm9keSksXG4gICAgICAgIHtcbiAgICAgICAgICBlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2VcbiAgICAgICAgfSk7XG4gIH1cblxuICByZWR1Y2VGdW5jdGlvbkJvZHkobm9kZSwgZGlyZWN0aXZlcywgc291cmNlRWxlbWVudHMpIHtcbiAgICBpZiAoc291cmNlRWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICBzb3VyY2VFbGVtZW50c1swXSA9IHBhcmVuVG9Bdm9pZEJlaW5nRGlyZWN0aXZlKG5vZGUuc3RhdGVtZW50c1swXSwgc291cmNlRWxlbWVudHNbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gc2VxKC4uLmRpcmVjdGl2ZXMsIC4uLnNvdXJjZUVsZW1lbnRzKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRGVjbGFyYXRpb24obm9kZSwgaWQsIHBhcmFtcywgYm9keSkge1xuICAgIHJldHVybiBzZXEodChcImZ1bmN0aW9uXCIpLCBpZCwgcGFyZW4oY29tbWFTZXAocGFyYW1zKSksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZUZ1bmN0aW9uRXhwcmVzc2lvbihub2RlLCBpZCwgcGFyYW1zLCBib2R5KSB7XG4gICAgY29uc3QgYXJnQm9keSA9IHNlcShwYXJlbihjb21tYVNlcChwYXJhbXMpKSwgYnJhY2UoYm9keSkpO1xuICAgIGxldCBzdGF0ZSA9IHNlcSh0KFwiZnVuY3Rpb25cIiksIGlkID8gc2VxKGlkLCBhcmdCb2R5KSA6IGFyZ0JvZHkpO1xuICAgIHN0YXRlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0cnVlO1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZUdldHRlcihub2RlLCBrZXksIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJnZXRcIiksIGtleSwgcGFyZW4oZW1wdHkoKSksIGJyYWNlKGJvZHkpKTtcbiAgfVxuXG4gIHJlZHVjZUlkZW50aWZpZXIobm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUubmFtZSk7XG4gIH1cblxuICByZWR1Y2VJZGVudGlmaWVyRXhwcmVzc2lvbihub2RlLCBuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cblxuICByZWR1Y2VJZlN0YXRlbWVudChub2RlLCB0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpIHtcbiAgICBpZiAoYWx0ZXJuYXRlICYmIGNvbnNlcXVlbnQuZW5kc1dpdGhNaXNzaW5nRWxzZSkge1xuICAgICAgY29uc2VxdWVudCA9IGJyYWNlKGNvbnNlcXVlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHQoXCJpZlwiKSwgcGFyZW4odGVzdCksIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSA/IHNlcSh0KFwiZWxzZVwiKSwgYWx0ZXJuYXRlKSA6IGVtcHR5KCkpLFxuICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGFsdGVybmF0ZSA/IGFsdGVybmF0ZS5lbmRzV2l0aE1pc3NpbmdFbHNlIDogdHJ1ZX0pO1xuICB9XG5cbiAgcmVkdWNlTGFiZWxlZFN0YXRlbWVudChub2RlLCBsYWJlbCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oc2VxKGxhYmVsLCB0KFwiOlwiKSwgYm9keSksIHtlbmRzV2l0aE1pc3NpbmdFbHNlOiBib2R5LmVuZHNXaXRoTWlzc2luZ0Vsc2V9KTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQobm9kZS52YWx1ZS50b1N0cmluZygpKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxOdWxsRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoXCJudWxsXCIpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoXCIyZTMwOFwiKTtcbiAgfVxuXG4gIHJlZHVjZUxpdGVyYWxOdW1lcmljRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIG5ldyBOdW1iZXJDb2RlUmVwKG5vZGUudmFsdWUpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KG5vZGUudmFsdWUpO1xuICB9XG5cbiAgcmVkdWNlTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24obm9kZSkge1xuICAgIHJldHVybiB0KGVzY2FwZVN0cmluZ0xpdGVyYWwobm9kZS52YWx1ZSkpO1xuICB9XG5cbiAgcmVkdWNlTmV3RXhwcmVzc2lvbihub2RlLCBjYWxsZWUsIGFyZ3MpIHtcbiAgICBsZXQgY2FsbGVlUmVwID0gZ2V0UHJlY2VkZW5jZShub2RlLmNhbGxlZSkgPT0gUHJlY2VkZW5jZS5DYWxsID8gcGFyZW4oY2FsbGVlKSA6XG4gICAgICBwKG5vZGUuY2FsbGVlLCBnZXRQcmVjZWRlbmNlKG5vZGUpLCBjYWxsZWUpO1xuICAgIHJldHVybiBzZXEodChcIm5ld1wiKSwgY2FsbGVlUmVwLCBhcmdzLmxlbmd0aCA9PT0gMCA/IGVtcHR5KCkgOiBwYXJlbihjb21tYVNlcChhcmdzKSkpO1xuICB9XG5cbiAgcmVkdWNlT2JqZWN0RXhwcmVzc2lvbihub2RlLCBwcm9wZXJ0aWVzKSB7XG4gICAgbGV0IHN0YXRlID0gYnJhY2UoY29tbWFTZXAocHJvcGVydGllcykpO1xuICAgIHN0YXRlLnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHkgPSB0cnVlO1xuICAgIHJldHVybiBzdGF0ZTtcbiAgfVxuXG4gIHJlZHVjZVBvc3RmaXhFeHByZXNzaW9uKG5vZGUsIG9wZXJhbmQpIHtcbiAgICByZXR1cm4gb2JqZWN0QXNzaWduKFxuICAgICAgc2VxKHAobm9kZS5vcGVyYW5kLCBQcmVjZWRlbmNlLk5ldywgb3BlcmFuZCksIHQobm9kZS5vcGVyYXRvcikpLFxuICAgICAge3N0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk6IG9wZXJhbmQuc3RhcnRzV2l0aEZ1bmN0aW9uT3JDdXJseX0pO1xuICB9XG5cbiAgcmVkdWNlUHJlZml4RXhwcmVzc2lvbihub2RlLCBvcGVyYW5kKSB7XG4gICAgcmV0dXJuIHNlcSh0KG5vZGUub3BlcmF0b3IpLCBwKG5vZGUub3BlcmFuZCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb3BlcmFuZCkpO1xuICB9XG5cbiAgcmVkdWNlUHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgICBpZiAobm9kZS5raW5kID09IFwibnVtYmVyXCIgfHwgbm9kZS5raW5kID09IFwiaWRlbnRpZmllclwiKSB7XG4gICAgICByZXR1cm4gdChub2RlLnZhbHVlLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdChKU09OLnN0cmluZ2lmeShub2RlLnZhbHVlKSk7XG4gIH1cblxuICByZWR1Y2VSZXR1cm5TdGF0ZW1lbnQobm9kZSwgYXJndW1lbnQpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJyZXR1cm5cIiksIGFyZ3VtZW50IHx8IGVtcHR5KCksIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVNjcmlwdChub2RlLCBib2R5KSB7XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICByZWR1Y2VTZXR0ZXIobm9kZSwga2V5LCBwYXJhbWV0ZXIsIGJvZHkpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJzZXRcIiksIGtleSwgcGFyZW4ocGFyYW1ldGVyKSwgYnJhY2UoYm9keSkpO1xuICB9XG5cbiAgcmVkdWNlU3RhdGljTWVtYmVyRXhwcmVzc2lvbihub2RlLCBvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgY29uc3Qgc3RhdGUgPSBzZXEocChub2RlLm9iamVjdCwgZ2V0UHJlY2VkZW5jZShub2RlKSwgb2JqZWN0KSwgdChcIi5cIiksIHByb3BlcnR5KTtcbiAgICBzdGF0ZS5zdGFydHNXaXRoRnVuY3Rpb25PckN1cmx5ID0gb2JqZWN0LnN0YXJ0c1dpdGhGdW5jdGlvbk9yQ3VybHk7XG4gICAgcmV0dXJuIHN0YXRlO1xuICB9XG5cbiAgcmVkdWNlU3dpdGNoQ2FzZShub2RlLCB0ZXN0LCBjb25zZXF1ZW50KSB7XG4gICAgcmV0dXJuIHNlcSh0KFwiY2FzZVwiKSwgdGVzdCwgdChcIjpcIiksIHNlcSguLi5jb25zZXF1ZW50KSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hEZWZhdWx0KG5vZGUsIGNvbnNlcXVlbnQpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJkZWZhdWx0XCIpLCB0KFwiOlwiKSwgc2VxKC4uLmNvbnNlcXVlbnQpKTtcbiAgfVxuXG4gIHJlZHVjZVN3aXRjaFN0YXRlbWVudChub2RlLCBkaXNjcmltaW5hbnQsIGNhc2VzKSB7XG4gICAgcmV0dXJuIHNlcSh0KFwic3dpdGNoXCIpLCBwYXJlbihkaXNjcmltaW5hbnQpLCBicmFjZShzZXEoLi4uY2FzZXMpKSk7XG4gIH1cblxuICByZWR1Y2VTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChub2RlLCBkaXNjcmltaW5hbnQsIGNhc2VzLCBkZWZhdWx0Q2FzZSwgcG9zdERlZmF1bHRDYXNlcykge1xuICAgIHJldHVybiBzZXEoXG4gICAgICB0KFwic3dpdGNoXCIpLFxuICAgICAgcGFyZW4oZGlzY3JpbWluYW50KSxcbiAgICAgIGJyYWNlKHNlcSguLi5jYXNlcywgZGVmYXVsdENhc2UsIC4uLnBvc3REZWZhdWx0Q2FzZXMpKSk7XG4gIH1cblxuICByZWR1Y2VUaGlzRXhwcmVzc2lvbihub2RlKSB7XG4gICAgcmV0dXJuIHQoXCJ0aGlzXCIpO1xuICB9XG5cbiAgcmVkdWNlVGhyb3dTdGF0ZW1lbnQobm9kZSwgYXJndW1lbnQpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJ0aHJvd1wiKSwgYXJndW1lbnQsIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVRyeUNhdGNoU3RhdGVtZW50KG5vZGUsIGJsb2NrLCBjYXRjaENsYXVzZSkge1xuICAgIHJldHVybiBzZXEodChcInRyeVwiKSwgYmxvY2ssIGNhdGNoQ2xhdXNlKTtcbiAgfVxuXG4gIHJlZHVjZVRyeUZpbmFsbHlTdGF0ZW1lbnQobm9kZSwgYmxvY2ssIGNhdGNoQ2xhdXNlLCBmaW5hbGl6ZXIpIHtcbiAgICByZXR1cm4gc2VxKHQoXCJ0cnlcIiksIGJsb2NrLCBjYXRjaENsYXVzZSB8fCBlbXB0eSgpLCB0KFwiZmluYWxseVwiKSwgZmluYWxpemVyKTtcbiAgfVxuXG4gIHJlZHVjZVVua25vd25EaXJlY3RpdmUobm9kZSkge1xuICAgIHZhciBuYW1lID0gXCJ1c2Ugc3RyaWN0XCIgPT09IG5vZGUudmFsdWUgPyBcInVzZVxcXFx1MDAyMHN0cmljdFwiIDogbm9kZS52YWx1ZTtcbiAgICByZXR1cm4gc2VxKHQoXCJcXFwiXCIgKyBuYW1lICsgXCJcXFwiXCIpLCBzZW1pT3AoKSk7XG4gIH1cblxuICByZWR1Y2VVc2VTdHJpY3REaXJlY3RpdmUobm9kZSkge1xuICAgIHJldHVybiBzZXEodChcIlxcXCJ1c2Ugc3RyaWN0XFxcIlwiKSwgc2VtaU9wKCkpO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdGlvbihub2RlLCBkZWNsYXJhdG9ycykge1xuICAgIHJldHVybiBzZXEodChub2RlLmtpbmQpLCBjb21tYVNlcChkZWNsYXJhdG9ycykpO1xuICB9XG5cbiAgcmVkdWNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChub2RlLCBkZWNsYXJhdGlvbikge1xuICAgIHJldHVybiBzZXEoZGVjbGFyYXRpb24sIHNlbWlPcCgpKTtcbiAgfVxuXG4gIHJlZHVjZVZhcmlhYmxlRGVjbGFyYXRvcihub2RlLCBpZCwgaW5pdCkge1xuICAgIGxldCBjb250YWluc0luID0gaW5pdCAmJiBpbml0LmNvbnRhaW5zSW4gJiYgIWluaXQuY29udGFpbnNHcm91cDtcbiAgICBpZiAoaW5pdCkge1xuICAgICAgaWYgKGluaXQuY29udGFpbnNHcm91cCkge1xuICAgICAgICBpbml0ID0gcGFyZW4oaW5pdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbml0ID0gbWFya0NvbnRhaW5zSW4oaW5pdCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RBc3NpZ24obmV3IEluaXQoaWQsIGluaXQpLCB7Y29udGFpbnNJbn0pO1xuICB9XG5cbiAgcmVkdWNlV2hpbGVTdGF0ZW1lbnQobm9kZSwgdGVzdCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oc2VxKHQoXCJ3aGlsZVwiKSwgcGFyZW4odGVzdCksIGJvZHkpLCB7ZW5kc1dpdGhNaXNzaW5nRWxzZTogYm9keS5lbmRzV2l0aE1pc3NpbmdFbHNlfSk7XG4gIH1cblxuICByZWR1Y2VXaXRoU3RhdGVtZW50KG5vZGUsIG9iamVjdCwgYm9keSkge1xuICAgIHJldHVybiBvYmplY3RBc3NpZ24oXG4gICAgICBzZXEodChcIndpdGhcIiksIHBhcmVuKG9iamVjdCksIGJvZHkpLFxuICAgICAge2VuZHNXaXRoTWlzc2luZ0Vsc2U6IGJvZHkuZW5kc1dpdGhNaXNzaW5nRWxzZX0pO1xuICB9XG59XG5cbmNvbnN0IElOU1RBTkNFID0gbmV3IENvZGVHZW47XG4iXX0=