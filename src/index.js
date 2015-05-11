import reduce from "shift-reducer";
import * as objectAssign from "object-assign";
import {keyword} from "esutils";
import {TokenStream} from "./token_stream";

export default function codeGen(script) {
  let ts = new TokenStream;
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
    case "YieldExpression":
    case "YieldGeneratorExpression":
      return Precedence.Assignment;

    case "ConditionalExpression":
      return Precedence.Conditional;

    case "ComputedMemberExpression":
    case "StaticMemberExpression":
      switch (node.object.type) {
        case "CallExpression":
        case "ComputedMemberExpression":
        case "StaticMemberExpression":
        case "TemplateExpression":
          return getPrecedence(node.object);
        default:
          return Precedence.Member;
      }

    case "TemplateExpression":
      if (node.tag == null) return Precedence.Member;
      switch (node.tag.type) {
        case "CallExpression":
        case "ComputedMemberExpression":
        case "StaticMemberExpression":
        case "TemplateExpression":
          return getPrecedence(node.tag);
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
  let result = "";
  let nSingle = 0, nDouble = 0;
  for (let i = 0, l = stringValue.length; i < l; ++i) {
    let ch = stringValue[i];
    if (ch === "\"") {
      ++nDouble;
    } else if (ch === "'") {
      ++nSingle;
    }
  }
  let delim = nDouble > nSingle ? "'" : "\"";
  result += delim;
  for (let i = 0; i < stringValue.length; i++) {
    let ch = stringValue.charAt(i);
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
      case "\u000B":
        result += "\\v";
        break;
      case "\u000C":
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

class CodeRep {
  constructor() {
    this.containsIn = false;
    this.containsGroup = false;
    // restricted tokens: {, function, class
    this.startsWithCurly = false;
    this.startsWithFunctionOrClass = false;
    this.endsWithMissingElse = false;
  }
}

class Empty extends CodeRep {
  constructor() {
    super();
  }

  emit() {}
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
    this.children.forEach((cr) => {
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
  constructor() {
    super();
  }

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
  return new Semi;
}

function empty() {
  return new Empty;
}

function commaSep(pieces) {
  return new CommaSep(pieces);
}

function brace(rep) {
  return new Brace(rep);
}

function semiOp() {
  return new SemiOp;
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

class CodeGen {

  reduceArrayExpression(node, {elements}) {
    if (elements.length === 0) {
      return bracket(empty());
    }

    let content = commaSep(elements.map(getAssignmentExpr));
    if (elements.length > 0 && elements[elements.length - 1] == null) {
      content = seq(content, t(","));
    }
    return bracket(content);
  }

  reduceSpreadElement(node, {expression}) {
    return seq(t("..."), p(node.expression, Precedence.Assignment, expression));
  }

  reduceAssignmentExpression(node, {binding, expression}) {
    let leftCode = binding;
    let rightCode = expression;
    let containsIn = expression.containsIn;
    let startsWithCurly = binding.startsWithCurly;
    let startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = paren(rightCode);
      containsIn = false;
    }
    return objectAssign(seq(leftCode, t(node.operator), rightCode), {containsIn, startsWithCurly, startsWithFunctionOrClass});
  }

  reduceBinaryExpression(node, {left, right}) {
    let leftCode = left;
    let startsWithCurly = left.startsWithCurly;
    let startsWithFunctionOrClass = left.startsWithFunctionOrClass;
    let leftContainsIn = left.containsIn;
    if (getPrecedence(node.left) < getPrecedence(node)) {
      leftCode = paren(leftCode);
      startsWithCurly = false;
      startsWithFunctionOrClass = false;
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
        startsWithCurly,
        startsWithFunctionOrClass
      });
  }

  reduceBindingWithDefault(node, {binding, init}) {
    return seq(binding, t("="), init);
  }

  reduceBindingIdentifier(node) {
    return t(node.name);
  }

  reduceArrayBinding(node, {elements, restElement}) {
    let content;
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

  reduceObjectBinding(node, {properties}) {
    let state = brace(commaSep(properties));
    state.startsWithCurly = true;
    return state;
  }

  reduceBindingPropertyIdentifier(node, {binding, init}) {
    if (node.init == null) return binding;
    return seq(binding, t("="), init);
  }

  reduceBindingPropertyProperty(node, {name, binding}) {
    return seq(name, t(":"), binding);
  }

  reduceBlock(node, {statements}) {
    return brace(seq(...statements));
  }

  reduceBlockStatement(node, {block}) {
    return block;
  }

  reduceBreakStatement(node, {label}) {
    return seq(t("break"), label ? t(label) : empty(), semiOp());
  }

  reduceCallExpression(node, {callee, arguments: args}) {
    return objectAssign(
      seq(p(node.callee, getPrecedence(node), callee), paren(commaSep(args))),
      {startsWithCurly: callee.startsWithCurly, startsWithFunctionOrClass: callee.startsWithFunctionOrClass});
  }

  reduceCatchClause(node, {binding, body}) {
    return seq(t("catch"), paren(binding), body);
  }

  reduceClassDeclaration(node, {name, super: _super, elements}) {
    let state = seq(t("class"), name);
    if (_super != null) {
      state = seq(state, t("extends"), _super);
    }
    state = seq(state, t("{"), ...elements, t("}"));
    return state;
  }

  reduceClassExpression(node, {name, super: _super, elements}) {
    let state = t("class");
    if (name != null) {
      state = seq(state, name);
    }
    if (_super != null) {
      state = seq(state, t("extends"), _super);
    }
    state = seq(state, t("{"), ...elements, t("}"));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceClassElement(node, {method}) {
    if (!node.isStatic) return method;
    return seq(t("static"), method);
  }

  reduceComputedMemberExpression(node, {object, expression}) {
    return objectAssign(
      seq(p(node.object, getPrecedence(node), object), bracket(expression)),
      {startsWithCurly: object.startsWithCurly, startsWithFunctionOrClass: object.startsWithFunctionOrClass});
  }

  reduceComputedPropertyName(node, {expression}) {
    return bracket(expression);
  }

  reduceConditionalExpression(node, {test, consequent, alternate}) {
    let containsIn = test.containsIn || alternate.containsIn;
    let startsWithCurly = test.startsWithCurly;
    let startsWithFunctionOrClass = test.startsWithFunctionOrClass;
    return objectAssign(
      seq(
        p(node.test, Precedence.LogicalOR, test), t("?"),
        p(node.consequent, Precedence.Assignment, consequent), t(":"),
        p(node.alternate, Precedence.Assignment, alternate)), {
          containsIn,
          startsWithCurly,
          startsWithFunctionOrClass
        });
  }

  reduceContinueStatement(node, {label}) {
    return seq(t("continue"), label ? t(label) : empty(), semiOp());
  }

  reduceDataProperty(node, {name, expression}) {
    return seq(name, t(":"), getAssignmentExpr(expression));
  }

  reduceDebuggerStatement(node) {
    return seq(t("debugger"), semiOp());
  }

  reduceDoWhileStatement(node, {body, test}) {
    return seq(t("do"), body, t("while"), paren(test), semiOp());
  }

  reduceEmptyStatement(node) {
    return semi();
  }

  reduceExpressionStatement(node, {expression}) {
    return seq((expression.startsWithCurly || expression.startsWithFunctionOrClass ? paren(expression) : expression), semiOp());
  }

  reduceForInStatement(node, {left, right, body}) {
    let leftP = left;
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
    return objectAssign(
      seq(t("for"), paren(seq(leftP, t("in"), right)), body),
      {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForOfStatement(node, {left, right, body}) {
    left = node.left.type === "VariableDeclaration" ? noIn(markContainsIn(left)) : left;
    return objectAssign(
      seq(t("for"), paren(seq(left, t("of"), right)), body),
      {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForStatement(node, {init, test, update, body}) {
    return objectAssign(
      seq(
        t("for"),
        paren(seq(init ? noIn(markContainsIn(init)) : empty(), semi(), test || empty(), semi(), update || empty())),
        body),
        {
          endsWithMissingElse: body.endsWithMissingElse
        });
  }

  reduceFunctionBody(node, {directives, statements}) {
    if (statements.length) {
      statements[0] = parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, ...statements);
  }

  reduceFunctionDeclaration(node, {name, params, body}) {
    return seq(t("function"), node.isGenerator ? t("*") : empty(), node.name.name === "*default*" ? empty() : name, paren(params), brace(body));
  }

  reduceFunctionExpression(node, {name, params, body}) {
    let state = seq(t("function"), node.isGenerator ? t("*") : empty(), name ? name : empty(), paren(params), brace(body));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceFormalParameters(node, {items, rest}) {
    return commaSep(items.concat(rest == null ? [] : [seq(t("..."), rest)]))
  }

  reduceArrowExpression(node, {params, body}) {
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

  reduceGetter(node, {name, body}) {
    return seq(t("get"), name, paren(empty()), brace(body));
  }

  reduceIdentifierExpression(node) {
    return t(node.name);
  }

  reduceIfStatement(node, {test, consequent, alternate}) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = brace(consequent);
    }
    return objectAssign(
      seq(t("if"), paren(test), consequent, alternate ? seq(t("else"), alternate) : empty()),
      {endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true});
  }

  reduceImport(node, {defaultBinding, namedImports}) {
    let bindings = [];
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

  reduceImportNamespace(node, {defaultBinding, namespaceBinding}) {
    return seq(
      t("import"),
      defaultBinding == null ? empty() : seq(defaultBinding, t(",")),
      t("*"),
      t("as"),
      namespaceBinding,
      t("from"),
      t(escapeStringLiteral(node.moduleSpecifier))
    );
  }

  reduceImportSpecifier(node, {binding}) {
    if (node.name == null) return binding;
    return seq(t(node.name), t("as"), binding);
  }

  reduceExportAllFrom(node) {
    return seq(t("export"), t("*"), t("from"), t(escapeStringLiteral(node.moduleSpecifier)));
  }

  reduceExportFrom(node, {namedExports}) {
    return seq(t("export"), brace(commaSep(namedExports)), node.moduleSpecifier == null ? empty() : seq(t("from"), t(escapeStringLiteral(node.moduleSpecifier))));
  }

  reduceExport(node, {declaration}) {
    return seq(t("export"), declaration);
  }

  reduceExportDefault(node, {body}) {
    return seq(t("export default"), body.startsWithFunctionOrClass ? paren(body) : body);
  }

  reduceExportSpecifier(node) {
    if (node.name == null) return t(node.exportedName);
    return seq(t(node.name), t("as"), t(node.exportedName));
  }

  reduceLabeledStatement(node, {label, body}) {
    return objectAssign(seq(t(label + ":"), body), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceLiteralBooleanExpression(node) {
    return t(node.value.toString());
  }

  reduceLiteralNullExpression(node) {
    return t("null");
  }

  reduceLiteralInfinityExpression(node) {
    return t("2e308");
  }

  reduceLiteralNumericExpression(node) {
    return new NumberCodeRep(node.value);
  }

  reduceLiteralRegExpExpression(node) {
    return t(`/${node.pattern}/${node.flags}`);
  }

  reduceLiteralStringExpression(node) {
    return t(escapeStringLiteral(node.value));
  }

  reduceMethod(node, {name, params, body}) {
    return seq(node.isGenerator ? t("*") : empty(), name, paren(params), brace(body));
  }

  reduceModule(node, {items}) {
    return seq(...items);
  }

  reduceNewExpression(node, {callee, arguments: args}) {
    let calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) :
      p(node.callee, getPrecedence(node), callee);
    return seq(t("new"), calleeRep, args.length === 0 ? empty() : paren(commaSep(args)));
  }

  reduceNewTargetExpression() {
    return t("new.target");
  }

  reduceObjectExpression(node, {properties}) {
    let state = brace(commaSep(properties));
    state.startsWithCurly = true;
    return state;
  }

  reducePostfixExpression(node, {operand}) {
    return objectAssign(
      seq(p(node.operand, Precedence.New, operand), t(node.operator)),
      {startsWithCurly: operand.startsWithCurly, startsWithFunctionOrClass: operand.startsWithFunctionOrClass});
  }

  reducePrefixExpression(node, {operand}) {
    return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
  }

  reduceReturnStatement(node, {expression}) {
    return seq(t("return"), expression || empty(), semiOp());
  }

  reduceScript(node, {body}) {
    return body;
  }

  reduceSetter(node, {name, param, body}) {
    return seq(t("set"), name, paren(param), brace(body));
  }

  reduceShorthandProperty(node) {
    return t(node.name);
  }

  reduceStaticMemberExpression(node, {object, property}) {
    const state = seq(p(node.object, getPrecedence(node), object), t("."), t(property));
    state.startsWithCurly = object.startsWithCurly;
    state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
    return state;
  }

  reduceStaticPropertyName(node) {
    var n;
    if (keyword.isIdentifierNameES6(node.value)) {
      return t(node.value);
    } else if (n = parseFloat(node.value), n === n) {
      return new NumberCodeRep(n);
    }
    return t(escapeStringLiteral(node.value));
  }

  reduceSwitchCase(node, {test, consequent}) {
    return seq(t("case"), test, t(":"), seq(...consequent));
  }

  reduceSwitchDefault(node, {consequent}) {
    return seq(t("default:"), seq(...consequent));
  }

  reduceSwitchStatement(node, {discriminant, cases}) {
    return seq(t("switch"), paren(discriminant), brace(seq(...cases)));
  }

  reduceSwitchStatementWithDefault(node, {discriminant, preDefaultCases, defaultCase, postDefaultCases}) {
    return seq(
      t("switch"),
      paren(discriminant),
      brace(seq(...preDefaultCases, defaultCase, ...postDefaultCases)));
  }

  reduceTemplateExpression(node, {tag, elements}) {
    let state = node.tag == null ? empty() : p(node.tag, getPrecedence(node), tag);
    let templateData = "";
    state = seq(state, t("`"));
    for (let i = 0, l = node.elements.length; i < l; ++i) {
      if (node.elements[i].type === "TemplateElement") {
        let d = "";
        if (i > 0) d += "}";
        d += node.elements[i].rawValue;
        if (i < l - 1) d += "${"
        state = seq(state, t(d));
      } else {
        state = seq(state, elements[i]);
      }
    }
    state = seq(state, t("`"));
    if (node.tag != null) {
      state.startsWithCurly = tag.startsWithCurly;
      state.startsWithFunctionOrClass = tag.startsWithFunctionOrClass;
    }
    return state;
  }

  reduceTemplateElement(node) {
    return t(node.rawValue);
  }

  reduceThisExpression(node) {
    return t("this");
  }

  reduceThrowStatement(node, {expression}) {
    return seq(t("throw"), expression, semiOp());
  }

  reduceTryCatchStatement(node, {body, catchClause}) {
    return seq(t("try"), body, catchClause);
  }

  reduceTryFinallyStatement(node, {body, catchClause, finalizer}) {
    return seq(t("try"), body, catchClause || empty(), t("finally"), finalizer);
  }

  reduceYieldExpression(node, {expression}) {
    if (node.expression == null) return t("yield");
    return seq(t("yield"), p(node.expression, getPrecedence(node), expression));
  }

  reduceYieldGeneratorExpression(node, {expression}) {
    return seq(t("yield"), t("*"), p(node.expression, getPrecedence(node), expression));
  }

  reduceDirective(node) {
    let delim = /^(?:[^"\\]|\\.)*$/.test(node.rawValue) ? "\"" : "'";
    return seq(t(delim + node.rawValue + delim), semiOp());
  }

  reduceVariableDeclaration(node, {declarators}) {
    return seq(t(node.kind), commaSep(declarators));
  }

  reduceVariableDeclarationStatement(node, {declaration}) {
    return seq(declaration, semiOp());
  }

  reduceVariableDeclarator(node, {binding, init}) {
    let containsIn = init && init.containsIn && !init.containsGroup;
    if (init) {
      if (init.containsGroup) {
        init = paren(init);
      } else {
        init = markContainsIn(init);
      }
    }
    return objectAssign(new Init(binding, init), {containsIn});
  }

  reduceWhileStatement(node, {test, body}) {
    return objectAssign(seq(t("while"), paren(test), body), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceWithStatement(node, {object, body}) {
    return objectAssign(
      seq(t("with"), paren(object), body),
      {endsWithMissingElse: body.endsWithMissingElse});
  }
}

const INSTANCE = new CodeGen;
