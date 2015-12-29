import * as objectAssign from "object-assign";
import {keyword} from "esutils";
import {Precedence, getPrecedence, escapeStringLiteral, CodeRep, Empty, Token, NumberCodeRep, Paren, Bracket, Brace, NoIn, ContainsIn, Seq, Semi, CommaSep, SemiOp} from "./coderep";

function empty() {
  return new Empty();
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

function isEmpty(codeRep) {
  return codeRep instanceof Empty || codeRep instanceof Linebreak || (codeRep instanceof Seq && codeRep.children.every(isEmpty));
}

let Sep = {};
const separatorNames = [
  "ARRAY_EMPTY",
  "ARRAY_BEFORE_COMMA",
  "ARRAY_AFTER_COMMA",
  "SPREAD",
  "BEFORE_DEFAULT_EQUALS",
  "AFTER_DEFAULT_EQUALS",
  "REST",
  "OBJECT_BEFORE_COMMA",
  "OBJECT_AFTER_COMMA",
  "BEFORE_PROP",
  "AFTER_PROP",
  "BEFORE_JUMP_LABEL",
  "ARGS_BEFORE_COMMA",
  "ARGS_AFTER_COMMA",
  "CALL",
  "BEFORE_CATCH_BINDING",
  "AFTER_CATCH_BINDING",
  "BEFORE_CLASS_NAME",
  "BEFORE_EXTENDS",
  "AFTER_EXTENDS",
  "BEFORE_CLASS_DECLARATION_ELEMENTS",
  "BEFORE_CLASS_EXPRESSION_ELEMENTS",
  "AFTER_STATIC",
  "BEFORE_CLASS_ELEMENT",
  "AFTER_CLASS_ELEMENT",
  "BEFORE_TERNARY_QUESTION",
  "AFTER_TERNARY_QUESTION",
  "BEFORE_TERNARY_COLON",
  "AFTER_TERNARY_COLON",
  "COMPUTED_MEMBER_EXPRESSION",
  "AFTER_DO",
  "BEFORE_DOWHILE_WHILE",
  "AFTER_DOWHILE_WHILE",
  "AFTER_FORIN_FOR",
  "BEFORE_FORIN_IN",
  "AFTER_FORIN_FOR",
  "BEFORE_FORIN_BODY",
  "AFTER_FOROF_FOR",
  "BEFORE_FOROF_OF",
  "AFTER_FOROF_FOR",
  "BEFORE_FOROF_BODY",
  "AFTER_FOR_FOR",
  "BEFORE_FOR_INIT",
  "AFTER_FOR_INIT",
  "EMPTY_FOR_INIT",
  "BEFORE_FOR_TEST",
  "AFTER_FOR_TEST",
  "EMPTY_FOR_TEST",
  "BEFORE_FOR_UPDATE",
  "AFTER_FOR_UPDATE",
  "EMPTY_FOR_UPDATE",
  "BEFORE_FOR_BODY",
  "BEFORE_GENERATOR_STAR",
  "AFTER_GENERATOR_STAR",
  "BEFORE_FUNCTION_PARAMS",
  "BEFORE_FUNCTION_DECLARATION_BODY",
  "BEFORE_FUNCTION_EXPRESSION_BODY",
  "AFTER_FUNCTION_DIRECTIVES",
  "BEFORE_ARROW",
  "AFTER_ARROW",
  "AFTER_GET",
  "BEFORE_GET_PARAMS",
  "BEFORE_GET_BODY",
  "AFTER_IF",
  "AFTER_IF_TEST",
  "BEFORE_ELSE",
  "AFTER_ELSE",
  "PARAMETER_BEFORE_COMMA",
  "PARAMETER_AFTER_COMMA",
  "NAMED_IMPORT_BEFORE_COMMA",
  "NAMED_IMPORT_AFTER_COMMA",
  "IMPORT_BEFORE_COMMA",
  "IMPORT_AFTER_COMMA",
  "BEFORE_IMPORT_BINDINGS",
  "BEFORE_IMPORT_MODULE",
  "AFTER_IMPORT_BINDINGS",
  "AFTER_FROM",
  "BEFORE_IMPORT_NAMESPACE",
  "BEFORE_IMPORT_STAR",
  "AFTER_IMPORT_STAR",
  "AFTER_IMPORT_AS",
  "AFTER_NAMESPACE_BINDING",
  "BEFORE_IMPORT_AS",
  "AFTER_IMPORT_AS",
  "EXPORTS_BEFORE_COMMA",
  "EXPORTS_AFTER_COMMA",
  "BEFORE_EXPORT_STAR",
  "AFTER_EXPORT_STAR",
  "BEFORE_EXPORT_BINDINGS",
  "AFTER_EXPORT_BINDINGS",
  "AFTER_EXPORT",
  "EXPORT_DEFAULT",
  "AFTER_EXPORT_DEFAULT",
  "BEFORE_EXPORT_AS",
  "AFTER_EXPORT_AS",
  "BEFORE_LABEL_COLON",
  "AFTER_LABEL_COLON",
  "AFTER_METHOD_GENERATOR_STAR",
  "AFTER_METHOD_NAME",
  "BEFORE_METHOD_BODY",
  "AFTER_MODULE_DIRECTIVES",
  "AFTER_NEW",
  "BEFORE_NEW_ARGS",
  "EMPTY_NEW_CALL",
  "NEW_TARGET_BEFORE_DOT",
  "NEW_TARGET_AFTER_DOT",
  "RETURN",
  "AFTER_SET",
  "BEFORE_SET_PARAMS",
  "BEFORE_SET_BODY",
  "AFTER_SCRIPT_DIRECTIVES",
  "BEFORE_STATIC_MEMBER_DOT",
  "AFTER_STATIC_MEMBER_DOT",
  "BEFORE_CASE_TEST",
  "AFTER_CASE_TEST",
  "BEFORE_CASE_BODY",
  "AFTER_CASE_BODY",
  "DEFAULT",
  "AFTER_DEFAULT_BODY",
  "BEFORE_SWITCH_DISCRIM",
  "BEFORE_SWITCH_BODY",
  "TEMPLATE_TAG",
  "BEFORE_TEMPLATE_EXPRESSION",
  "AFTER_TEMPLATE_EXPRESSION",
  "THROW",
  "AFTER_TRY",
  "BEFORE_CATCH",
  "BEFORE_FINALLY",
  "AFTER_FINALLY",
  "VARIABLE_DECLARATION",
  "YIELD",
  "BEFORE_YIELD_STAR",
  "AFTER_YIELD_STAR",
  "DECLARATORS_BEFORE_COMMA",
  "DECLARATORS_AFTER_COMMA",
  "BEFORE_INIT_EQUALS",
  "AFTER_INIT_EQUALS",
  "AFTER_WHILE",
  "BEFORE_WHILE_BODY",
  "AFTER_WITH",
  "BEFORE_WITH_BODY",
  "PAREN_AVOIDING_DIRECTIVE_BEFORE",
  "PAREN_AVOIDING_DIRECTIVE_AFTER",
  "PRECEDENCE_BEFORE",
  "PRECEDENCE_AFTER",
  "EXPRESSION_PAREN_BEFORE",
  "EXPRESSION_PAREN_AFTER",
  "CALL_PAREN_BEFORE",
  "CALL_PAREN_AFTER",
  "CALL_PAREN_EMPTY",
  "CATCH_PAREN_BEFORE",
  "CATCH_PAREN_AFTER",
  "DO_WHILE_TEST_PAREN_BEFORE",
  "DO_WHILE_TEST_PAREN_AFTER",
  "EXPRESSION_STATEMENT_PAREN_BEFORE",
  "EXPRESSION_STATEMENT_PAREN_AFTER",
  "FOR_IN_LET_PAREN_BEFORE",
  "FOR_IN_LET_PAREN_AFTER",
  "FOR_IN_PAREN_BEFORE",
  "FOR_IN_PAREN_AFTER",
  "FOR_OF_LET_PAREN_BEFORE",
  "FOR_OF_LET_PAREN_AFTER",
  "FOR_OF_PAREN_BEFORE",
  "FOR_OF_PAREN_AFTER",
  "FOR_PAREN_BEFORE",
  "FOR_PAREN_AFTER",
  "PARAMETERS_PAREN_BEFORE",
  "PARAMETERS_PAREN_AFTER",
  "PARAMETERS_PAREN_EMPTY",
  "ARROW_PARAMETERS_PAREN_BEFORE",
  "ARROW_PARAMETERS_PAREN_AFTER",
  "ARROW_PARAMETERS_PAREN_EMPTY",
  "ARROW_BODY_PAREN_BEFORE",
  "ARROW_BODY_PAREN_AFTER",
  "GETTER_PARAMS",
  "IF_PAREN_BEFORE",
  "IF_PAREN_AFTER",
  "EXPORT_PAREN_BEFORE",
  "EXPORT_PAREN_AFTER",
  "NEW_CALLEE_PAREN_BEFORE",
  "NEW_CALLEE_PAREN_AFTER",
  "NEW_PAREN_BEFORE",
  "NEW_PAREN_AFTER",
  "NEW_PAREN_EMPTY",
  "SETTER_PARAM_BEFORE",
  "SETTER_PARAM_AFTER",
  "SWITCH_DISCRIM_PAREN_BEFORE",
  "SWITCH_DISCRIM_PAREN_AFTER",
  "WHILE_TEST_PAREN_BEFORE",
  "WHILE_TEST_PAREN_AFTER",
  "WITH_PAREN_BEFORE",
  "WITH_PAREN_AFTER",
];
for (let i = 0; i < separatorNames.length; ++i) {
  Sep[separatorNames[i]] = {type: separatorNames[i]};
}

Sep.BEFORE_ASSIGN_OP = function(op) {
  return {
    type: "BEFORE_ASSIGN_OP",
    op: op
  };
};

Sep.AFTER_ASSIGN_OP = function(op) {
  return {
    type: "AFTER_ASSIGN_OP",
    op: op
  };
};

Sep.BEFORE_BINOP = function(op) {
  return {
    type: "BEFORE_BINOP",
    op: op
  };
};

Sep.AFTER_BINOP = function(op) {
  return {
    type: "AFTER_BINOP",
    op: op
  };
};

Sep.BEFORE_POSTFIX = function(op) {
  return {
    type: "BEFORE_POSTFIX",
    op: op
  };
};

Sep.UNARY = function(op) {
  return {
    type: "UNARY",
    op: op
  };
};

Sep.AFTER_STATEMENT = function(node) {
  return {
    type: "AFTER_STATEMENT",
    node: node
  };
};

Sep.BEFORE_FUNCTION_NAME = function(node) {
  return {
    type: "BEFORE_FUNCTION_NAME",
    node: node
  };
};
export {Sep};

export class ExtensibleCodeGen {
  parenToAvoidBeingDirective(element, original) {
    if (element && element.type === "ExpressionStatement" && element.expression.type === "LiteralStringExpression") {
      return seq(this.paren(original.children[0], Sep.PAREN_AVOIDING_DIRECTIVE_BEFORE, Sep.PAREN_AVOIDING_DIRECTIVE_AFTER), this.semiOp());
    }
    return original;
  }

  t(token) {
    return new Token(token);
  }

  p(node, precedence, a) {
    return getPrecedence(node) < precedence ? this.paren(a, Sep.PRECEDENCE_BEFORE, Sep.PRECEDENCE_AFTER) : a;
  }

  getAssignmentExpr(state) {
    return state ? (state.containsGroup ? this.paren(state, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER) : state) : empty();
  }

  paren(rep, first, last, empty) {
    if (isEmpty(rep)) {
      return new Paren(this.sep(empty));
    }
    return new Paren(seq(this.sep(first), rep, this.sep(last)));
  }

  brace(rep) {
    return new Brace(rep);
  }

  bracket(rep) {
    return new Bracket(rep);
  }

  commaSep(pieces, before, after) {
    let first = true;
    pieces = pieces.map(p => {
      if (first) {
        first = false;
        return p;
      } else {
        return seq(this.sep(before), this.t(","), this.sep(after), p);
      }
    });
    return seq(...pieces);
  }

  semiOp() {
    return new SemiOp;
  }

  sep(kind) {
    return new Empty();
  }

  reduceArrayExpression(node, {elements}) {
    if (elements.length === 0) {
      return this.bracket(this.sep(Sep.ARRAY_EMPTY));
    }

    let content = this.commaSep(elements.map(e=>this.getAssignmentExpr(e)), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
    if (elements.length > 0 && elements[elements.length - 1] == null) {
      content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(","), this.sep(Sep.ARRAY_AFTER_COMMA));
    }
    return this.bracket(content);
  }

  reduceSpreadElement(node, {expression}) {
    return seq(this.t("..."), this.sep(Sep.SPREAD), this.p(node.expression, Precedence.Assignment, expression));
  }

  reduceAssignmentExpression(node, {binding, expression}) {
    let leftCode = binding;
    let rightCode = expression;
    let containsIn = expression.containsIn;
    let startsWithCurly = binding.startsWithCurly;
    let startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      containsIn = false;
    }
    return objectAssign(seq(leftCode, this.sep(Sep.BEFORE_ASSIGN_OP("=")), this.t("="), this.sep(Sep.AFTER_ASSIGN_OP("=")), rightCode), {containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass});
  }

  reduceCompoundAssignmentExpression(node, {binding, expression}) {
    let leftCode = binding;
    let rightCode = expression;
    let containsIn = expression.containsIn;
    let startsWithCurly = binding.startsWithCurly;
    let startsWithLetSquareBracket = binding.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = binding.startsWithFunctionOrClass;
    if (getPrecedence(node.expression) < getPrecedence(node)) {
      rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      containsIn = false;
    }
    return objectAssign(seq(leftCode, this.sep(Sep.BEFORE_ASSIGN_OP(node.operator)), this.t(node.operator), this.sep(Sep.AFTER_ASSIGN_OP(node.operator)), rightCode), {containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass});
  }

  reduceBinaryExpression(node, {left, right}) {
    let leftCode = left;
    let startsWithCurly = left.startsWithCurly;
    let startsWithLetSquareBracket = left.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = left.startsWithFunctionOrClass;
    let leftContainsIn = left.containsIn;
    if (getPrecedence(node.left) < getPrecedence(node)) {
      leftCode = this.paren(leftCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      startsWithCurly = false;
      startsWithLetSquareBracket = false;
      startsWithFunctionOrClass = false;
      leftContainsIn = false;
    }
    let rightCode = right;
    let rightContainsIn = right.containsIn;
    if (getPrecedence(node.right) <= getPrecedence(node)) {
      rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      rightContainsIn = false;
    }
    return objectAssign(
      seq(leftCode, this.sep(Sep.BEFORE_BINOP(node.operator)), this.t(node.operator), this.sep(Sep.AFTER_BINOP(node.operator)), rightCode),
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
    return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t("="), this.sep(Sep.AFTER_DEFAULT_EQUALS), init);
  }

  reduceBindingIdentifier(node) {
    let a = this.t(node.name);
    if (node.name === "let") {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceArrayBinding(node, {elements, restElement}) {
    let content;
    if (elements.length === 0) {
      content = restElement == null ? empty() : seq(this.t("..."), this.sep(Sep.REST), restElement);
    } else {
      elements = elements.concat(restElement == null ? [] : [seq(this.t("..."), this.sep(Sep.REST), restElement)]);
      content = this.commaSep(elements.map(e=>this.getAssignmentExpr(e)), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(","), this.sep(Sep.ARRAY_AFTER_COMMA));
      }
    }
    return this.bracket(content);
  }

  reduceObjectBinding(node, {properties}) {
    let state = this.brace(this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA), node);
    state.startsWithCurly = true;
    return state;
  }

  reduceBindingPropertyIdentifier(node, {binding, init}) {
    if (node.init == null) return binding;
    return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t("="), this.sep(Sep.AFTER_DEFAULT_EQUALS), init);
  }

  reduceBindingPropertyProperty(node, {name, binding}) {
    return seq(name, this.sep(Sep.BEFORE_PROP), this.t(":"), this.sep(Sep.AFTER_PROP), binding);
  }

  reduceBlock(node, {statements}) {
    return this.brace(seq(...statements), node);
  }

  reduceBlockStatement(node, {block}) {
    return seq(block, this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceBreakStatement(node, {label}) {
    return seq(this.t("break"), label ? seq(this.sep(Sep.BEFORE_JUMP_LABEL), this.t(label)) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceCallExpression(node, {callee, arguments: args}) {
    return objectAssign(
      seq(this.p(node.callee, getPrecedence(node), callee), this.sep(Sep.CALL), this.paren(this.commaSep(args, Sep.ARGS_BEFORE_COMMA, Sep.ARGS_AFTER_COMMA), Sep.CALL_PAREN_BEFORE, Sep.CALL_PAREN_AFTER, Sep.CALL_PAREN_EMPTY)),
      {
        startsWithCurly: callee.startsWithCurly,
        startsWithLetSquareBracket: callee.startsWithLetSquareBracket,
        startsWithFunctionOrClass: callee.startsWithFunctionOrClass,
      }
    );
  }

  reduceCatchClause(node, {binding, body}) {
    return seq(this.t("catch"), this.sep(Sep.BEFORE_CATCH_BINDING), this.paren(binding, Sep.CATCH_PAREN_BEFORE, Sep.CATCH_PAREN_AFTER), this.sep(Sep.AFTER_CATCH_BINDING), body);
  }

  reduceClassDeclaration(node, {name, super: _super, elements}) {
    let state = seq(this.t("class"), this.sep(Sep.BEFORE_CLASS_NAME), name);
    if (_super != null) {
      state = seq(state, this.sep(Sep.BEFORE_EXTENDS), this.t("extends"), this.sep(Sep.AFTER_EXTENDS), _super);
    }
    state = seq(state, this.sep(Sep.BEFORE_CLASS_DECLARATION_ELEMENTS), this.brace(seq(...elements), node), this.sep(Sep.AFTER_STATEMENT(node)));
    return state;
  }

  reduceClassExpression(node, {name, super: _super, elements}) {
    let state = this.t("class");
    if (name != null) {
      state = seq(state, this.sep(Sep.BEFORE_CLASS_NAME), name);
    }
    if (_super != null) {
      state = seq(state, this.sep(Sep.BEFORE_EXTENDS), this.t("extends"), this.sep(Sep.AFTER_EXTENDS), _super);
    }
    state = seq(state, this.sep(Sep.BEFORE_CLASS_EXPRESSION_ELEMENTS), this.brace(seq(...elements), node));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceClassElement(node, {method}) {
    method = seq(this.sep(Sep.BEFORE_CLASS_ELEMENT), method, this.sep(Sep.AFTER_CLASS_ELEMENT));
    if (!node.isStatic) return method;
    return seq(this.t("static"), this.sep(Sep.AFTER_STATIC), method);
  }

  reduceComputedMemberExpression(node, {object, expression}) {
    let startsWithLetSquareBracket =
      object.startsWithLetSquareBracket ||
      node.object.type === "IdentifierExpression" && node.object.name === "let";
    return objectAssign(
      seq(this.p(node.object, getPrecedence(node), object), this.sep(Sep.COMPUTED_MEMBER_EXPRESSION), this.bracket(expression)),
      {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass,
      }
    );
  }

  reduceComputedPropertyName(node, {expression}) {
    return this.bracket(expression);
  }

  reduceConditionalExpression(node, {test, consequent, alternate}) {
    let containsIn = test.containsIn || alternate.containsIn;
    let startsWithCurly = test.startsWithCurly;
    let startsWithLetSquareBracket = test.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = test.startsWithFunctionOrClass;
    return objectAssign(
      seq(
        this.p(node.test, Precedence.LogicalOR, test), this.sep(Sep.BEFORE_TERNARY_QUESTION), this.t("?"), this.sep(Sep.AFTER_TERNARY_QUESTION),
        this.p(node.consequent, Precedence.Assignment, consequent), this.sep(Sep.BEFORE_TERNARY_COLON), this.t(":"), this.sep(Sep.AFTER_TERNARY_COLON),
        this.p(node.alternate, Precedence.Assignment, alternate)), {
          containsIn,
          startsWithCurly,
          startsWithLetSquareBracket,
          startsWithFunctionOrClass
        });
  }

  reduceContinueStatement(node, {label}) {
    return seq(this.t("continue"), label ? seq(this.sep(Sep.BEFORE_JUMP_LABEL), this.t(label)) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceDataProperty(node, {name, expression}) {
    return seq(name, this.sep(Sep.BEFORE_PROP), this.t(":"), this.sep(Sep.AFTER_PROP), this.getAssignmentExpr(expression));
  }

  reduceDebuggerStatement(node) {
    return seq(this.t("debugger"), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceDoWhileStatement(node, {body, test}) {
    return seq(this.t("do"), this.sep(Sep.AFTER_DO), body, this.sep(Sep.BEFORE_DOWHILE_WHILE), this.t("while"), this.sep(Sep.AFTER_DOWHILE_WHILE), this.paren(test, Sep.DO_WHILE_TEST_PAREN_BEFORE, Sep.DO_WHILE_TEST_PAREN_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceEmptyStatement(node) {
    return seq(this.t(";"), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceExpressionStatement(node, {expression}) {
    let needsParens =
      expression.startsWithCurly ||
      expression.startsWithLetSquareBracket ||
      expression.startsWithFunctionOrClass;
    return seq((needsParens ? this.paren(expression, Sep.EXPRESSION_STATEMENT_PAREN_BEFORE, Sep.EXPRESSION_STATEMENT_PAREN_AFTER) : expression), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceForInStatement(node, {left, right, body}) {
    let leftP = left;
    switch (node.left.type) {
      case "VariableDeclaration":
        leftP = noIn(markContainsIn(left));
        break;
      case "BindingIdentifier":
        if (node.left.name === "let") {
          leftP = this.paren(left, Sep.FOR_IN_LET_PAREN_BEFORE, Sep.FOR_IN_LET_PAREN_BEFORE);
        }
        break;
    }
    return objectAssign(
      seq(this.t("for"), this.sep(Sep.AFTER_FORIN_FOR), this.paren(seq(leftP, this.sep(Sep.BEFORE_FORIN_IN), this.t("in"), this.sep(Sep.AFTER_FORIN_FOR), right), Sep.FOR_IN_PAREN_BEFORE, Sep.FOR_IN_PAREN_AFTER), this.sep(Sep.BEFORE_FORIN_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForOfStatement(node, {left, right, body}) {
    left = node.left.type === "VariableDeclaration" ? noIn(markContainsIn(left)) : left;
    return objectAssign(
      seq(this.t("for"), this.sep(Sep.AFTER_FOROF_FOR), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_OF_LET_PAREN_BEFORE, Sep.FOR_OF_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FOROF_OF), this.t("of"), this.sep(Sep.AFTER_FOROF_FOR), right), Sep.FOR_OF_PAREN_BEFORE, Sep.FOR_OF_PAREN_AFTER), this.sep(Sep.BEFORE_FOROF_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceForStatement(node, {init, test, update, body}) {
    return objectAssign(
      seq(
        this.t("for"), this.sep(Sep.AFTER_FOR_FOR),
        this.paren(seq(this.sep(Sep.BEFORE_FOR_INIT), seq(init ? seq(this.sep(Sep.BEFORE_FOR_INIT), noIn(markContainsIn(init)), this.sep(Sep.AFTER_FOR_INIT)) : this.sep(Sep.EMPTY_FOR_INIT), this.t(";"), test ? seq(this.sep(Sep.BEFORE_FOR_TEST), test, this.sep(Sep.AFTER_FOR_TEST)) : this.sep(Sep.EMPTY_FOR_TEST), this.t(";"), update ? seq(this.sep(Sep.BEFORE_FOR_UPDATE), update, this.sep(Sep.AFTER_FOR_UPDATE)) : this.sep(Sep.EMPTY_FOR_UPDATE))), Sep.FOR_PAREN_BEFORE, Sep.FOR_PAREN_AFTER),
        this.sep(Sep.BEFORE_FOR_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
        {
          endsWithMissingElse: body.endsWithMissingElse
        });
  }

  reduceFunctionBody(node, {directives, statements}) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, directives.length ? this.sep(Sep.AFTER_FUNCTION_DIRECTIVES) : empty(), ...statements);
  }

  reduceFunctionDeclaration(node, {name, params, body}) {
    return seq(this.t("function"), node.isGenerator ? seq(this.sep(Sep.BEFORE_GENERATOR_STAR), this.t("*"), this.sep(Sep.AFTER_GENERATOR_STAR)) : empty(), this.sep(Sep.BEFORE_FUNCTION_NAME(node)), node.name.name === "*default*" ? empty() : name, this.sep(Sep.BEFORE_FUNCTION_PARAMS), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_FUNCTION_DECLARATION_BODY), this.brace(body, node), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceFunctionExpression(node, {name, params, body}) {
    let state = seq(this.t("function"), node.isGenerator ? seq(this.sep(Sep.BEFORE_GENERATOR_STAR), this.t("*"), this.sep(Sep.AFTER_GENERATOR_STAR)) : empty(), this.sep(Sep.BEFORE_FUNCTION_NAME(node)), name ? name : empty(), this.sep(Sep.BEFORE_FUNCTION_PARAMS), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_FUNCTION_EXPRESSION_BODY), this.brace(body, node));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceFormalParameters(node, {items, rest}) {
    return this.commaSep(items.concat(rest == null ? [] : [seq(this.t("..."), this.sep(Sep.REST), rest)]), Sep.PARAMETER_BEFORE_COMMA, Sep.PARAMETER_AFTER_COMMA);
  }

  reduceArrowExpression(node, {params, body}) {
    if (node.params.rest != null || node.params.items.length !== 1 || node.params.items[0].type !== "BindingIdentifier") {
      params = this.paren(params, Sep.ARROW_PARAMETERS_PAREN_BEFORE, Sep.ARROW_PARAMETERS_PAREN_AFTER, Sep.ARROW_PARAMETERS_PAREN_EMPTY);
    }
    if (node.body.type === "FunctionBody") {
      body = this.brace(body, node);
    } else if (body.startsWithCurly) {
      body = this.paren(body, Sep.ARROW_BODY_PAREN_BEFORE, Sep.ARROW_BODY_PAREN_AFTER);
    }
    return seq(params, this.sep(Sep.BEFORE_ARROW), this.t("=>"), this.sep(Sep.AFTER_ARROW), this.p(node.body, Precedence.Assignment, body));
  }

  reduceGetter(node, {name, body}) {
    return seq(this.t("get"), this.sep(Sep.AFTER_GET), name, this.sep(Sep.BEFORE_GET_PARAMS), this.paren(empty(), null, null, Sep.GETTER_PARAMS), this.sep(Sep.BEFORE_GET_BODY), this.brace(body, node));
  }

  reduceIdentifierExpression(node) {
    let a = this.t(node.name);
    if (node.name === "let") {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceIfStatement(node, {test, consequent, alternate}) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = this.brace(consequent, node);
    }
    return objectAssign(
      seq(this.t("if"), this.sep(Sep.AFTER_IF),
        this.paren(test, Sep.IF_PAREN_BEFORE, Sep.IF_PAREN_AFTER), this.sep(Sep.AFTER_IF_TEST),
        consequent,
        alternate ? seq(this.sep(Sep.BEFORE_ELSE), this.t("else"), this.sep(Sep.AFTER_ELSE), alternate) : empty(), this.sep(Sep.AFTER_STATEMENT(node))),
      {endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true});
  }

  reduceImport(node, {defaultBinding, namedImports}) {
    let bindings = [];
    if (defaultBinding != null) {
      bindings.push(defaultBinding);
    }
    if (namedImports.length > 0) {
      bindings.push(this.brace(this.commaSep(namedImports, Sep.NAMED_IMPORT_BEFORE_COMMA, Sep.NAMED_IMPORT_AFTER_COMMA), node));
    }
    if (bindings.length === 0) {
      return seq(this.t("import"), this.sep(Sep.BEFORE_IMPORT_MODULE), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
    return seq(this.t("import"), this.sep(Sep.BEFORE_IMPORT_BINDINGS), this.commaSep(bindings, Sep.IMPORT_BEFORE_COMMA, Sep.IMPORT_AFTER_COMMA), this.sep(Sep.AFTER_IMPORT_BINDINGS), this.t("from"), this.sep(Sep.AFTER_FROM), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceImportNamespace(node, {defaultBinding, namespaceBinding}) {
    return seq(
      this.t("import"), this.sep(Sep.BEFORE_IMPORT_NAMESPACE),
      defaultBinding == null ? empty() : seq(defaultBinding, this.sep(Sep.IMPORT_BEFORE_COMMA), this.t(","), this.sep(Sep.IMPORT_AFTER_COMMA)),
      this.sep(Sep.BEFORE_IMPORT_STAR), this.t("*"), this.sep(Sep.AFTER_IMPORT_STAR),
      this.t("as"), this.sep(Sep.AFTER_IMPORT_AS),
      namespaceBinding, this.sep(Sep.AFTER_NAMESPACE_BINDING),
      this.t("from"), this.sep(Sep.AFTER_FROM),
      this.t(escapeStringLiteral(node.moduleSpecifier)),
      this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node))
    );
  }

  reduceImportSpecifier(node, {binding}) {
    if (node.name == null) return binding;
    return seq(this.t(node.name), this.sep(Sep.BEFORE_IMPORT_AS), this.t("as"), this.sep(Sep.AFTER_IMPORT_AS), binding);
  }

  reduceExportAllFrom(node) {
    return seq(this.t("export"), this.sep(Sep.BEFORE_EXPORT_STAR), this.t("*"), this.sep(Sep.AFTER_EXPORT_STAR), this.t("from"), this.sep(Sep.AFTER_FROM), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceExportFrom(node, {namedExports}) {
    return seq(this.t("export"), this.sep(Sep.BEFORE_EXPORT_BINDINGS), this.brace(this.commaSep(namedExports, Sep.EXPORTS_BEFORE_COMMA, Sep.EXPORTS_AFTER_COMMA), node), node.moduleSpecifier == null ? empty() : seq(this.sep(Sep.AFTER_EXPORT_BINDINGS), this.t("from"), this.sep(Sep.AFTER_FROM), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node))));
  }

  reduceExport(node, {declaration}) {
    switch (node.declaration.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        break;
      default:
        declaration = seq(declaration, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
    return seq(this.t("export"), this.sep(Sep.AFTER_EXPORT), declaration);
  }

  reduceExportDefault(node, {body}) {
    body = body.startsWithFunctionOrClass ? this.paren(body, Sep.EXPORT_PAREN_BEFORE, Sep.EXPORT_PAREN_AFTER) : body;
    switch (node.body.type) {
      case "FunctionDeclaration":
      case "ClassDeclaration":
        break;
      default:
        body = seq(body, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
    return seq(this.t("export"), this.sep(Sep.EXPORT_DEFAULT), this.t("default"), this.sep(Sep.AFTER_EXPORT_DEFAULT), body);
  }

  reduceExportSpecifier(node) {
    if (node.name == null) return this.t(node.exportedName);
    return seq(this.t(node.name), this.sep(Sep.BEFORE_EXPORT_AS), this.t("as"), this.sep(Sep.AFTER_EXPORT_AS), this.t(node.exportedName));
  }

  reduceLabeledStatement(node, {label, body}) {
    return objectAssign(seq(this.t(label), this.sep(Sep.BEFORE_LABEL_COLON), this.t(":"), this.sep(Sep.AFTER_LABEL_COLON), body), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceLiteralBooleanExpression(node) {
    return this.t(node.value.toString());
  }

  reduceLiteralNullExpression(node) {
    return this.t("null");
  }

  reduceLiteralInfinityExpression(node) {
    return this.t("2e308");
  }

  reduceLiteralNumericExpression(node) {
    return new NumberCodeRep(node.value);
  }

  reduceLiteralRegExpExpression(node) {
    return this.t(`/${node.pattern}/${node.flags}`);
  }

  reduceLiteralStringExpression(node) {
    return this.t(escapeStringLiteral(node.value));
  }

  reduceMethod(node, {name, params, body}) {
    return seq(node.isGenerator ? seq(this.t("*"), this.sep(Sep.AFTER_METHOD_GENERATOR_STAR)) : empty(), name, this.sep(Sep.AFTER_METHOD_NAME), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_METHOD_BODY), this.brace(body, node));
  }

  reduceModule(node, {directives, items}) {
    if (items.length) {
      items[0] = this.parenToAvoidBeingDirective(node.items[0], items[0]);
    }
    return seq(...directives, directives.length ? this.sep(Sep.AFTER_MODULE_DIRECTIVES) : empty(), ...items);
  }

  reduceNewExpression(node, {callee, arguments: args}) {
    let calleeRep = getPrecedence(node.callee) == Precedence.Call ? this.paren(callee, Sep.NEW_CALLEE_PAREN_BEFORE, Sep.NEW_CALLEE_PAREN_AFTER) :
      this.p(node.callee, getPrecedence(node), callee);
    return seq(this.t("new"), this.sep(Sep.AFTER_NEW), calleeRep, this.sep(Sep.BEFORE_NEW_ARGS), args.length === 0 ? this.sep(Sep.EMPTY_NEW_CALL) : this.paren(this.commaSep(args, Sep.ARGS_BEFORE_COMMA, Sep.ARGS_AFTER_COMMA), Sep.NEW_PAREN_BEFORE, Sep.NEW_PAREN_AFTER, Sep.NEW_PAREN_EMPTY));
  }

  reduceNewTargetExpression() {
    return seq(this.t("new"), this.sep(Sep.NEW_TARGET_BEFORE_DOT), this.t("."), this.sep(Sep.NEW_TARGET_AFTER_DOT), this.t("target"));
  }

  reduceObjectExpression(node, {properties}) {
    let state = this.brace(this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA), node);
    state.startsWithCurly = true;
    return state;
  }

  reduceUpdateExpression(node, {operand}) {
    if (node.isPrefix) {
      return this.reduceUnaryExpression(...arguments);
    } else {
      return objectAssign(
        seq(this.p(node.operand, Precedence.New, operand), this.sep(Sep.BEFORE_POSTFIX(node.operator)), this.t(node.operator)),
        {
          startsWithCurly: operand.startsWithCurly,
          startsWithLetSquareBracket: operand.startsWithLetSquareBracket,
          startsWithFunctionOrClass: operand.startsWithFunctionOrClass
        }
      );
    }
  }

  reduceUnaryExpression(node, {operand}) {
    return seq(this.t(node.operator), this.sep(Sep.UNARY(node.operator)), this.p(node.operand, getPrecedence(node), operand));
  }

  reduceReturnStatement(node, {expression}) {
    return seq(this.t("return"), expression ? seq(this.sep(Sep.RETURN), expression) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceScript(node, {directives, statements}) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, directives.length ? this.sep(Sep.AFTER_SCRIPT_DIRECTIVES) : empty(), ...statements);
  }

  reduceSetter(node, {name, param, body}) {
    return seq(this.t("set"), this.sep(Sep.AFTER_SET), name, this.sep(Sep.BEFORE_SET_PARAMS), this.paren(param, Sep.SETTER_PARAM_BEFORE, Sep.SETTER_PARAM_AFTER), this.sep(Sep.BEFORE_SET_BODY), this.brace(body, node));
  }

  reduceShorthandProperty(node) {
    return this.t(node.name);
  }

  reduceStaticMemberExpression(node, {object, property}) {
    const state = seq(this.p(node.object, getPrecedence(node), object), this.sep(Sep.BEFORE_STATIC_MEMBER_DOT), this.t("."), this.sep(Sep.AFTER_STATIC_MEMBER_DOT), this.t(property));
    state.startsWithLet = object.startsWithLet;
    state.startsWithCurly = object.startsWithCurly;
    state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
    state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
    return state;
  }

  reduceStaticPropertyName(node) {
    var n;
    if (keyword.isIdentifierNameES6(node.value)) {
      return this.t(node.value);
    } else if (n = parseFloat(node.value), n === n) {
      return new NumberCodeRep(n);
    }
    return this.t(escapeStringLiteral(node.value));
  }

  reduceSuper() {
    return this.t("super");
  }

  reduceSwitchCase(node, {test, consequent}) {
    return seq(this.t("case"), this.sep(Sep.BEFORE_CASE_TEST), test, this.sep(Sep.AFTER_CASE_TEST), this.t(":"), this.sep(Sep.BEFORE_CASE_BODY), seq(...consequent), this.sep(Sep.AFTER_CASE_BODY));
  }

  reduceSwitchDefault(node, {consequent}) {
    return seq(this.t("default"), this.sep(Sep.DEFAULT), this.t(":"), this.sep(Sep.BEFORE_CASE_BODY), seq(...consequent), this.sep(Sep.AFTER_DEFAULT_BODY));
  }

  reduceSwitchStatement(node, {discriminant, cases}) {
    return seq(this.t("switch"), this.sep(Sep.BEFORE_SWITCH_DISCRIM), this.paren(discriminant, Sep.SWITCH_DISCRIM_PAREN_BEFORE, Sep.SWITCH_DISCRIM_PAREN_AFTER), this.sep(Sep.BEFORE_SWITCH_BODY), this.brace(seq(...cases), node), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceSwitchStatementWithDefault(node, {discriminant, preDefaultCases, defaultCase, postDefaultCases}) {
    return seq(
      this.t("switch"),
      this.sep(Sep.BEFORE_SWITCH_DISCRIM), this.paren(discriminant, Sep.SWITCH_DISCRIM_PAREN_BEFORE, Sep.SWITCH_DISCRIM_PAREN_AFTER), this.sep(Sep.BEFORE_SWITCH_BODY),
      this.brace(seq(...preDefaultCases, defaultCase, ...postDefaultCases), node), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceTemplateExpression(node, {tag, elements}) {
    let state = node.tag == null ? empty() : this.p(node.tag, getPrecedence(node), tag, this.sep(Sep.TEMPLATE_TAG));
    let templateData = "";
    state = seq(state, this.t("`"));
    for (let i = 0, l = node.elements.length; i < l; ++i) {
      if (node.elements[i].type === "TemplateElement") {
        let d = "";
        if (i > 0) d += "}";
        d += node.elements[i].rawValue;
        if (i < l - 1) d += "${"
        state = seq(state, this.t(d));
      } else {
        state = seq(state, this.sep(Sep.BEFORE_TEMPLATE_EXPRESSION), elements[i], this.sep(Sep.AFTER_TEMPLATE_EXPRESSION));
      }
    }
    state = seq(state, this.t("`"));
    if (node.tag != null) {
      state.startsWithCurly = tag.startsWithCurly;
      state.startsWithLetSquareBracket = tag.startsWithLetSquareBracket;
      state.startsWithFunctionOrClass = tag.startsWithFunctionOrClass;
    }
    return state;
  }

  reduceTemplateElement(node) {
    return this.t(node.rawValue);
  }

  reduceThisExpression(node) {
    return this.t("this");
  }

  reduceThrowStatement(node, {expression}) {
    return seq(this.t("throw"), this.sep(Sep.THROW), expression, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceTryCatchStatement(node, {body, catchClause}) {
    return seq(this.t("try"), this.sep(Sep.AFTER_TRY), body, this.sep(Sep.BEFORE_CATCH), catchClause, this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceTryFinallyStatement(node, {body, catchClause, finalizer}) {
    return seq(this.t("try"), this.sep(Sep.AFTER_TRY), body, catchClause ? seq(this.sep(Sep.BEFORE_CATCH), catchClause) : empty(), this.sep(Sep.BEFORE_FINALLY), this.t("finally"), this.sep(Sep.AFTER_FINALLY), finalizer, this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceYieldExpression(node, {expression}) {
    if (node.expression == null) return this.t("yield");
    return seq(this.t("yield"), this.sep(Sep.YIELD), this.p(node.expression, getPrecedence(node), expression));
  }

  reduceYieldGeneratorExpression(node, {expression}) {
    return seq(this.t("yield"), this.sep(Sep.BEFORE_YIELD_STAR), this.t("*"), this.sep(Sep.AFTER_YIELD_STAR), this.p(node.expression, getPrecedence(node), expression));
  }

  reduceDirective(node) {
    let delim = /^(?:[^"\\]|\\.)*$/.test(node.rawValue) ? "\"" : "'";
    return seq(this.t(delim + node.rawValue + delim), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceVariableDeclaration(node, {declarators}) {
    return seq(this.t(node.kind), this.sep(Sep.VARIABLE_DECLARATION), this.commaSep(declarators, Sep.DECLARATORS_BEFORE_COMMA, Sep.DECLARATORS_AFTER_COMMA));
  }

  reduceVariableDeclarationStatement(node, {declaration}) {
    return seq(declaration, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceVariableDeclarator(node, {binding, init}) {
    let containsIn = init && init.containsIn && !init.containsGroup;
    if (init) {
      if (init.containsGroup) {
        init = this.paren(init, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      } else {
        init = markContainsIn(init);
      }
    }
    return objectAssign(init == null ? binding : seq(binding, this.sep(Sep.BEFORE_INIT_EQUALS), this.t("="), this.sep(Sep.AFTER_INIT_EQUALS), init), {containsIn});
  }

  reduceWhileStatement(node, {test, body}) {
    return objectAssign(seq(this.t("while"), this.sep(Sep.AFTER_WHILE), this.paren(test, Sep.WHILE_TEST_PAREN_BEFORE, Sep.WHILE_TEST_PAREN_AFTER), this.sep(Sep.BEFORE_WHILE_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), {endsWithMissingElse: body.endsWithMissingElse});
  }

  reduceWithStatement(node, {object, body}) {
    return objectAssign(
      seq(this.t("with"), this.sep(Sep.AFTER_WITH), this.paren(object, Sep.WITH_PAREN_BEFORE, Sep.WITH_PAREN_AFTER), this.sep(Sep.BEFORE_WITH_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      {endsWithMissingElse: body.endsWithMissingElse});
  }
}



const INDENT = "  ";
class Linebreak extends CodeRep {
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

function withoutTrailingLinebreak(state) {
  if (state && state instanceof Seq) {
    let lastChild = state.children[state.children.length-1];
    /* istanbul ignore next */
    while (lastChild instanceof Empty) {
      state.children.pop();
      lastChild = state.children[state.children.length-1];
    }
    /* istanbul ignore else */
    if (lastChild instanceof Seq) {
      withoutTrailingLinebreak(lastChild);
    } else if (lastChild instanceof Linebreak) {
      state.children.pop();
    }
  }
  return state;
}

function indent(rep, includingFinal) {
  let finalLinebreak;
  function indentNode(node) {
    if (node instanceof Linebreak) {
      finalLinebreak = node;
      ++node.indentation;
    }
  }
  rep.forEach(indentNode);
  if (!includingFinal) {
    --finalLinebreak.indentation;
  }
  return rep;
}

export class FormattedCodeGen extends ExtensibleCodeGen {
  parenToAvoidBeingDirective(element, original) {
    if (element && element.type === "ExpressionStatement" && element.expression.type === "LiteralStringExpression") {
      return seq(this.paren(original.children[0], Sep.PAREN_AVOIDING_DIRECTIVE_BEFORE, Sep.PAREN_AVOIDING_DIRECTIVE_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(element)));
    }
    return original;
  }

  brace(rep, node) {
    if (isEmpty(rep)) {
      return this.t("{}");
    }

    switch (node.type) {
      case "ObjectBinding":
      case "Import":
      case "ExportFrom":
      case "ObjectExpression":
        return new Brace(rep);
    }

    rep = seq(new Linebreak, rep);
    indent(rep, false);
    return new Brace(rep);
  }

  reduceDoWhileStatement(node, {body, test}) {
    return seq(this.t("do"), this.sep(Sep.AFTER_DO), withoutTrailingLinebreak(body), this.sep(Sep.BEFORE_DOWHILE_WHILE), this.t("while"), this.sep(Sep.AFTER_DOWHILE_WHILE), this.paren(test, Sep.DO_WHILE_TEST_PAREN_BEFORE, Sep.DO_WHILE_TEST_PAREN_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceIfStatement(node, {test, consequent, alternate}) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = this.brace(consequent, node);
    }
    return objectAssign(
      seq(this.t("if"), this.sep(Sep.AFTER_IF),
        this.paren(test, Sep.IF_PAREN_BEFORE, Sep.IF_PAREN_AFTER), this.sep(Sep.AFTER_IF_TEST),
        withoutTrailingLinebreak(consequent),
        alternate ? seq(this.sep(Sep.BEFORE_ELSE), this.t("else"), this.sep(Sep.AFTER_ELSE), withoutTrailingLinebreak(alternate)) : empty(),
        this.sep(Sep.AFTER_STATEMENT(node))),
      {endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true});
  }

  reduceSwitchCase(node, {test, consequent}) {
    consequent = indent(withoutTrailingLinebreak(seq(this.sep(Sep.BEFORE_CASE_BODY), ...consequent)), true);
    return seq(this.t("case"), this.sep(Sep.BEFORE_CASE_TEST), test, this.sep(Sep.AFTER_CASE_TEST), this.t(":"),
      consequent, this.sep(Sep.AFTER_CASE_BODY));
  }

  reduceSwitchDefault(node, {consequent}) {
    consequent = indent(withoutTrailingLinebreak(seq(this.sep(Sep.BEFORE_CASE_BODY), ...consequent)), true);
    return seq(this.t("default"), this.sep(Sep.DEFAULT), this.t(":"),
      consequent, this.sep(Sep.AFTER_DEFAULT_BODY));
  }

  sep(separator) {
    switch(separator.type) {
      case "ARRAY_AFTER_COMMA":
      case "OBJECT_AFTER_COMMA":
      case "ARGS_AFTER_COMMA":
      case "PARAMETER_AFTER_COMMA":
      case "DECLARATORS_AFTER_COMMA":
      case "NAMED_IMPORT_AFTER_COMMA":
      case "IMPORT_AFTER_COMMA":
      case "BEFORE_DEFAULT_EQUALS":
      case "AFTER_DEFAULT_EQUALS":
      case "AFTER_PROP":
      case "BEFORE_JUMP_LABEL":
      case "BEFORE_CATCH":
      case "BEFORE_CATCH_BINDING":
      case "AFTER_CATCH_BINDING":
      case "BEFORE_CLASS_NAME":
      case "BEFORE_EXTENDS":
      case "AFTER_EXTENDS":
      case "BEFORE_CLASS_DECLARATION_ELEMENTS":
      case "BEFORE_CLASS_EXPRESSION_ELEMENTS":
      case "AFTER_STATIC":
      case "BEFORE_TERNARY_QUESTION":
      case "AFTER_TERNARY_QUESTION":
      case "BEFORE_TERNARY_COLON":
      case "AFTER_TERNARY_COLON":
      case "AFTER_DO":
      case "BEFORE_DOWHILE_WHILE":
      case "AFTER_DOWHILE_WHILE":
      case "AFTER_FORIN_FOR":
      case "BEFORE_FORIN_IN":
      case "AFTER_FORIN_FOR":
      case "BEFORE_FORIN_BODY":
      case "AFTER_FOROF_FOR":
      case "BEFORE_FOROF_OF":
      case "AFTER_FOROF_FOR":
      case "BEFORE_FOROF_BODY":
      case "AFTER_FOR_FOR":
      case "BEFORE_FOR_TEST":
      case "BEFORE_FOR_UPDATE":
      case "BEFORE_FOR_BODY":
      case "AFTER_GENERATOR_STAR":
      case "BEFORE_FUNCTION_DECLARATION_BODY":
      case "BEFORE_FUNCTION_EXPRESSION_BODY":
      case "BEFORE_ARROW":
      case "AFTER_ARROW":
      case "AFTER_GET":
      case "BEFORE_GET_BODY":
      case "AFTER_IF":
      case "AFTER_IF_TEST":
      case "BEFORE_ELSE":
      case "AFTER_ELSE":
      case "BEFORE_IMPORT_BINDINGS":
      case "BEFORE_IMPORT_MODULE":
      case "AFTER_IMPORT_BINDINGS":
      case "AFTER_FROM":
      case "BEFORE_IMPORT_NAMESPACE":
      case "BEFORE_IMPORT_STAR":
      case "AFTER_IMPORT_STAR":
      case "AFTER_IMPORT_AS":
      case "AFTER_NAMESPACE_BINDING":
      case "BEFORE_IMPORT_AS":
      case "AFTER_IMPORT_AS":
      case "EXPORTS_AFTER_COMMA":
      case "BEFORE_EXPORT_STAR":
      case "AFTER_EXPORT_STAR":
      case "BEFORE_EXPORT_BINDINGS":
      case "AFTER_EXPORT_BINDINGS":
      case "AFTER_EXPORT":
      case "AFTER_EXPORT_DEFAULT":
      case "BEFORE_EXPORT_AS":
      case "AFTER_EXPORT_AS":
      case "AFTER_LABEL_COLON":
      case "BEFORE_METHOD_BODY":
      case "AFTER_NEW":
      case "RETURN":
      case "AFTER_SET":
      case "BEFORE_SET_BODY":
      case "BEFORE_SET_PARAMS":
      case "BEFORE_CASE_TEST":
      case "BEFORE_SWITCH_DISCRIM":
      case "BEFORE_SWITCH_BODY":
      case "THROW":
      case "AFTER_TRY":
      case "BEFORE_CATCH":
      case "BEFORE_FINALLY":
      case "AFTER_FINALLY":
      case "VARIABLE_DECLARATION":
      case "YIELD":
      case "AFTER_YIELD_STAR":
      case "DECLARATORS_AFTER_COMMA":
      case "BEFORE_INIT_EQUALS":
      case "AFTER_INIT_EQUALS":
      case "AFTER_WHILE":
      case "BEFORE_WHILE_BODY":
      case "AFTER_WITH":
      case "BEFORE_WITH_BODY":
      case "BEFORE_FUNCTION_NAME":
      case "AFTER_BINOP":
      case "BEFORE_ASSIGN_OP":
      case "AFTER_ASSIGN_OP":
        return this.t(" ");
      case "AFTER_STATEMENT":
        switch (separator.node.type) {
          case "ForInStatement":
          case "ForOfStatement":
          case "ForStatement":
          case "WhileStatement":
          case "WithStatement":
            return empty(); // because those already end with an AFTER_STATEMENT
          default:
            return new Linebreak;
        }
      case "AFTER_CLASS_ELEMENT":
      case "BEFORE_CASE_BODY":
      case "AFTER_CASE_BODY":
      case "AFTER_DEFAULT_BODY":
        return new Linebreak;
      case "BEFORE_BINOP":
        return separator.op === "," ? empty() : this.t(" ");
      case "UNARY":
        return (separator.op === "delete" || separator.op === "void" || separator.op === "typeof") ? this.t(" ") : empty();
      default:
        return empty();
    }
  }
}