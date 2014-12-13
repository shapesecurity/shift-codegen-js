import reduce, {Reducer} from "laserbat-reducer";
import * as objectAssign from "object-assign";
import {TokenStream} from "./token_stream";

export default function codeGen(script) {
  let ts = new TokenStream();
  let rep = reduce(INSTANCE, script);
  rep.emit(ts);
  return ts.result;
}

const Precedence = {
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

const BinaryPrecedence = {
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
    case 'ArrayExpression':
    case 'FunctionExpression':
    case 'IdentifierExpression':
    case 'LiteralBooleanExpression':
    case 'LiteralNullExpression':
    case 'LiteralNumericExpression':
    case 'LiteralRegExpExpression':
    case 'LiteralStringExpression':
    case 'ObjectExpression':
      return Precedence.Primary;

    case 'AssignmentExpression':
      return Precedence.Assignment;

    case 'ConditionalExpression':
      return Precedence.Conditional;

    case 'ComputedMemberExpression':
    case 'StaticMemberExpression':
      switch (node.object.type) {
        case 'CallExpression':
        case 'ComputedMemberExpression':
        case 'StaticMemberExpression':
          return getPrecedence(node.object);
        default:
          return Precedence.Member;
      }

    case 'BinaryExpression':
      return BinaryPrecedence[node.operator];

    case 'CallExpression':
      return Precedence.Call;
    case 'NewExpression':
      return node.arguments.length === 0 ? Precedence.New : Precedence.Member;
    case 'PostfixExpression':
      return Precedence.Postfix;
    case 'PrefixExpression':
      return Precedence.Prefix;
  }
}

