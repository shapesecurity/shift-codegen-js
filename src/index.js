import reduce from "shift-reducer";
import * as objectAssign from "object-assign";
import {keyword} from "esutils";
import {TokenStream} from "./token_stream";

export default function codeGen(script, generator = new CodeGen) {
  let ts = new TokenStream;
  let rep = reduce(generator, script);
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
    case "CompoundAssignmentExpression":
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
    case "UpdateExpression":
      return node.isPrefix ? Precedence.Prefix : Precedence.Postfix;
    case "UnaryExpression":
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

function isEmpty(codeRep) {
  return codeRep instanceof Empty || (codeRep instanceof Seq && codeRep.children.every(isEmpty));
}

class CodeRep {
  constructor() {
    this.containsIn = false;
    this.containsGroup = false;
    // restricted lookaheads: {, function, class, let, let [
    this.startsWithCurly = false;
    this.startsWithFunctionOrClass = false;
    this.startsWithLet = false;
    this.startsWithLetSquareBracket = false;
    this.endsWithMissingElse = false;
  }

  forEach(f) {
    // Call a function on every CodeRep represented by this node. Always calls f on a node and then its children, so if you're careful you can modify a node's children online.
    f(this);
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

  forEach(f) {
    f(this);
    this.expr.forEach(f);
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

  forEach(f) {
    f(this);
    this.expr.forEach(f);
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

  forEach(f) {
    f(this);
    this.expr.forEach(f);
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

  forEach(f) {
    f(this);
    this.expr.forEach(f);
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

  forEach(f) {
    f(this);
    this.expr.forEach(f);
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

  forEach(f) {
    f(this);
    this.children.forEach(x => x.forEach(f));
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

  forEach(f) {
    f(this);
    this.children.forEach(x => x.forEach(f));
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

class Linebreak extends CodeRep {
  constructor() {
    super();
  }

  emit() {}
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

function getAssignmentExpr(state) {
  return state ? (state.containsGroup ? paren(state) : state) : empty();
}

function withoutTrailingLinebreak(state) {
  if (state && state instanceof Seq) {
    let lastChild = state.children[state.children.length-1];
    if (lastChild instanceof Linebreak) {
      state.children.pop();
    } else if (lastChild instanceof Seq) {
      withoutTrailingLinebreak(lastChild);
    }
  }
  return state;
}

export class CodeGen {
  parenToAvoidBeingDirective(element, original) {
    if (element && element.type === "ExpressionStatement" && element.expression.type === "LiteralStringExpression") {
      return seq(paren(original.children[0]), this.semiOp());
    }
    return original;
  }

  brace(rep, initialLinebreak = true) {
    return new Brace(initialLinebreak ? seq(this.linebreak(), rep) : rep);
  }

  commaSep(pieces) {
    return new CommaSep(pieces);
  }

  semiOp() {
    return new SemiOp;
  }

  space() {
    return empty();
  }

  linebreak() {
    return new Linebreak;
  }

  reduceArrayExpression(node, {elements}) {
    if (elements.length === 0) {
      return bracket(empty());
    }

    let content = this.commaSep(elements.map(getAssignmentExpr));
    if (elements.length > 0 && elements[elements.length - 1] == null) {
      content = seq(content, t(","), this.space());
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
    let startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = paren(rightCode);
      containsIn = false;
    }
    return objectAssign(seq(leftCode, this.space(), t("="), this.space(), rightCode), {containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass});
  }

  reduceCompoundAssignmentExpression(node, {binding, expression}) {
    let leftCode = binding;
    let rightCode = expression;
    let containsIn = expression.containsIn;
    let startsWithCurly = binding.startsWithCurly;
    let startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = paren(rightCode);
      containsIn = false;
    }
    return objectAssign(seq(leftCode, this.space(), t(node.operator), this.space(), rightCode), {containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass});
  }

  reduceBinaryExpression(node, {left, right}) {
    let leftCode = left;
    let startsWithCurly = left.startsWithCurly;
    let startsWithLetSquareBracket = left.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = left.startsWithFunctionOrClass;
    let leftContainsIn = left.containsIn;
    if (getPrecedence(node.left) < getPrecedence(node)) {
      leftCode = paren(leftCode);
      startsWithCurly = false;
      startsWithLetSquareBracket = false;
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
      seq(leftCode, node.operator == "," ? empty() : this.space(), t(node.operator), this.space(), rightCode),
      {
        containsIn: leftContainsIn || rightContainsIn || node.operator === "in",
        containsGroup: node.operator == ",",
        startsWithCurly,
        startsWithLetSquareBracket,
        startsWithFunctionOrClass
      }
    );
  }

  reduceBindingWithDefault(node, {binding, init}) {
    return seq(binding, this.space(), t("="), this.space(), init);
  }

  reduceBindingIdentifier(node) {
    let a = t(node.name);
    if (node.name === "let") {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceArrayBinding(node, {elements, restElement}) {
    let content;
    if (elements.length === 0) {
      content = restElement == null ? empty() : seq(t("..."), restElement);
    } else {
      elements = elements.concat(restElement == null ? [] : [seq(t("..."), restElement)]);
      content = this.commaSep(elements.map(getAssignmentExpr));
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, t(","), this.space());
      }
    }
    return bracket(content);
  }

  reduceObjectBinding(node, {properties}) {
    let state = this.brace(this.commaSep(properties), false);
    state.startsWithCurly = true;
    return state;
  }

  reduceBindingPropertyIdentifier(node, {binding, init}) {
    if (node.init == null) return binding;
    return seq(binding, this.space(), t("="), this.space(), init);
  }

  reduceBindingPropertyProperty(node, {name, binding}) {
    return seq(name, t(":"), this.space(), binding);
  }

  reduceBlock(node, {statements}) {
    return this.brace(seq(...statements));
  }

  reduceBlockStatement(node, {block}) {
    return seq(block, this.linebreak());
  }

  reduceBreakStatement(node, {label}) {
    return seq(t("break"), label ? t(label) : empty(), this.semiOp());
  }

  reduceCallExpression(node, {callee, arguments: args}) {
    return objectAssign(
      seq(p(node.callee, getPrecedence(node), callee), paren(this.commaSep(args))),
      {
        startsWithCurly: callee.startsWithCurly,
        startsWithLetSquareBracket: callee.startsWithLetSquareBracket,
        startsWithFunctionOrClass: callee.startsWithFunctionOrClass,
      }
    );
  }

  reduceCatchClause(node, {binding, body}) {
    return seq(t("catch"), paren(binding), this.space(), body);
  }

  reduceClassDeclaration(node, {name, super: _super, elements}) {
    let state = seq(t("class"), name);
    if (_super != null) {
      state = seq(state, t("extends"), _super);
    }
    state = seq(state, this.space(), this.brace(seq(...elements)), this.linebreak());
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
    state = seq(state, this.space(), this.brace(seq(...elements)));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceClassElement(node, {method}) {
    method = seq(method, this.linebreak());
    if (!node.isStatic) return method;
    return seq(t("static"), method);
  }

  reduceComputedMemberExpression(node, {object, expression}) {
    let startsWithLetSquareBracket =
      object.startsWithLetSquareBracket ||
      node.object.type === "IdentifierExpression" && node.object.name === "let";
    return objectAssign(
      seq(p(node.object, getPrecedence(node), object), bracket(expression)),
      {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass,
      }
    );
  }

  reduceComputedPropertyName(node, {expression}) {
    return bracket(expression);
  }

  reduceConditionalExpression(node, {test, consequent, alternate}) {
    let containsIn = test.containsIn || alternate.containsIn;
    let startsWithCurly = test.startsWithCurly;
    let startsWithLetSquareBracket = test.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = test.startsWithFunctionOrClass;
    return objectAssign(
      seq(
        p(node.test, Precedence.LogicalOR, test), this.space(), t("?"), this.space(),
        p(node.consequent, Precedence.Assignment, consequent), this.space(), t(":"), this.space(),
        p(node.alternate, Precedence.Assignment, alternate)), {
          containsIn,
          startsWithCurly,
          startsWithLetSquareBracket,
          startsWithFunctionOrClass
        });
  }

  reduceContinueStatement(node, {label}) {
    return seq(t("continue"), label ? t(label) : empty(), this.semiOp());
  }

  reduceDataProperty(node, {name, expression}) {
    return seq(name, t(":"), this.space(), getAssignmentExpr(expression));
  }

  reduceDebuggerStatement(node) {
    return seq(t("debugger"), this.semiOp());
  }

  reduceDoWhileStatement(node, {body, test}) {
    return seq(t("do"), this.space(), withoutTrailingLinebreak(body), this.space(), t("while"), this.space(), paren(test), this.semiOp());
  }

  reduceEmptyStatement(node) {
    return seq(semi(), this.linebreak());
  }

  reduceExpressionStatement(node, {expression}) {
    let needsParens =
      expression.startsWithCurly ||
      expression.startsWithLetSquareBracket ||
      expression.startsWithFunctionOrClass;
    return seq((needsParens ? paren(expression) : expression), this.semiOp());
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
      seq(t("for"), this.space(), paren(seq(leftP, t("in"), right)), this.space(), body),
      {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForOfStatement(node, {left, right, body}) {
    left = node.left.type === "VariableDeclaration" ? noIn(markContainsIn(left)) : left;
    return objectAssign(
      seq(t("for"), this.space(), paren(seq(left.startsWithLet ? paren(left) : left, t("of"), right)), this.space(), body),
      {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForStatement(node, {init, test, update, body}) {
    return objectAssign(
      seq(
        t("for"), this.space(),
        paren(seq(init ? noIn(markContainsIn(init)) : empty(), semi(), test ? seq(this.space(), test) : empty(), semi(), update ? seq(this.space(), update) : empty())),
        this.space(), body),
        {
          endsWithMissingElse: body.endsWithMissingElse
        });
  }

  reduceFunctionBody(node, {directives, statements}) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, ...statements);
  }

  reduceFunctionDeclaration(node, {name, params, body}) {
    return seq(t("function"), node.isGenerator ? t("*") : empty(), node.name.name === "*default*" ? empty() : name, paren(params), this.space(), this.brace(body), this.linebreak());
  }

  reduceFunctionExpression(node, {name, params, body}) {
    let state = seq(t("function"), node.isGenerator ? t("*") : empty(), this.space(), name ? name : empty(), paren(params), this.space(), this.brace(body));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceFormalParameters(node, {items, rest}) {
    return this.commaSep(items.concat(rest == null ? [] : [seq(t("..."), rest)]))
  }

  reduceArrowExpression(node, {params, body}) {
    if (node.params.rest != null || node.params.items.length !== 1 || node.params.items[0].type !== "BindingIdentifier") {
      params = paren(params);
    }
    if (node.body.type === "FunctionBody") {
      body = this.brace(body);
    } else if (body.startsWithCurly) {
      body = paren(body);
    }
    return seq(params, this.space(), t("=>"), this.space(), body);
  }

  reduceGetter(node, {name, body}) {
    return seq(t("get"), name, paren(empty()), this.space(), this.brace(body));
  }

  reduceIdentifierExpression(node) {
    let a = t(node.name);
    if (node.name === "let") {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceIfStatement(node, {test, consequent, alternate}) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = this.brace(consequent);
    }
    return objectAssign(
      seq(t("if"), this.space(),
        paren(test), this.space(),
        alternate ? seq(withoutTrailingLinebreak(consequent), this.space()) : consequent,
        alternate ? seq(t("else"), this.space(), alternate) : empty()),
      {endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true});
  }

  reduceImport(node, {defaultBinding, namedImports}) {
    let bindings = [];
    if (defaultBinding != null) {
      bindings.push(defaultBinding);
    }
    if (namedImports.length > 0) {
      bindings.push(this.brace(this.commaSep(namedImports), false));
    }
    if (bindings.length === 0) {
      return seq(t("import"), this.space(), t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp());
    }
    return seq(t("import"), this.space(), this.commaSep(bindings), this.space(), t("from"), this.space(), t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp());
  }

  reduceImportNamespace(node, {defaultBinding, namespaceBinding}) {
    return seq(
      t("import"), this.space(),
      defaultBinding == null ? empty() : seq(defaultBinding, t(","), this.space()),
      t("*"), this.space(),
      t("as"), this.space(),
      namespaceBinding, this.space(),
      t("from"), this.space(),
      t(escapeStringLiteral(node.moduleSpecifier)),
      this.semiOp()
    );
  }

  reduceImportSpecifier(node, {binding}) {
    if (node.name == null) return binding;
    return seq(t(node.name), this.space(), t("as"), this.space(), binding);
  }

  reduceExportAllFrom(node) {
    return seq(t("export"), this.space(), t("*"), this.space(), t("from"), this.space(), t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp());
  }

  reduceExportFrom(node, {namedExports}) {
    return seq(t("export"), this.space(), this.brace(this.commaSep(namedExports), false), node.moduleSpecifier == null ? empty() : seq(this.space(), t("from"), this.space(), t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp()));
  }

  reduceExport(node, {declaration}) {
    switch (node.declaration.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        break;
      default:
        declaration = seq(declaration, this.semiOp());
    }
    return seq(t("export"), this.space(), declaration);
  }

  reduceExportDefault(node, {body}) {
    body = body.startsWithFunctionOrClass ? paren(body) : body;
    switch (node.body.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        break;
      default:
        body = seq(body, this.semiOp());
    }
    return seq(t("export default"), this.space(), body);
  }

  reduceExportSpecifier(node) {
    if (node.name == null) return t(node.exportedName);
    return seq(t(node.name), this.space(), t("as"), this.space(), t(node.exportedName));
  }

  reduceLabeledStatement(node, {label, body}) {
    return objectAssign(seq(t(label + ":"), this.space(), body), {endsWithMissingElse: body.endsWithMissingElse});
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
    return seq(node.isGenerator ? t("*") : empty(), name, paren(params), this.space(), this.brace(body));
  }

  reduceModule(node, {directives, items}) {
    if (items.length) {
      items[0] = this.parenToAvoidBeingDirective(node.items[0], items[0]);
    }
    return seq(...directives, ...items);
  }

  reduceNewExpression(node, {callee, arguments: args}) {
    let calleeRep = getPrecedence(node.callee) == Precedence.Call ? paren(callee) :
      p(node.callee, getPrecedence(node), callee);
    return seq(t("new"), this.space(), calleeRep, args.length === 0 ? empty() : paren(this.commaSep(args)));
  }

  reduceNewTargetExpression() {
    return t("new.target");
  }

  reduceObjectExpression(node, {properties}) {
    let state = this.brace(this.commaSep(properties), false);
    state.startsWithCurly = true;
    return state;
  }

  reduceUpdateExpression(node, {operand}) {
    if (node.isPrefix) {
      return this.reduceUnaryExpression(...arguments);
    } else {
      return objectAssign(
        seq(p(node.operand, Precedence.New, operand), t(node.operator)),
        {
          startsWithCurly: operand.startsWithCurly,
          startsWithLetSquareBracket: operand.startsWithLetSquareBracket,
          startsWithFunctionOrClass: operand.startsWithFunctionOrClass
        }
      );
    }
  }

  reduceUnaryExpression(node, {operand}) {
    return seq(t(node.operator), p(node.operand, getPrecedence(node), operand));
  }

  reduceReturnStatement(node, {expression}) {
    return seq(t("return"), expression ? seq(this.space(), expression) : empty(), this.semiOp());
  }

  reduceScript(node, {directives, statements}) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, ...statements);
  }

  reduceSetter(node, {name, param, body}) {
    return seq(t("set"), this.space(), name, paren(param), this.space(), this.brace(body));
  }

  reduceShorthandProperty(node) {
    return t(node.name);
  }

  reduceStaticMemberExpression(node, {object, property}) {
    const state = seq(p(node.object, getPrecedence(node), object), t("."), t(property));
    state.startsWithLet = object.startsWithLet;
    state.startsWithCurly = object.startsWithCurly;
    state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
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

  reduceSuper() {
    return t("super");
  }

  reduceSwitchCase(node, {test, consequent}) {
    return seq(t("case"), this.space(), test, t(":"), this.linebreak(), seq(...consequent));
  }

  reduceSwitchDefault(node, {consequent}) {
    return seq(t("default:"), this.linebreak(), seq(...consequent));
  }

  reduceSwitchStatement(node, {discriminant, cases}) {
    return seq(t("switch"), paren(discriminant), this.space(), this.brace(seq(...cases)), this.linebreak());
  }

  reduceSwitchStatementWithDefault(node, {discriminant, preDefaultCases, defaultCase, postDefaultCases}) {
    return seq(
      t("switch"),
      paren(discriminant), this.space(),
      this.brace(seq(...preDefaultCases, defaultCase, ...postDefaultCases)), this.linebreak());
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
      state.startsWithLetSquareBracket = tag.startsWithLetSquareBracket;
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
    return seq(t("throw"), expression, this.semiOp());
  }

  reduceTryCatchStatement(node, {body, catchClause}) {
    return seq(t("try"), this.space(), body, this.space(), catchClause, this.linebreak());
  }

  reduceTryFinallyStatement(node, {body, catchClause, finalizer}) {
    return seq(t("try"), this.space(), body, catchClause ? seq(this.space(), catchClause) : empty(), t("finally"), this.space(), finalizer, this.linebreak());
  }

  reduceYieldExpression(node, {expression}) {
    if (node.expression == null) return t("yield");
    return seq(t("yield"), this.space(), p(node.expression, getPrecedence(node), expression));
  }

  reduceYieldGeneratorExpression(node, {expression}) {
    return seq(t("yield"), t("*"), this.space(), p(node.expression, getPrecedence(node), expression));
  }

  reduceDirective(node) {
    let delim = /^(?:[^"\\]|\\.)*$/.test(node.rawValue) ? "\"" : "'";
    return seq(t(delim + node.rawValue + delim), this.semiOp());
  }

  reduceVariableDeclaration(node, {declarators}) {
    return seq(t(node.kind), this.space(), this.commaSep(declarators));
  }

  reduceVariableDeclarationStatement(node, {declaration}) {
    return seq(declaration, this.semiOp());
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
    return objectAssign(init == null ? binding : seq(binding, this.space(), t("="), this.space(), init), {containsIn});
  }

  reduceWhileStatement(node, {test, body}) {
    return objectAssign(seq(t("while"), this.space(), paren(test), this.space(), body), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceWithStatement(node, {object, body}) {
    return objectAssign(
      seq(t("with"), paren(object), this.space(), body),
      {endsWithMissingElse: body.endsWithMissingElse});
  }
}

const INDENT = "  ";
class FormattedLinebreak extends Linebreak {
  constructor() {
    super();
    this.indentation = 0;
  }

  emit(ts) {
    ts.put("\n");
    for (let i = 0; i < this.indentation; ++i) {
      ts.put(INDENT);
    }
  }
}

export class FormattedCodeGen extends CodeGen {
  brace(rep, initialLinebreak = true) {
    if (isEmpty(rep)) {
      return t("{}");
    }
    if (!initialLinebreak) {
      return new Brace(rep);
    }

    rep = seq(this.linebreak(), rep);
    let finalLinebreak;
    function indent(node) {
      if (node instanceof FormattedLinebreak) {
        finalLinebreak = node;
        ++node.indentation;
      }
    }
    rep.forEach(indent);
    --finalLinebreak.indentation;
    return new Brace(rep);
  }

  commaSep(pieces) {
    let first = true;
    pieces = pieces.map(p => {
      if (first) {
        first = false;
        return p;
      } else {
        return seq(this.space(), p);
      }
    });
    return new CommaSep(pieces);
  }

  semiOp() {
    return seq(new SemiOp, this.linebreak());
  }

  space() {
    return t(" ");
  }

  linebreak() {
    return new FormattedLinebreak;
  }
}
