// istanbul ignore next
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

// istanbul ignore next

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x,
    property = _x2,
    receiver = _x3; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports["default"] = codeGen;
// istanbul ignore next

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

// istanbul ignore next

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

// istanbul ignore next

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _shiftReducer = require("shift-reducer");

var _objectAssign = require("object-assign");

var objectAssign = _objectAssign;

var _esutils = require("esutils");

var _token_stream = require("./token_stream");

function codeGen(script) {
  var ts = new _token_stream.TokenStream();
  var rep = _shiftReducer["default"](INSTANCE, script);
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

function getPrecedence(_x4) {
  var _again2 = true;

  _function2: while (_again2) {
    _again2 = false;
    var node = _x4;

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
            _x4 = node.object;
            _again2 = true;
            continue _function2;

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
  var nSingle = 0,
      nDouble = 0;
  for (var i = 0, l = stringValue.length; i < l; ++i) {
    var ch = stringValue[i];
    if (ch === "\"") {
      ++nDouble;
    } else if (ch === "'") {
      ++nSingle;
    }
  }
  var delim = nDouble > nSingle ? "'" : "\"";
  result += delim;
  for (var i = 0; i < stringValue.length; i++) {
    var ch = stringValue.charAt(i);
    switch (ch) {
      case delim:
        result += "\\" + delim;
        break;
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
  result += delim;
  return result;
}

function p(node, precedence, a) {
  return getPrecedence(node) < precedence ? paren(a) : a;
}

var CodeRep = function CodeRep() {
  _classCallCheck(this, CodeRep);

  this.containsIn = false;
  this.containsGroup = false;
  // restricted tokens: {, function, class
  this.startsWithCurly = false;
  this.startsWithFunctionOrClass = false;
  this.endsWithMissingElse = false;
};

var Empty = (function (_CodeRep) {
  function Empty() {
    _classCallCheck(this, Empty);

    _get(Object.getPrototypeOf(Empty.prototype), "constructor", this).call(this);
  }

  _inherits(Empty, _CodeRep);

  _createClass(Empty, [{
    key: "emit",
    value: function emit() {}
  }]);

  return Empty;
})(CodeRep);

var Token = (function (_CodeRep2) {
  function Token(token) {
    _classCallCheck(this, Token);

    _get(Object.getPrototypeOf(Token.prototype), "constructor", this).call(this);
    this.token = token;
  }

  _inherits(Token, _CodeRep2);

  _createClass(Token, [{
    key: "emit",
    value: function emit(ts) {
      ts.put(this.token);
    }
  }]);

  return Token;
})(CodeRep);

var NumberCodeRep = (function (_CodeRep3) {
  function NumberCodeRep(number) {
    _classCallCheck(this, NumberCodeRep);

    _get(Object.getPrototypeOf(NumberCodeRep.prototype), "constructor", this).call(this);
    this.number = number;
  }

  _inherits(NumberCodeRep, _CodeRep3);

  _createClass(NumberCodeRep, [{
    key: "emit",
    value: function emit(ts) {
      ts.putNumber(this.number);
    }
  }]);

  return NumberCodeRep;
})(CodeRep);

var Paren = (function (_CodeRep4) {
  function Paren(expr) {
    _classCallCheck(this, Paren);

    _get(Object.getPrototypeOf(Paren.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(Paren, _CodeRep4);

  _createClass(Paren, [{
    key: "emit",
    value: function emit(ts) {
      ts.put("(");
      this.expr.emit(ts, false);
      ts.put(")");
    }
  }]);

  return Paren;
})(CodeRep);

var Bracket = (function (_CodeRep5) {
  function Bracket(expr) {
    _classCallCheck(this, Bracket);

    _get(Object.getPrototypeOf(Bracket.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(Bracket, _CodeRep5);

  _createClass(Bracket, [{
    key: "emit",
    value: function emit(ts) {
      ts.put("[");
      this.expr.emit(ts, false);
      ts.put("]");
    }
  }]);

  return Bracket;
})(CodeRep);

var Brace = (function (_CodeRep6) {
  function Brace(expr) {
    _classCallCheck(this, Brace);

    _get(Object.getPrototypeOf(Brace.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(Brace, _CodeRep6);

  _createClass(Brace, [{
    key: "emit",
    value: function emit(ts) {
      ts.put("{");
      this.expr.emit(ts, false);
      ts.put("}");
    }
  }]);

  return Brace;
})(CodeRep);

var NoIn = (function (_CodeRep7) {
  function NoIn(expr) {
    _classCallCheck(this, NoIn);

    _get(Object.getPrototypeOf(NoIn.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(NoIn, _CodeRep7);

  _createClass(NoIn, [{
    key: "emit",
    value: function emit(ts) {
      this.expr.emit(ts, true);
    }
  }]);

  return NoIn;
})(CodeRep);

var ContainsIn = (function (_CodeRep8) {
  function ContainsIn(expr) {
    _classCallCheck(this, ContainsIn);

    _get(Object.getPrototypeOf(ContainsIn.prototype), "constructor", this).call(this);
    this.expr = expr;
  }

  _inherits(ContainsIn, _CodeRep8);

  _createClass(ContainsIn, [{
    key: "emit",
    value: function emit(ts, noIn) {
      if (noIn) {
        ts.put("(");
        this.expr.emit(ts, false);
        ts.put(")");
      } else {
        this.expr.emit(ts, false);
      }
    }
  }]);

  return ContainsIn;
})(CodeRep);

var Seq = (function (_CodeRep9) {
  function Seq(children) {
    _classCallCheck(this, Seq);

    _get(Object.getPrototypeOf(Seq.prototype), "constructor", this).call(this);
    this.children = children;
  }

  _inherits(Seq, _CodeRep9);

  _createClass(Seq, [{
    key: "emit",
    value: function emit(ts, noIn) {
      this.children.forEach(function (cr) {
        return cr.emit(ts, noIn);
      });
    }
  }]);

  return Seq;
})(CodeRep);

var Semi = (function (_Token) {
  function Semi() {
    _classCallCheck(this, Semi);

    _get(Object.getPrototypeOf(Semi.prototype), "constructor", this).call(this, ";");
  }

  _inherits(Semi, _Token);

  return Semi;
})(Token);

var CommaSep = (function (_CodeRep10) {
  function CommaSep(children) {
    _classCallCheck(this, CommaSep);

    _get(Object.getPrototypeOf(CommaSep.prototype), "constructor", this).call(this);
    this.children = children;
  }

  _inherits(CommaSep, _CodeRep10);

  _createClass(CommaSep, [{
    key: "emit",
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
    }
  }]);

  return CommaSep;
})(CodeRep);

var SemiOp = (function (_CodeRep11) {
  function SemiOp() {
    _classCallCheck(this, SemiOp);

    _get(Object.getPrototypeOf(SemiOp.prototype), "constructor", this).call(this);
  }

  _inherits(SemiOp, _CodeRep11);

  _createClass(SemiOp, [{
    key: "emit",
    value: function emit(ts) {
      ts.putOptionalSemi();
    }
  }]);

  return SemiOp;
})(CodeRep);

var Init = (function (_CodeRep12) {
  function Init(binding, init) {
    _classCallCheck(this, Init);

    _get(Object.getPrototypeOf(Init.prototype), "constructor", this).call(this);
    this.binding = binding;
    this.init = init;
  }

  _inherits(Init, _CodeRep12);

  _createClass(Init, [{
    key: "emit",
    value: function emit(ts, noIn) {
      this.binding.emit(ts);
      if (this.init != null) {
        ts.put("=");
        this.init.emit(ts, noIn);
      }
    }
  }]);

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

  _createClass(CodeGen, [{
    key: "reduceArrayExpression",
    value: function reduceArrayExpression(node, _ref) {
      var elements = _ref.elements;

      if (elements.length === 0) {
        return bracket(empty());
      }

      var content = commaSep(elements.map(getAssignmentExpr));
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, t(","));
      }
      return bracket(content);
    }
  }, {
    key: "reduceSpreadElement",
    value: function reduceSpreadElement(node, _ref2) {
      var expression = _ref2.expression;

      return seq(t("..."), p(node.expression, Precedence.Assignment, expression));
    }
  }, {
    key: "reduceAssignmentExpression",
    value: function reduceAssignmentExpression(node, _ref3) {
      var binding = _ref3.binding;
      var expression = _ref3.expression;

      var leftCode = binding;
      var rightCode = expression;
      var containsIn = expression.containsIn;
      var startsWithCurly = binding.startsWithCurly;
      var startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
      if (getPrecedence(node.expression) < getPrecedence(node)) {
        rightCode = paren(rightCode);
        containsIn = false;
      }
      return objectAssign(seq(leftCode, t(node.operator), rightCode), { containsIn: containsIn, startsWithCurly: startsWithCurly, startsWithFunctionOrClass: startsWithFunctionOrClass });
    }
  }, {
    key: "reduceBinaryExpression",
    value: function reduceBinaryExpression(node, _ref4) {
      var left = _ref4.left;
      var right = _ref4.right;

      var leftCode = left;
      var startsWithCurly = left.startsWithCurly;
      var startsWithFunctionOrClass = left.startsWithFunctionOrClass;
      var leftContainsIn = left.containsIn;
      if (getPrecedence(node.left) < getPrecedence(node)) {
        leftCode = paren(leftCode);
        startsWithCurly = false;
        startsWithFunctionOrClass = false;
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
        startsWithCurly: startsWithCurly,
        startsWithFunctionOrClass: startsWithFunctionOrClass
      });
    }
  }, {
    key: "reduceBindingWithDefault",
    value: function reduceBindingWithDefault(node, _ref5) {
      var binding = _ref5.binding;
      var init = _ref5.init;

      return seq(binding, t("="), init);
    }
  }, {
    key: "reduceBindingIdentifier",
    value: function reduceBindingIdentifier(node) {
      return t(node.name);
    }
  }, {
    key: "reduceArrayBinding",
    value: function reduceArrayBinding(node, _ref6) {
      var elements = _ref6.elements;
      var restElement = _ref6.restElement;

      var content = undefined;
      if (elements.length === 0) {
        content = restElement == null ? empty() : seq(t("..."), restElement);
      } else {
        elements = elements.concat(restElement == null ? [] : [seq(t("..."), restElement)]);
        content = commaSep(elements.map(getAssignmentExpr));
        if (elements.length > 0 && elements[elements.length - 1] == null) {
          content = seq(content, t(","));
        }
      }
      return bracket(content);
    }
  }, {
    key: "reduceObjectBinding",
    value: function reduceObjectBinding(node, _ref7) {
      var properties = _ref7.properties;

      var state = brace(commaSep(properties));
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: "reduceBindingPropertyIdentifier",
    value: function reduceBindingPropertyIdentifier(node, _ref8) {
      var binding = _ref8.binding;
      var init = _ref8.init;

      if (node.init == null) return binding;
      return seq(binding, t("="), init);
    }
  }, {
    key: "reduceBindingPropertyProperty",
    value: function reduceBindingPropertyProperty(node, _ref9) {
      var name = _ref9.name;
      var binding = _ref9.binding;

      return seq(name, t(":"), binding);
    }
  }, {
    key: "reduceBlock",
    value: function reduceBlock(node, _ref10) {
      var statements = _ref10.statements;

      return brace(seq.apply(undefined, _toConsumableArray(statements)));
    }
  }, {
    key: "reduceBlockStatement",
    value: function reduceBlockStatement(node, _ref11) {
      var block = _ref11.block;

      return block;
    }
  }, {
    key: "reduceBreakStatement",
    value: function reduceBreakStatement(node, _ref12) {
      var label = _ref12.label;

      return seq(t("break"), label ? t(label) : empty(), semiOp());
    }
  }, {
    key: "reduceCallExpression",
    value: function reduceCallExpression(node, _ref13) {
      var callee = _ref13.callee;
      var args = _ref13.arguments;

      return objectAssign(seq(p(node.callee, getPrecedence(node), callee), paren(commaSep(args))), { startsWithCurly: callee.startsWithCurly, startsWithFunctionOrClass: callee.startsWithFunctionOrClass });
    }
  }, {
    key: "reduceCatchClause",
    value: function reduceCatchClause(node, _ref14) {
      var binding = _ref14.binding;
      var body = _ref14.body;

      return seq(t("catch"), paren(binding), body);
    }
  }, {
    key: "reduceClassDeclaration",
    value: function reduceClassDeclaration(node, _ref15) {
      var name = _ref15.name;
      var _super = _ref15["super"];
      var elements = _ref15.elements;

      var state = seq(t("class"), name);
      if (_super != null) {
        state = seq(state, t("extends"), _super);
      }
      state = seq.apply(undefined, [state, t("{")].concat(_toConsumableArray(elements), [t("}")]));
      return state;
    }
  }, {
    key: "reduceClassExpression",
    value: function reduceClassExpression(node, _ref16) {
      var name = _ref16.name;
      var _super = _ref16["super"];
      var elements = _ref16.elements;

      var state = t("class");
      if (name != null) {
        state = seq(state, name);
      }
      if (_super != null) {
        state = seq(state, t("extends"), _super);
      }
      state = seq.apply(undefined, [state, t("{")].concat(_toConsumableArray(elements), [t("}")]));
      state.startsWithFunctionOrClass = true;
      return state;
    }
  }, {
    key: "reduceClassElement",
    value: function reduceClassElement(node, _ref17) {
      var method = _ref17.method;

      if (!node.isStatic) return method;
      return seq(t("static"), method);
    }
  }, {
    key: "reduceComputedMemberExpression",
    value: function reduceComputedMemberExpression(node, _ref18) {
      var object = _ref18.object;
      var expression = _ref18.expression;

      return objectAssign(seq(p(node.object, getPrecedence(node), object), bracket(expression)), { startsWithCurly: object.startsWithCurly, startsWithFunctionOrClass: object.startsWithFunctionOrClass });
    }
  }, {
    key: "reduceComputedPropertyName",
    value: function reduceComputedPropertyName(node, _ref19) {
      var expression = _ref19.expression;

      return bracket(expression);
    }
  }, {
    key: "reduceConditionalExpression",
    value: function reduceConditionalExpression(node, _ref20) {
      var test = _ref20.test;
      var consequent = _ref20.consequent;
      var alternate = _ref20.alternate;

      var containsIn = test.containsIn || alternate.containsIn;
      var startsWithCurly = test.startsWithCurly;
      var startsWithFunctionOrClass = test.startsWithFunctionOrClass;
      return objectAssign(seq(p(node.test, Precedence.LogicalOR, test), t("?"), p(node.consequent, Precedence.Assignment, consequent), t(":"), p(node.alternate, Precedence.Assignment, alternate)), {
        containsIn: containsIn,
        startsWithCurly: startsWithCurly,
        startsWithFunctionOrClass: startsWithFunctionOrClass
      });
    }
  }, {
    key: "reduceContinueStatement",
    value: function reduceContinueStatement(node, _ref21) {
      var label = _ref21.label;

      return seq(t("continue"), label ? t(label) : empty(), semiOp());
    }
  }, {
    key: "reduceDataProperty",
    value: function reduceDataProperty(node, _ref22) {
      var name = _ref22.name;
      var expression = _ref22.expression;

      return seq(name, t(":"), getAssignmentExpr(expression));
    }
  }, {
    key: "reduceDebuggerStatement",
    value: function reduceDebuggerStatement(node) {
      return seq(t("debugger"), semiOp());
    }
  }, {
    key: "reduceDoWhileStatement",
    value: function reduceDoWhileStatement(node, _ref23) {
      var body = _ref23.body;
      var test = _ref23.test;

      return seq(t("do"), body, t("while"), paren(test), semiOp());
    }
  }, {
    key: "reduceEmptyStatement",
    value: function reduceEmptyStatement(node) {
      return semi();
    }
  }, {
    key: "reduceExpressionStatement",
    value: function reduceExpressionStatement(node, _ref24) {
      var expression = _ref24.expression;

      return seq(expression.startsWithCurly || expression.startsWithFunctionOrClass ? paren(expression) : expression, semiOp());
    }
  }, {
    key: "reduceForInStatement",
    value: function reduceForInStatement(node, _ref25) {
      var left = _ref25.left;
      var right = _ref25.right;
      var body = _ref25.body;

      var leftP = left;
      switch (node.left.type) {
        case "VariableDeclaration":
          leftP = noIn(markContainsIn(left));
          break;
        case "BindingIdentifier":
          if (node.left.name === "let") {
            leftP = paren(left);
          }
          break;
      }
      return objectAssign(seq(t("for"), paren(seq(leftP, t("in"), right)), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: "reduceForStatement",
    value: function reduceForStatement(node, _ref26) {
      var init = _ref26.init;
      var test = _ref26.test;
      var update = _ref26.update;
      var body = _ref26.body;

      return objectAssign(seq(t("for"), paren(seq(init ? noIn(markContainsIn(init)) : empty(), semi(), test || empty(), semi(), update || empty())), body), {
        endsWithMissingElse: body.endsWithMissingElse
      });
    }
  }, {
    key: "reduceFunctionBody",
    value: function reduceFunctionBody(node, _ref27) {
      var directives = _ref27.directives;
      var statements = _ref27.statements;

      if (statements.length) {
        statements[0] = parenToAvoidBeingDirective(node.statements[0], statements[0]);
      }
      return seq.apply(undefined, _toConsumableArray(directives).concat(_toConsumableArray(statements)));
    }
  }, {
    key: "reduceFunctionDeclaration",
    value: function reduceFunctionDeclaration(node, _ref28) {
      var name = _ref28.name;
      var params = _ref28.params;
      var body = _ref28.body;

      return seq(t("function"), node.isGenerator ? t("*") : empty(), node.name.name === "*default*" ? empty() : name, paren(params), brace(body));
    }
  }, {
    key: "reduceFunctionExpression",
    value: function reduceFunctionExpression(node, _ref29) {
      var name = _ref29.name;
      var params = _ref29.params;
      var body = _ref29.body;

      var state = seq(t("function"), node.isGenerator ? t("*") : empty(), name ? name : empty(), paren(params), brace(body));
      state.startsWithFunctionOrClass = true;
      return state;
    }
  }, {
    key: "reduceFormalParameters",
    value: function reduceFormalParameters(node, _ref30) {
      var items = _ref30.items;
      var rest = _ref30.rest;

      return commaSep(items.concat(rest == null ? [] : [seq(t("..."), rest)]));
    }
  }, {
    key: "reduceArrowExpression",
    value: function reduceArrowExpression(node, _ref31) {
      var params = _ref31.params;
      var body = _ref31.body;

      if (node.params.rest != null || node.params.items.length !== 1 || node.params.items[0].type !== "BindingIdentifier") {
        params = paren(params);
      }
      if (node.body.type === "FunctionBody") {
        body = brace(body);
      } else if (body.startsWithCurly) {
        body = paren(body);
      }
      return seq(params, t("=>"), body);
    }
  }, {
    key: "reduceGetter",
    value: function reduceGetter(node, _ref32) {
      var name = _ref32.name;
      var body = _ref32.body;

      return seq(t("get"), name, paren(empty()), brace(body));
    }
  }, {
    key: "reduceIdentifierExpression",
    value: function reduceIdentifierExpression(node) {
      return t(node.name);
    }
  }, {
    key: "reduceIfStatement",
    value: function reduceIfStatement(node, _ref33) {
      var test = _ref33.test;
      var consequent = _ref33.consequent;
      var alternate = _ref33.alternate;

      if (alternate && consequent.endsWithMissingElse) {
        consequent = brace(consequent);
      }
      return objectAssign(seq(t("if"), paren(test), consequent, alternate ? seq(t("else"), alternate) : empty()), { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
    }
  }, {
    key: "reduceImport",
    value: function reduceImport(node, _ref34) {
      var defaultBinding = _ref34.defaultBinding;
      var namedImports = _ref34.namedImports;

      var bindings = [];
      if (defaultBinding != null) {
        bindings.push(defaultBinding);
      }
      if (namedImports.length > 0) {
        bindings.push(brace(commaSep(namedImports)));
      }
      if (bindings.length === 0) {
        return seq(t("import"), t(escapeStringLiteral(node.moduleSpecifier)));
      }
      return seq(t("import"), commaSep(bindings), t("from"), t(escapeStringLiteral(node.moduleSpecifier)));
    }
  }, {
    key: "reduceImportNamespace",
    value: function reduceImportNamespace(node, _ref35) {
      var defaultBinding = _ref35.defaultBinding;
      var namespaceBinding = _ref35.namespaceBinding;

      return seq(t("import"), defaultBinding == null ? empty() : seq(defaultBinding, t(",")), t("*"), t("as"), namespaceBinding, t("from"), t(escapeStringLiteral(node.moduleSpecifier)));
    }
  }, {
    key: "reduceImportSpecifier",
    value: function reduceImportSpecifier(node, _ref36) {
      var binding = _ref36.binding;

      if (node.name == null) return binding;
      return seq(t(node.name), t("as"), binding);
    }
  }, {
    key: "reduceExportAllFrom",
    value: function reduceExportAllFrom(node) {
      return seq(t("export"), t("*"), t("from"), t(escapeStringLiteral(node.moduleSpecifier)));
    }
  }, {
    key: "reduceExportFrom",
    value: function reduceExportFrom(node, _ref37) {
      var namedExports = _ref37.namedExports;

      return seq(t("export"), brace(commaSep(namedExports)), node.moduleSpecifier == null ? empty() : seq(t("from"), t(escapeStringLiteral(node.moduleSpecifier))));
    }
  }, {
    key: "reduceExport",
    value: function reduceExport(node, _ref38) {
      var declaration = _ref38.declaration;

      return seq(t("export"), declaration);
    }
  }, {
    key: "reduceExportDefault",
    value: function reduceExportDefault(node, _ref39) {
      var body = _ref39.body;

      return seq(t("export default"), body.startsWithFunctionOrClass ? paren(body) : body);
    }
  }, {
    key: "reduceExportSpecifier",
    value: function reduceExportSpecifier(node) {
      if (node.name == null) return t(node.exportedName);
      return seq(t(node.name), t("as"), t(node.exportedName));
    }
  }, {
    key: "reduceLabeledStatement",
    value: function reduceLabeledStatement(node, _ref40) {
      var label = _ref40.label;
      var body = _ref40.body;

      return objectAssign(seq(t(label + ":"), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: "reduceLiteralBooleanExpression",
    value: function reduceLiteralBooleanExpression(node) {
      return t(node.value.toString());
    }
  }, {
    key: "reduceLiteralNullExpression",
    value: function reduceLiteralNullExpression(node) {
      return t("null");
    }
  }, {
    key: "reduceLiteralInfinityExpression",
    value: function reduceLiteralInfinityExpression(node) {
      return t("2e308");
    }
  }, {
    key: "reduceLiteralNumericExpression",
    value: function reduceLiteralNumericExpression(node) {
      return new NumberCodeRep(node.value);
    }
  }, {
    key: "reduceLiteralRegExpExpression",
    value: function reduceLiteralRegExpExpression(node) {
      return t("/" + node.pattern + "/" + node.flags);
    }
  }, {
    key: "reduceLiteralStringExpression",
    value: function reduceLiteralStringExpression(node) {
      return t(escapeStringLiteral(node.value));
    }
  }, {
    key: "reduceMethod",
    value: function reduceMethod(node, _ref41) {
      var name = _ref41.name;
      var params = _ref41.params;
      var body = _ref41.body;

      return seq(node.isGenerator ? t("*") : empty(), name, paren(params), brace(body));
    }
  }, {
    key: "reduceModule",
    value: function reduceModule(node, _ref42) {
      var items = _ref42.items;

      return seq.apply(undefined, _toConsumableArray(items));
    }
  }, {
    key: "reduceNewExpression",
    value: function reduceNewExpression(node, _ref43) {
      var callee = _ref43.callee;
      var args = _ref43.arguments;

      var calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) : p(node.callee, getPrecedence(node), callee);
      return seq(t("new"), calleeRep, args.length === 0 ? empty() : paren(commaSep(args)));
    }
  }, {
    key: "reduceObjectExpression",
    value: function reduceObjectExpression(node, _ref44) {
      var properties = _ref44.properties;

      var state = brace(commaSep(properties));
      state.startsWithCurly = true;
      return state;
    }
  }, {
    key: "reducePostfixExpression",
    value: function reducePostfixExpression(node, _ref45) {
      var operand = _ref45.operand;

      return objectAssign(seq(p(node.operand, Precedence.New, operand), t(node.operator)), { startsWithCurly: operand.startsWithCurly, startsWithFunctionOrClass: operand.startsWithFunctionOrClass });
    }
  }, {
    key: "reducePrefixExpression",
    value: function reducePrefixExpression(node, _ref46) {
      var operand = _ref46.operand;

      return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
    }
  }, {
    key: "reduceReturnStatement",
    value: function reduceReturnStatement(node, _ref47) {
      var expression = _ref47.expression;

      return seq(t("return"), expression || empty(), semiOp());
    }
  }, {
    key: "reduceScript",
    value: function reduceScript(node, _ref48) {
      var body = _ref48.body;

      return body;
    }
  }, {
    key: "reduceSetter",
    value: function reduceSetter(node, _ref49) {
      var name = _ref49.name;
      var param = _ref49.param;
      var body = _ref49.body;

      return seq(t("set"), name, paren(param), brace(body));
    }
  }, {
    key: "reduceShorthandProperty",
    value: function reduceShorthandProperty(node) {
      return t(node.name);
    }
  }, {
    key: "reduceStaticMemberExpression",
    value: function reduceStaticMemberExpression(node, _ref50) {
      var object = _ref50.object;
      var property = _ref50.property;

      var state = seq(p(node.object, getPrecedence(node), object), t("."), t(property));
      state.startsWithCurly = object.startsWithCurly;
      state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
      return state;
    }
  }, {
    key: "reduceStaticPropertyName",
    value: function reduceStaticPropertyName(node) {
      var n;
      if (_esutils.keyword.isIdentifierNameES6(node.value)) {
        return t(node.value);
      } else if ((n = parseFloat(node.value), n === n)) {
        return new NumberCodeRep(n);
      }
      return t(escapeStringLiteral(node.value));
    }
  }, {
    key: "reduceSwitchCase",
    value: function reduceSwitchCase(node, _ref51) {
      var test = _ref51.test;
      var consequent = _ref51.consequent;

      return seq(t("case"), test, t(":"), seq.apply(undefined, _toConsumableArray(consequent)));
    }
  }, {
    key: "reduceSwitchDefault",
    value: function reduceSwitchDefault(node, _ref52) {
      var consequent = _ref52.consequent;

      return seq(t("default:"), seq.apply(undefined, _toConsumableArray(consequent)));
    }
  }, {
    key: "reduceSwitchStatement",
    value: function reduceSwitchStatement(node, _ref53) {
      var discriminant = _ref53.discriminant;
      var cases = _ref53.cases;

      return seq(t("switch"), paren(discriminant), brace(seq.apply(undefined, _toConsumableArray(cases))));
    }
  }, {
    key: "reduceSwitchStatementWithDefault",
    value: function reduceSwitchStatementWithDefault(node, _ref54) {
      var discriminant = _ref54.discriminant;
      var preDefaultCases = _ref54.preDefaultCases;
      var defaultCase = _ref54.defaultCase;
      var postDefaultCases = _ref54.postDefaultCases;

      return seq(t("switch"), paren(discriminant), brace(seq.apply(undefined, _toConsumableArray(preDefaultCases).concat([defaultCase], _toConsumableArray(postDefaultCases)))));
    }
  }, {
    key: "reduceThisExpression",
    value: function reduceThisExpression(node) {
      return t("this");
    }
  }, {
    key: "reduceThrowStatement",
    value: function reduceThrowStatement(node, _ref55) {
      var expression = _ref55.expression;

      return seq(t("throw"), expression, semiOp());
    }
  }, {
    key: "reduceTryCatchStatement",
    value: function reduceTryCatchStatement(node, _ref56) {
      var body = _ref56.body;
      var catchClause = _ref56.catchClause;

      return seq(t("try"), body, catchClause);
    }
  }, {
    key: "reduceTryFinallyStatement",
    value: function reduceTryFinallyStatement(node, _ref57) {
      var body = _ref57.body;
      var catchClause = _ref57.catchClause;
      var finalizer = _ref57.finalizer;

      return seq(t("try"), body, catchClause || empty(), t("finally"), finalizer);
    }
  }, {
    key: "reduceDirective",
    value: function reduceDirective(node) {
      var delim = /^(?:[^"\\]|\\.)*$/.test(node.rawValue) ? "\"" : "'";
      return seq(t(delim + node.rawValue + delim), semiOp());
    }
  }, {
    key: "reduceVariableDeclaration",
    value: function reduceVariableDeclaration(node, _ref58) {
      var declarators = _ref58.declarators;

      return seq(t(node.kind), commaSep(declarators));
    }
  }, {
    key: "reduceVariableDeclarationStatement",
    value: function reduceVariableDeclarationStatement(node, _ref59) {
      var declaration = _ref59.declaration;

      return seq(declaration, semiOp());
    }
  }, {
    key: "reduceVariableDeclarator",
    value: function reduceVariableDeclarator(node, _ref60) {
      var binding = _ref60.binding;
      var init = _ref60.init;

      var containsIn = init && init.containsIn && !init.containsGroup;
      if (init) {
        if (init.containsGroup) {
          init = paren(init);
        } else {
          init = markContainsIn(init);
        }
      }
      return objectAssign(new Init(binding, init), { containsIn: containsIn });
    }
  }, {
    key: "reduceWhileStatement",
    value: function reduceWhileStatement(node, _ref61) {
      var test = _ref61.test;
      var body = _ref61.body;

      return objectAssign(seq(t("while"), paren(test), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }, {
    key: "reduceWithStatement",
    value: function reduceWithStatement(node, _ref62) {
      var object = _ref62.object;
      var body = _ref62.body;

      return objectAssign(seq(t("with"), paren(object), body), { endsWithMissingElse: body.endsWithMissingElse });
    }
  }]);

  return CodeGen;
})();

var INSTANCE = new CodeGen();