function escapeStringLiteral(stringValue) {
  let result = "";
  result += ('"');
  for (let i = 0; i < stringValue.length; i++) {
    let ch = stringValue.charAt(i);
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
      case "\u000B":
        result += "\\v";
        break;
      case "\u000C":
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
  result += '"';
  return result.toString();
}

function p(node, precedence, a) {
  return getPrecedence(node) < precedence ? paren(a) : a;
}

class CodeRep {
  constructor() {
    this.containsIn = false;
    this.containsGroup = false;
    this.startsWithFunctionOrCurly = false;
    this.endsWithMissingElse = false;
  }

  emit(stream, noIn) {
    throw new Error("Not implemented");
  }
}

class Empty extends CodeRep {
  emit() {
  }
}

class Token extends CodeRep {
  constructor(token) {
    super();
    this.token = token;
  }

  emit(ts) {
    ts.put(this.token);
  }
}

class NumberCodeRep extends CodeRep {
  constructor(number) {
    super();
    this.number = number;
  }

  emit(ts) {
    ts.putNumber(this.number);
  }
}

class Paren extends CodeRep {
  constructor(expr) {
    super();
    this.expr = expr;
  }

  emit(ts) {
    ts.put("(");
    this.expr.emit(ts, false);
    ts.put(")");
  }
}

class Bracket extends CodeRep {
  constructor(expr) {
    super();
    this.expr = expr;
  }

  emit(ts) {
    ts.put("[");
    this.expr.emit(ts, false);
    ts.put("]");
  }
}

class Brace extends CodeRep {
  constructor(expr) {
    super();
    this.expr = expr;
  }

  emit(ts) {
    ts.put("{");
    this.expr.emit(ts, false);
    ts.put("}");
  }
}

class NoIn extends CodeRep {
  constructor(expr) {
    super();
    this.expr = expr;
  }

  emit(ts) {
    this.expr.emit(ts, true);
  }
}

class ContainsIn extends CodeRep {
  constructor(expr) {
    super();
    this.expr = expr;
  }

  emit(ts, noIn) {
    if (noIn) {
      ts.put("(");
      this.expr.emit(ts, false);
      ts.put(")");
    } else {
      this.expr.emit(ts, false);
    }
  }
}

class Seq extends CodeRep {
  constructor(children) {
    super();
    this.children = children;
  }

  emit(ts, noIn) {
    this.children.forEach(cr => cr.emit(ts, noIn));
  }
}

class Semi extends Token {
  constructor() {
    super(";");
  }
}

class CommaSep extends CodeRep {
  constructor(children) {
    super();
    this.children = children;
  }

  emit(ts, noIn) {
    var first = true;
    this.children.forEach(
        (cr) => {
          if (first) {
            first = false;
          } else {
            ts.put(",");
          }
          cr.emit(ts, noIn);
        });
  }
}

class SemiOp extends CodeRep {
  emit(ts) {
    ts.putOptionalSemi();
  }
}

class Init extends CodeRep {
  constructor(binding, init) {
    super();
    this.binding = binding;
    this.init = init;
  }

  emit(ts, noIn) {
    this.binding.emit(ts);
    if (this.init != null) {
      ts.put("=");
      this.init.emit(ts, noIn);
    }
  }
}

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

function seq(...reps) {
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

class CodeGen extends Reducer {

  reduceScript(node, body) {
    return body;
  }

  reduceIdentifier(node) {
    return t(node.name);
  }

  reduceIdentifierExpression(node, name) {
    return name;
  }

  reduceThisExpression(node) {
    return t("this");
  }

  reduceLiteralBooleanExpression(node) {
    return t(node.value.toString());
  }

  reduceLiteralStringExpression(node) {
    return t(escapeStringLiteral(node.value));
  }

  reduceLiteralRegExpExpression(node) {
    return t(node.value);
  }

  reduceLiteralNumericExpression(node) {
    return new NumberCodeRep(node.value);
  }

  reduceLiteralNullExpression(node) {
    return t("null");
  }

  reduceFunctionExpression(node, id, params, body) {
    const argBody = seq(paren(commaSep(params)), brace(body));
    let state = seq(t("function"), id ? seq(id, argBody) : argBody);
    state.startsWithFunctionOrCurly = true;
    return state;
  }

  reduceStaticMemberExpression(node, object, property) {
    const state = seq(p(node.object, getPrecedence(node), object), t("."), property);
    state.startsWithFunctionOrCurly = object.startsWithFunctionOrCurly;
    return state;
  }

  reduceComputedMemberExpression(node, object, expression) {
    return objectAssign(
        seq(p(node.object, getPrecedence(node), object), bracket(expression)),
        {startsWithFunctionOrCurly: object.startsWithFunctionOrCurly});
  }

  reduceObjectExpression(node, properties) {
    let state = brace(commaSep(properties));
    state.startsWithFunctionOrCurly = true;
    return state;
  }

  reduceBinaryExpression(node, left, right) {
    let leftCode = left;
    let startsWithFunctionOrCurly = left.startsWithFunctionOrCurly;
    let leftContainsIn = left.containsIn;
    if (getPrecedence(node.left) < getPrecedence(node)) {
      leftCode = paren(leftCode);
      startsWithFunctionOrCurly = false;
      leftContainsIn = false;
    }
    let rightCode = right;
    let rightContainsIn = right.containsIn;
    if (getPrecedence(node.right) <= getPrecedence(node)) {
      rightCode = paren(rightCode);
      rightContainsIn = false;
    }

    return objectAssign(
        seq(leftCode, t(node.operator), rightCode),
        {
          containsIn: leftContainsIn || rightContainsIn || node.operator === "in",
          containsGroup: node.operator == ",",
          startsWithFunctionOrCurly
        });
  }

  reduceAssignmentExpression(node, binding, expression) {
    let rightCode = expression;
    let containsIn = expression.containsIn;
    let startsWithFunctionOrCurly = binding.startsWithFunctionOrCurly;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = paren(rightCode);
      containsIn = false;
    }
    return objectAssign(seq(binding, t(node.operator), rightCode), {containsIn, startsWithFunctionOrCurly});
  }

  reduceArrayExpression(node, elements) {
    if (elements.length === 0) {
      return bracket(empty());
    }

    let content = commaSep(elements.map(getAssignmentExpr));
    if (elements.length > 0 && elements[elements.length - 1] == null) {
      content = seq(content, t(","));
    }
    return bracket(content);
  }

  reduceNewExpression(node, callee, args) {
    let calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) :
        p(node.callee, getPrecedence(node), callee);
    return seq(t("new"), calleeRep, args.length === 0 ? empty() : paren(commaSep(args)));
  }

  reduceCallExpression(node, callee, args) {
    return objectAssign(
        seq(p(node.callee, getPrecedence(node), callee), paren(commaSep(args))),
        {startsWithFunctionOrCurly: callee.startsWithFunctionOrCurly});
  }

  reducePostfixExpression(node, operand) {
    return objectAssign(
        seq(p(node.operand, getPrecedence(node), operand), t(node.operator)),
        {startsWithFunctionOrCurly: operand.startsWithFunctionOrCurly});
  }

  reducePrefixExpression(node, operand) {
    return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
  }

  reduceConditionalExpression(node, test, consequent, alternate) {
    let containsIn = test.containsIn || alternate.containsIn;
    let startsWithFunctionOrCurly = test.startsWithFunctionOrCurly;
    return objectAssign(
        seq(
            p(node.test, Precedence.LogicalOR, test), t("?"),
            p(node.consequent, Precedence.Assignment, consequent), t(":"),
            p(node.alternate, Precedence.Assignment, alternate)), {
          containsIn,
          startsWithFunctionOrCurly
        });
  }

  reduceFunctionDeclaration(node, id, params, body) {
    return seq(t("function"), id, paren(commaSep(params)), brace(body));
  }

  reduceUseStrictDirective(node) {
    return seq(t("\"use strict\""), semiOp());
  }

  reduceUnknownDirective(node) {
    var name = "use strict" === node.value ? "use\\u0020strict" : node.value;
    return seq(t("\"" + name + "\""), semiOp());
  }

  reduceBlockStatement(node, block) {
    return block;
  }

  reduceBreakStatement(node, label) {
    return seq(t("break"), label || empty(), semiOp());
  }

  reduceCatchClause(node, param, body) {
    return seq(t("catch"), paren(param), body);
  }

  reduceContinueStatement(node, label) {
    return seq(t("continue"), label || empty(), semiOp());
  }

  reduceDebuggerStatement(node) {
    return seq(t("debugger"), semiOp());
  }

  reduceDoWhileStatement(node, body, test) {
    return seq(t("do"), body, t("while"), paren(test), semiOp());
  }

  reduceEmptyStatement(node) {
    return semi();
  }

  reduceExpressionStatement(node, expression) {
    return seq((expression.startsWithFunctionOrCurly ? paren(expression) : expression), semiOp());
  }

  reduceForInStatement(node, left, right, body) {
    return objectAssign(
        seq(t("for"), paren(seq(noIn(markContainsIn(left)), t("in"), right)), body),
        {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForStatement(node, init, test, update, body) {
    return objectAssign(
        seq(
            t("for"),
            paren(seq(init ? noIn(markContainsIn(init)) : empty(), semi(), test || empty(), semi(), update || empty())),
            body),
        {
          endsWithMissingElse: body.endsWithMissingElse
        });
  }

  reduceIfStatement(node, test, consequent, alternate) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = brace(consequent);
    }
    return objectAssign(
        seq(t("if"), paren(test), consequent, alternate ? seq(t("else"), alternate) : empty()),
        {endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true});
  }

  reduceLabeledStatement(node, label, body) {
    return objectAssign(seq(label, t(":"), body), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceReturnStatement(node, argument) {
    return seq(t("return"), argument || empty(), semiOp());
  }

  reduceSwitchCase(node, test, consequent) {
    return seq(t("case"), test, t(":"), seq(...consequent));
  }

  reduceSwitchDefault(node, consequent) {
    return seq(t("default"), t(":"), seq(...consequent));
  }

  reduceSwitchStatement(node, discriminant, cases) {
    return seq(t("switch"), paren(discriminant), brace(seq(...cases)));
  }

  reduceSwitchStatementWithDefault(node, discriminant, cases, defaultCase, postDefaultCases) {
    return seq(
        t("switch"),
        paren(discriminant),
        brace(seq(...cases, defaultCase, ...postDefaultCases)));
  }

  reduceThrowStatement(node, argument) {
    return seq(t("throw"), argument, semiOp());
  }

  reduceTryCatchStatement(node, block, catchClause) {
    return seq(t("try"), block, catchClause);
  }

  reduceTryFinallyStatement(node, block, catchClause, finalizer) {
    return seq(
        t("try"),
        block,
        catchClause || empty(),
        t("finally"),
        finalizer);
  }

  reduceVariableDeclarationStatement(node, declaration) {
    return seq(declaration, semiOp());
  }

  reduceVariableDeclaration(node, declarators) {
    return seq(t(node.kind), commaSep(declarators));
  }

  reduceWhileStatement(node, test, body) {
    return objectAssign(seq(t("while"), paren(test), body), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceWithStatement(node, object, body) {
    return objectAssign(
        seq(t("with"), paren(object), body),
        {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceDataProperty(node, key, value) {
    return seq(key, t(":"), getAssignmentExpr(value));
  }

  reduceGetter(node, key, body) {
    return seq(t("get"), key, paren(empty()), brace(body));
  }

  reduceSetter(node, key, parameter, body) {
    return seq(t("set"), key, paren(parameter), brace(body));
  }

  reducePropertyName(node) {
    if (node.kind == "number" || node.kind == "identifier") {
      return t(node.value.toString());
    }
    return t(Utils.escapeStringLiteral(node.value));
  }

  reduceFunctionBody(node, directives, sourceElements) {
    if (sourceElements.length) {
      sourceElements[0] = parenToAvoidBeingDirective(node.statements[0], sourceElements[0]);
    }
    return seq(...directives, ...sourceElements);
  }

  reduceVariableDeclarator(node, id, init) {
    let containsIn = init && init.containsIn && !init.containsGroup;
    if (init) {
      if (init.containsGroup) {
        init = paren(init);
      } else {
        init = markContainsIn(init);
      }
    }
    return objectAssign(new Init(id, init), {containsIn});
  }

  reduceBlock(node, statements) {
    return brace(seq(...statements));
  }
}

const INSTANCE = new CodeGen;
