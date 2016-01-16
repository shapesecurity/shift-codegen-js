import objectAssign from "object-assign";
import {keyword} from "esutils";
import {Precedence, getPrecedence, escapeStringLiteral, CodeRep, Empty, Token, NumberCodeRep, Paren, Bracket, Brace, NoIn, ContainsIn, Seq, Semi, CommaSep, SemiOp} from "./coderep";

function p(node, precedence, a) {
  return getPrecedence(node) < precedence ? paren(a) : a;
}

function t(token) {
  return new Token(token);
}

function paren(rep) {
  return new Paren(rep);
}

function brace(rep) {
  return new Brace(rep);
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

function semiOp() {
  return new SemiOp;
}

function empty() {
  return new Empty;
}

function commaSep(pieces) {
  return new CommaSep(pieces);
}

function getAssignmentExpr(state) {
  return state ? (state.containsGroup ? paren(state) : state) : empty();
}

export default class MinimalCodeGen {
  parenToAvoidBeingDirective(element, original) {
    if (element && element.type === "ExpressionStatement" && element.expression.type === "LiteralStringExpression") {
      return seq(paren(original.children[0]), semiOp());
    }
    return original;
  }

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
    let startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = paren(rightCode);
      containsIn = false;
    }
    return objectAssign(seq(leftCode, t("="), rightCode), {containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass});
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
    return objectAssign(seq(leftCode, t(node.operator), rightCode), {containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass});
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
      seq(leftCode, t(node.operator), rightCode),
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
    return seq(binding, t("="), init);
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
      {
        startsWithCurly: callee.startsWithCurly,
        startsWithLetSquareBracket: callee.startsWithLetSquareBracket,
        startsWithFunctionOrClass: callee.startsWithFunctionOrClass,
      }
    );
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
        p(node.test, Precedence.LogicalOR, test), t("?"),
        p(node.consequent, Precedence.Assignment, consequent), t(":"),
        p(node.alternate, Precedence.Assignment, alternate)), {
          containsIn,
          startsWithCurly,
          startsWithLetSquareBracket,
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
    let needsParens =
      expression.startsWithCurly ||
      expression.startsWithLetSquareBracket ||
      expression.startsWithFunctionOrClass;
    return seq((needsParens ? paren(expression) : expression), semiOp());
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
      seq(t("for"), paren(seq(left.startsWithLet ? paren(left) : left, t("of"), right)), body),
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
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
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
    return seq(params, t("=>"), p(node.body, Precedence.Assignment, body));
  }

  reduceGetter(node, {name, body}) {
    return seq(t("get"), name, paren(empty()), brace(body));
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
      return seq(t("import"), t(escapeStringLiteral(node.moduleSpecifier)), semiOp());
    }
    return seq(t("import"), commaSep(bindings), t("from"), t(escapeStringLiteral(node.moduleSpecifier)), semiOp());
  }

  reduceImportNamespace(node, {defaultBinding, namespaceBinding}) {
    return seq(
      t("import"),
      defaultBinding == null ? empty() : seq(defaultBinding, t(",")),
      t("*"),
      t("as"),
      namespaceBinding,
      t("from"),
      t(escapeStringLiteral(node.moduleSpecifier)),
      semiOp()
    );
  }

  reduceImportSpecifier(node, {binding}) {
    if (node.name == null) return binding;
    return seq(t(node.name), t("as"), binding);
  }

  reduceExportAllFrom(node) {
    return seq(t("export"), t("*"), t("from"), t(escapeStringLiteral(node.moduleSpecifier)), semiOp());
  }

  reduceExportFrom(node, {namedExports}) {
    return seq(t("export"), brace(commaSep(namedExports)), node.moduleSpecifier == null ? empty() : seq(t("from"), t(escapeStringLiteral(node.moduleSpecifier)), semiOp()));
  }

  reduceExport(node, {declaration}) {
    switch (node.declaration.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        break;
      default:
        declaration = seq(declaration, semiOp());
    }
    return seq(t("export"), declaration);
  }

  reduceExportDefault(node, {body}) {
    body = body.startsWithFunctionOrClass ? paren(body) : body;
    switch (node.body.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        break;
      default:
        body = seq(body, semiOp());
    }
    return seq(t("export default"), body);
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

  reduceModule(node, {directives, items}) {
    if (items.length) {
      items[0] = this.parenToAvoidBeingDirective(node.items[0], items[0]);
    }
    return seq(...directives, ...items);
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
    return seq(t("return"), expression || empty(), semiOp());
  }

  reduceScript(node, {directives, statements}) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, ...statements);
  }

  reduceSetter(node, {name, param, body}) {
    return seq(t("set"), name, paren(param), brace(body));
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
    return objectAssign(init == null ? binding : seq(binding, t("="), init), {containsIn});
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