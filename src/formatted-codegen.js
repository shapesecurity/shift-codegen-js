const objectAssign = require('object-assign');
const { keyword } = require('esutils');
const { Precedence, getPrecedence, escapeStringLiteral, CodeRep, Empty, Token, NumberCodeRep, Paren, Bracket, Brace, NoIn, ContainsIn, Seq, SemiOp } = require('./coderep');

const INDENT = '  ';
class Linebreak extends CodeRep {
  constructor() {
    super();
    this.indentation = 0;
  }

  emit(ts) {
    ts.put('\n');
    for (let i = 0; i < this.indentation; ++i) {
      ts.put(INDENT);
    }
  }
}

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
  return codeRep instanceof Empty || codeRep instanceof Linebreak || codeRep instanceof Seq && codeRep.children.every(isEmpty);
}

let Sep = {};
const separatorNames = [
  'ARRAY_EMPTY',
  'ARRAY_BEFORE_COMMA',
  'ARRAY_AFTER_COMMA',
  'SPREAD',
  'AWAIT',
  'AFTER_FORAWAIT_AWAIT',
  'BEFORE_DEFAULT_EQUALS',
  'AFTER_DEFAULT_EQUALS',
  'REST',
  'OBJECT_BEFORE_COMMA',
  'OBJECT_AFTER_COMMA',
  'BEFORE_PROP',
  'AFTER_PROP',
  'BEFORE_JUMP_LABEL',
  'ARGS_BEFORE_COMMA',
  'ARGS_AFTER_COMMA',
  'CALL',
  'BEFORE_CATCH_BINDING',
  'AFTER_CATCH_BINDING',
  'BEFORE_CLASS_NAME',
  'BEFORE_EXTENDS',
  'AFTER_EXTENDS',
  'BEFORE_CLASS_DECLARATION_ELEMENTS',
  'BEFORE_CLASS_EXPRESSION_ELEMENTS',
  'AFTER_STATIC',
  'BEFORE_CLASS_ELEMENT',
  'AFTER_CLASS_ELEMENT',
  'BEFORE_TERNARY_QUESTION',
  'AFTER_TERNARY_QUESTION',
  'BEFORE_TERNARY_COLON',
  'AFTER_TERNARY_COLON',
  'COMPUTED_MEMBER_EXPRESSION',
  'COMPUTED_MEMBER_ASSIGNMENT_TARGET',
  'AFTER_DO',
  'BEFORE_DOWHILE_WHILE',
  'AFTER_DOWHILE_WHILE',
  'AFTER_FORIN_FOR',
  'BEFORE_FORIN_IN',
  'AFTER_FORIN_FOR',
  'BEFORE_FORIN_BODY',
  'AFTER_FOROF_FOR',
  'BEFORE_FOROF_OF',
  'AFTER_FOROF_FOR',
  'BEFORE_FOROF_BODY',
  'AFTER_FOR_FOR',
  'BEFORE_FOR_INIT',
  'AFTER_FOR_INIT',
  'EMPTY_FOR_INIT',
  'BEFORE_FOR_TEST',
  'AFTER_FOR_TEST',
  'EMPTY_FOR_TEST',
  'BEFORE_FOR_UPDATE',
  'AFTER_FOR_UPDATE',
  'EMPTY_FOR_UPDATE',
  'BEFORE_FOR_BODY',
  'BEFORE_GENERATOR_STAR',
  'AFTER_GENERATOR_STAR',
  'BEFORE_FUNCTION_PARAMS',
  'BEFORE_FUNCTION_DECLARATION_BODY',
  'BEFORE_FUNCTION_EXPRESSION_BODY',
  'AFTER_FUNCTION_DIRECTIVES',
  'BEFORE_ARROW',
  'AFTER_ARROW',
  'AFTER_GET',
  'BEFORE_GET_PARAMS',
  'BEFORE_GET_BODY',
  'AFTER_IF',
  'AFTER_IF_TEST',
  'BEFORE_ELSE',
  'AFTER_ELSE',
  'PARAMETER_BEFORE_COMMA',
  'PARAMETER_AFTER_COMMA',
  'NAMED_IMPORT_BEFORE_COMMA',
  'NAMED_IMPORT_AFTER_COMMA',
  'IMPORT_BEFORE_COMMA',
  'IMPORT_AFTER_COMMA',
  'BEFORE_IMPORT_BINDINGS',
  'BEFORE_IMPORT_MODULE',
  'AFTER_IMPORT_BINDINGS',
  'AFTER_FROM',
  'BEFORE_IMPORT_NAMESPACE',
  'BEFORE_IMPORT_STAR',
  'AFTER_IMPORT_STAR',
  'AFTER_IMPORT_AS',
  'AFTER_NAMESPACE_BINDING',
  'BEFORE_IMPORT_AS',
  'AFTER_IMPORT_AS',
  'EXPORTS_BEFORE_COMMA',
  'EXPORTS_AFTER_COMMA',
  'BEFORE_EXPORT_STAR',
  'AFTER_EXPORT_STAR',
  'BEFORE_EXPORT_BINDINGS',
  'AFTER_EXPORT_FROM_BINDINGS',
  'AFTER_EXPORT_LOCAL_BINDINGS',
  'AFTER_EXPORT',
  'EXPORT_DEFAULT',
  'AFTER_EXPORT_DEFAULT',
  'BEFORE_EXPORT_AS',
  'AFTER_EXPORT_AS',
  'BEFORE_LABEL_COLON',
  'AFTER_LABEL_COLON',
  'AFTER_METHOD_GENERATOR_STAR',
  'AFTER_METHOD_ASYNC',
  'AFTER_METHOD_NAME',
  'BEFORE_METHOD_BODY',
  'AFTER_MODULE_DIRECTIVES',
  'AFTER_NEW',
  'BEFORE_NEW_ARGS',
  'EMPTY_NEW_CALL',
  'NEW_TARGET_BEFORE_DOT',
  'NEW_TARGET_AFTER_DOT',
  'RETURN',
  'AFTER_SET',
  'BEFORE_SET_PARAMS',
  'BEFORE_SET_BODY',
  'AFTER_SCRIPT_DIRECTIVES',
  'BEFORE_STATIC_MEMBER_DOT',
  'AFTER_STATIC_MEMBER_DOT',
  'BEFORE_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT',
  'AFTER_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT',
  'BEFORE_CASE_TEST',
  'AFTER_CASE_TEST',
  'BEFORE_CASE_BODY',
  'AFTER_CASE_BODY',
  'DEFAULT',
  'AFTER_DEFAULT_BODY',
  'BEFORE_SWITCH_DISCRIM',
  'BEFORE_SWITCH_BODY',
  'TEMPLATE_TAG',
  'BEFORE_TEMPLATE_EXPRESSION',
  'AFTER_TEMPLATE_EXPRESSION',
  'THROW',
  'AFTER_TRY',
  'BEFORE_CATCH',
  'BEFORE_FINALLY',
  'AFTER_FINALLY',
  'VARIABLE_DECLARATION',
  'YIELD',
  'BEFORE_YIELD_STAR',
  'AFTER_YIELD_STAR',
  'DECLARATORS_BEFORE_COMMA',
  'DECLARATORS_AFTER_COMMA',
  'BEFORE_INIT_EQUALS',
  'AFTER_INIT_EQUALS',
  'AFTER_WHILE',
  'BEFORE_WHILE_BODY',
  'AFTER_WITH',
  'BEFORE_WITH_BODY',
  'PAREN_AVOIDING_DIRECTIVE_BEFORE',
  'PAREN_AVOIDING_DIRECTIVE_AFTER',
  'PRECEDENCE_BEFORE',
  'PRECEDENCE_AFTER',
  'EXPRESSION_PAREN_BEFORE',
  'EXPRESSION_PAREN_AFTER',
  'CALL_PAREN_BEFORE',
  'CALL_PAREN_AFTER',
  'CALL_PAREN_EMPTY',
  'CATCH_PAREN_BEFORE',
  'CATCH_PAREN_AFTER',
  'DO_WHILE_TEST_PAREN_BEFORE',
  'DO_WHILE_TEST_PAREN_AFTER',
  'EXPRESSION_STATEMENT_PAREN_BEFORE',
  'EXPRESSION_STATEMENT_PAREN_AFTER',
  'FOR_LET_PAREN_BEFORE',
  'FOR_LET_PAREN_AFTER',
  'FOR_IN_LET_PAREN_BEFORE',
  'FOR_IN_LET_PAREN_AFTER',
  'FOR_IN_PAREN_BEFORE',
  'FOR_IN_PAREN_AFTER',
  'FOR_OF_LET_PAREN_BEFORE',
  'FOR_OF_LET_PAREN_AFTER',
  'FOR_OF_PAREN_BEFORE',
  'FOR_OF_PAREN_AFTER',
  'PARAMETERS_PAREN_BEFORE',
  'PARAMETERS_PAREN_AFTER',
  'PARAMETERS_PAREN_EMPTY',
  'ARROW_PARAMETERS_PAREN_BEFORE',
  'ARROW_PARAMETERS_PAREN_AFTER',
  'ARROW_PARAMETERS_PAREN_EMPTY',
  'ARROW_BODY_PAREN_BEFORE',
  'ARROW_BODY_PAREN_AFTER',
  'BEFORE_ARROW_ASYNC_PARAMS',
  'GETTER_PARAMS',
  'IF_PAREN_BEFORE',
  'IF_PAREN_AFTER',
  'EXPORT_PAREN_BEFORE',
  'EXPORT_PAREN_AFTER',
  'NEW_CALLEE_PAREN_BEFORE',
  'NEW_CALLEE_PAREN_AFTER',
  'NEW_PAREN_BEFORE',
  'NEW_PAREN_AFTER',
  'NEW_PAREN_EMPTY',
  'SETTER_PARAM_BEFORE',
  'SETTER_PARAM_AFTER',
  'SWITCH_DISCRIM_PAREN_BEFORE',
  'SWITCH_DISCRIM_PAREN_AFTER',
  'WHILE_TEST_PAREN_BEFORE',
  'WHILE_TEST_PAREN_AFTER',
  'WITH_PAREN_BEFORE',
  'WITH_PAREN_AFTER',
  'OBJECT_BRACE_INITIAL',
  'OBJECT_BRACE_FINAL',
  'OBJECT_EMPTY',
  'BLOCK_BRACE_INITIAL',
  'BLOCK_BRACE_FINAL',
  'BLOCK_EMPTY',
  'CLASS_BRACE_INITIAL',
  'CLASS_BRACE_FINAL',
  'CLASS_EMPTY',
  'CLASS_EXPRESSION_BRACE_INITIAL',
  'CLASS_EXPRESSION_BRACE_FINAL',
  'CLASS_EXPRESSION_BRACE_EMPTY',
  'FUNCTION_BRACE_INITIAL',
  'FUNCTION_BRACE_FINAL',
  'FUNCTION_EMPTY',
  'FUNCTION_EXPRESSION_BRACE_INITIAL',
  'FUNCTION_EXPRESSION_BRACE_FINAL',
  'FUNCTION_EXPRESSION_EMPTY',
  'ARROW_BRACE_INITIAL',
  'ARROW_BRACE_FINAL',
  'ARROW_BRACE_EMPTY',
  'GET_BRACE_INTIAL',
  'GET_BRACE_FINAL',
  'GET_BRACE_EMPTY',
  'MISSING_ELSE_INTIIAL',
  'MISSING_ELSE_FINAL',
  'MISSING_ELSE_EMPTY',
  'IMPORT_BRACE_INTIAL',
  'IMPORT_BRACE_FINAL',
  'IMPORT_BRACE_EMPTY',
  'EXPORT_BRACE_INITIAL',
  'EXPORT_BRACE_FINAL',
  'EXPORT_BRACE_EMPTY',
  'METHOD_BRACE_INTIAL',
  'METHOD_BRACE_FINAL',
  'METHOD_BRACE_EMPTY',
  'SET_BRACE_INTIIAL',
  'SET_BRACE_FINAL',
  'SET_BRACE_EMPTY',
  'SWITCH_BRACE_INTIAL',
  'SWITCH_BRACE_FINAL',
  'SWITCH_BRACE_EMPTY',
  'ARRAY_INITIAL',
  'ARRAY_FINAL',
  'COMPUTED_MEMBER_BRACKET_INTIAL',
  'COMPUTED_MEMBER_BRACKET_FINAL',
  'COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_INTIAL',
  'COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_FINAL',
  'COMPUTED_PROPERTY_BRACKET_INTIAL',
  'COMPUTED_PROPERTY_BRACKET_FINAL',
];
for (let i = 0; i < separatorNames.length; ++i) {
  Sep[separatorNames[i]] = { type: separatorNames[i] };
}

Sep.BEFORE_ASSIGN_OP = function (op) {
  return {
    type: 'BEFORE_ASSIGN_OP',
    op,
  };
};

Sep.AFTER_ASSIGN_OP = function (op) {
  return {
    type: 'AFTER_ASSIGN_OP',
    op,
  };
};

Sep.BEFORE_BINOP = function (op) {
  return {
    type: 'BEFORE_BINOP',
    op,
  };
};

Sep.AFTER_BINOP = function (op) {
  return {
    type: 'AFTER_BINOP',
    op,
  };
};

Sep.BEFORE_POSTFIX = function (op) {
  return {
    type: 'BEFORE_POSTFIX',
    op,
  };
};

Sep.UNARY = function (op) {
  return {
    type: 'UNARY',
    op,
  };
};

Sep.AFTER_STATEMENT = function (node) {
  return {
    type: 'AFTER_STATEMENT',
    node,
  };
};

Sep.BEFORE_FUNCTION_NAME = function (node) {
  return {
    type: 'BEFORE_FUNCTION_NAME',
    node,
  };
};

class ExtensibleCodeGen {
  parenToAvoidBeingDirective(element, original) {
    if (element && element.type === 'ExpressionStatement' && element.expression.type === 'LiteralStringExpression') {
      return seq(this.paren(original.children[0], Sep.PAREN_AVOIDING_DIRECTIVE_BEFORE, Sep.PAREN_AVOIDING_DIRECTIVE_AFTER), this.semiOp());
    }
    return original;
  }

  t(token, isRegExp = false) {
    return new Token(token, isRegExp);
  }

  p(node, precedence, a) {
    return getPrecedence(node) < precedence ? this.paren(a, Sep.PRECEDENCE_BEFORE, Sep.PRECEDENCE_AFTER) : a;
  }

  getAssignmentExpr(state) {
    return state ? state.containsGroup ? this.paren(state, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER) : state : empty();
  }

  paren(rep, first, last, emptySep) {
    if (isEmpty(rep)) {
      return new Paren(this.sep(emptySep));
    }
    return new Paren(seq(first ? this.sep(first) : empty(), rep, last ? this.sep(last) : empty()));
  }

  brace(rep, node, first, last, emptySep) {
    if (isEmpty(rep)) {
      return new Brace(this.sep(emptySep));
    }
    return new Brace(seq(this.sep(first), rep, this.sep(last)));
  }

  bracket(rep, first, last, emptySep) {
    if (isEmpty(rep)) {
      return new Bracket(this.sep(emptySep));
    }
    return new Bracket(seq(this.sep(first), rep, this.sep(last)));
  }

  commaSep(pieces, before, after) {
    let first = true;
    pieces = pieces.map(p => {
      if (first) {
        first = false;
        return p;
      }
      return seq(this.sep(before), this.t(','), this.sep(after), p);

    });
    return seq(...pieces);
  }

  semiOp() {
    return new SemiOp;
  }

  sep(/* kind */) {
    return empty();
  }

  reduceArrayExpression(node, { elements }) {
    if (elements.length === 0) {
      return this.bracket(empty(), null, null, Sep.ARRAY_EMPTY);
    }

    let content = this.commaSep(elements.map(e=>this.getAssignmentExpr(e)), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
    if (elements.length > 0 && elements[elements.length - 1] == null) {
      content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(','), this.sep(Sep.ARRAY_AFTER_COMMA));
    }
    return this.bracket(content, Sep.ARRAY_INITIAL, Sep.ARRAY_FINAL);
  }

  reduceAwaitExpression(node, { expression }) {
    return seq(this.t('await'), this.sep(Sep.AWAIT), this.p(node.expression, getPrecedence(node), expression));
  }

  reduceSpreadElement(node, { expression }) {
    return seq(this.t('...'), this.sep(Sep.SPREAD), this.p(node.expression, Precedence.Assignment, expression));
  }

  reduceSpreadProperty(node, { expression }) {
    return seq(this.t('...'), this.sep(Sep.SPREAD), this.getAssignmentExpr(expression));
  }

  reduceAssignmentExpression(node, { binding, expression }) {
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
    return objectAssign(seq(leftCode, this.sep(Sep.BEFORE_ASSIGN_OP('=')), this.t('='), this.sep(Sep.AFTER_ASSIGN_OP('=')), rightCode), { containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass });
  }

  reduceAssignmentTargetIdentifier(node) {
    let a = this.t(node.name);
    if (node.name === 'let') {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceAssignmentTargetWithDefault(node, { binding, init }) {
    return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, Precedence.Assignment, init));
  }

  reduceCompoundAssignmentExpression(node, { binding, expression }) {
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
    return objectAssign(seq(leftCode, this.sep(Sep.BEFORE_ASSIGN_OP(node.operator)), this.t(node.operator), this.sep(Sep.AFTER_ASSIGN_OP(node.operator)), rightCode), { containsIn, startsWithCurly, startsWithLetSquareBracket, startsWithFunctionOrClass });
  }

  reduceBinaryExpression(node, { left, right }) {
    let leftCode = left;
    let startsWithCurly = left.startsWithCurly;
    let startsWithLetSquareBracket = left.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = left.startsWithFunctionOrClass;
    let leftContainsIn = left.containsIn;
    let isRightAssociative = node.operator === '**';
    if (getPrecedence(node.left) < getPrecedence(node) || isRightAssociative && (getPrecedence(node.left) === getPrecedence(node) || node.left.type === 'UnaryExpression')) {
      leftCode = this.paren(leftCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      startsWithCurly = false;
      startsWithLetSquareBracket = false;
      startsWithFunctionOrClass = false;
      leftContainsIn = false;
    }
    let rightCode = right;
    let rightContainsIn = right.containsIn;
    if (getPrecedence(node.right) < getPrecedence(node) || !isRightAssociative && getPrecedence(node.right) === getPrecedence(node)) {
      rightCode = this.paren(rightCode, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      rightContainsIn = false;
    }
    return objectAssign(
      seq(leftCode, this.sep(Sep.BEFORE_BINOP(node.operator)), this.t(node.operator), this.sep(Sep.AFTER_BINOP(node.operator)), rightCode),
      {
        containsIn: leftContainsIn || rightContainsIn || node.operator === 'in',
        containsGroup: node.operator === ',',
        startsWithCurly,
        startsWithLetSquareBracket,
        startsWithFunctionOrClass,
      }
    );
  }

  reduceBindingWithDefault(node, { binding, init }) {
    return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, Precedence.Assignment, init));
  }

  reduceBindingIdentifier(node) {
    let a = this.t(node.name);
    if (node.name === 'let') {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceArrayAssignmentTarget(node, { elements, rest }) {
    let content;
    if (elements.length === 0) {
      content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
    } else {
      elements = elements.concat(rest == null ? [] : [seq(this.t('...'), this.sep(Sep.REST), rest)]);
      content = this.commaSep(elements.map(e=>this.getAssignmentExpr(e)), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(','), this.sep(Sep.ARRAY_AFTER_COMMA));
      }
    }
    return this.bracket(content, Sep.ARRAY_INITIAL, Sep.ARRAY_FINAL, Sep.ARRAY_EMPTY);
  }

  reduceArrayBinding(node, { elements, rest }) {
    let content;
    if (elements.length === 0) {
      content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
    } else {
      elements = elements.concat(rest == null ? [] : [seq(this.t('...'), this.sep(Sep.REST), rest)]);
      content = this.commaSep(elements.map(e=>this.getAssignmentExpr(e)), Sep.ARRAY_BEFORE_COMMA, Sep.ARRAY_AFTER_COMMA);
      if (elements.length > 0 && elements[elements.length - 1] == null) {
        content = seq(content, this.sep(Sep.ARRAY_BEFORE_COMMA), this.t(','), this.sep(Sep.ARRAY_AFTER_COMMA));
      }
    }
    return this.bracket(content, Sep.ARRAY_INITIAL, Sep.ARRAY_FINAL, Sep.ARRAY_EMPTY);
  }

  reduceObjectAssignmentTarget(node, { properties, rest }) {
    let content;
    if (properties.length === 0) {
      content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
    } else {
      content = this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
      content = rest == null ? content : this.commaSep([content, seq(this.t('...'), this.sep(Sep.REST), rest)], Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
    }
    let state = this.brace(content, node, Sep.OBJECT_BRACE_INITIAL, Sep.OBJECT_BRACE_FINAL, Sep.OBJECT_EMPTY);
    state.startsWithCurly = true;
    return state;
  }

  reduceObjectBinding(node, { properties, rest }) {
    let content;
    if (properties.length === 0) {
      content = rest == null ? empty() : seq(this.t('...'), this.sep(Sep.REST), rest);
    } else {
      content = this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
      content = rest == null ? content : this.commaSep([content, seq(this.t('...'), this.sep(Sep.REST), rest)], Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA);
    }
    let state = this.brace(content, node, Sep.OBJECT_BRACE_INITIAL, Sep.OBJECT_BRACE_FINAL, Sep.OBJECT_EMPTY);
    state.startsWithCurly = true;
    return state;
  }

  reduceAssignmentTargetPropertyIdentifier(node, { binding, init }) {
    if (node.init == null) return binding;
    return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, Precedence.Assignment, init));
  }

  reduceAssignmentTargetPropertyProperty(node, { name, binding }) {
    return seq(name, this.sep(Sep.BEFORE_PROP), this.t(':'), this.sep(Sep.AFTER_PROP), binding);
  }

  reduceBindingPropertyIdentifier(node, { binding, init }) {
    if (node.init == null) return binding;
    return seq(binding, this.sep(Sep.BEFORE_DEFAULT_EQUALS), this.t('='), this.sep(Sep.AFTER_DEFAULT_EQUALS), this.p(node.init, Precedence.Assignment, init));
  }

  reduceBindingPropertyProperty(node, { name, binding }) {
    return seq(name, this.sep(Sep.BEFORE_PROP), this.t(':'), this.sep(Sep.AFTER_PROP), binding);
  }

  reduceBlock(node, { statements }) {
    return this.brace(seq(...statements), node, Sep.BLOCK_BRACE_INITIAL, Sep.BLOCK_BRACE_FINAL, Sep.BLOCK_EMPTY);
  }

  reduceBlockStatement(node, { block }) {
    return seq(block, this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceBreakStatement(node) {
    return seq(this.t('break'), node.label ? seq(this.sep(Sep.BEFORE_JUMP_LABEL), this.t(node.label)) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceCallExpression(node, { callee, arguments: args }) {
    const parenthizedArgs = args.map((a, i) => this.p(node.arguments[i], Precedence.Assignment, a));
    return objectAssign(
      seq(this.p(node.callee, getPrecedence(node), callee), this.sep(Sep.CALL), this.paren(this.commaSep(parenthizedArgs, Sep.ARGS_BEFORE_COMMA, Sep.ARGS_AFTER_COMMA), Sep.CALL_PAREN_BEFORE, Sep.CALL_PAREN_AFTER, Sep.CALL_PAREN_EMPTY)),
      {
        startsWithCurly: callee.startsWithCurly,
        startsWithLet: callee.startsWithLet,
        startsWithLetSquareBracket: callee.startsWithLetSquareBracket,
        startsWithFunctionOrClass: callee.startsWithFunctionOrClass,
      }
    );
  }

  reduceCatchClause(node, { binding, body }) {
    if (binding == null) {
      return seq(this.t('catch'), this.sep(Sep.BEFORE_CATCH_BINDING), body);
    }
    return seq(this.t('catch'),
      this.sep(Sep.BEFORE_CATCH_BINDING),
      this.paren(binding, Sep.CATCH_PAREN_BEFORE, Sep.CATCH_PAREN_AFTER),
      this.sep(Sep.AFTER_CATCH_BINDING), body);
  }

  reduceClassDeclaration(node, { name, super: _super, elements }) {
    let state = seq(this.t('class'), node.name.name === '*default*' ? empty() : seq(this.sep(Sep.BEFORE_CLASS_NAME), name));
    if (_super != null) {
      state = seq(state, this.sep(Sep.BEFORE_EXTENDS), this.t('extends'), this.sep(Sep.AFTER_EXTENDS), this.p(node.super, Precedence.New, _super));
    }
    state = seq(state, this.sep(Sep.BEFORE_CLASS_DECLARATION_ELEMENTS), this.brace(seq(...elements), node, Sep.CLASS_BRACE_INITIAL, Sep.CLASS_BRACE_FINAL, Sep.CLASS_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
    return state;
  }

  reduceClassExpression(node, { name, super: _super, elements }) {
    let state = this.t('class');
    if (name != null) {
      state = seq(state, this.sep(Sep.BEFORE_CLASS_NAME), name);
    }
    if (_super != null) {
      state = seq(state, this.sep(Sep.BEFORE_EXTENDS), this.t('extends'), this.sep(Sep.AFTER_EXTENDS), this.p(node.super, Precedence.New, _super));
    }
    state = seq(state, this.sep(Sep.BEFORE_CLASS_EXPRESSION_ELEMENTS), this.brace(seq(...elements), node, Sep.CLASS_EXPRESSION_BRACE_INITIAL, Sep.CLASS_EXPRESSION_BRACE_FINAL, Sep.CLASS_EXPRESSION_BRACE_EMPTY));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceClassElement(node, { method }) {
    method = seq(this.sep(Sep.BEFORE_CLASS_ELEMENT), method, this.sep(Sep.AFTER_CLASS_ELEMENT));
    if (!node.isStatic) return method;
    return seq(this.t('static'), this.sep(Sep.AFTER_STATIC), method);
  }

  reduceComputedMemberAssignmentTarget(node, { object, expression }) {
    let startsWithLetSquareBracket =
      object.startsWithLetSquareBracket ||
      node.object.type === 'IdentifierExpression' && node.object.name === 'let';
    return objectAssign(
      seq(this.p(node.object, getPrecedence(node), object), this.sep(Sep.COMPUTED_MEMBER_ASSIGNMENT_TARGET), this.bracket(expression, Sep.COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_INTIAL, Sep.COMPUTED_MEMBER_ASSIGNMENT_TARGET_BRACKET_FINAL)),
      {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass,
      }
    );
  }

  reduceComputedMemberExpression(node, { object, expression }) {
    let startsWithLetSquareBracket =
      object.startsWithLetSquareBracket ||
      node.object.type === 'IdentifierExpression' && node.object.name === 'let';
    return objectAssign(
      seq(this.p(node.object, getPrecedence(node), object), this.sep(Sep.COMPUTED_MEMBER_EXPRESSION), this.bracket(expression, Sep.COMPUTED_MEMBER_BRACKET_INTIAL, Sep.COMPUTED_MEMBER_BRACKET_FINAL)),
      {
        startsWithLet: object.startsWithLet,
        startsWithLetSquareBracket,
        startsWithCurly: object.startsWithCurly,
        startsWithFunctionOrClass: object.startsWithFunctionOrClass,
      }
    );
  }

  reduceComputedPropertyName(node, { expression }) {
    return this.bracket(this.p(node.expression, Precedence.Assignment, expression), Sep.COMPUTED_PROPERTY_BRACKET_INTIAL, Sep.COMPUTED_PROPERTY_BRACKET_FINAL);
  }

  reduceConditionalExpression(node, { test, consequent, alternate }) {
    let containsIn = test.containsIn || alternate.containsIn;
    let startsWithCurly = test.startsWithCurly;
    let startsWithLetSquareBracket = test.startsWithLetSquareBracket;
    let startsWithFunctionOrClass = test.startsWithFunctionOrClass;
    return objectAssign(
      seq(
        this.p(node.test, Precedence.LogicalOR, test), this.sep(Sep.BEFORE_TERNARY_QUESTION), this.t('?'), this.sep(Sep.AFTER_TERNARY_QUESTION),
        this.p(node.consequent, Precedence.Assignment, consequent), this.sep(Sep.BEFORE_TERNARY_COLON), this.t(':'), this.sep(Sep.AFTER_TERNARY_COLON),
        this.p(node.alternate, Precedence.Assignment, alternate)), {
        containsIn,
        startsWithCurly,
        startsWithLetSquareBracket,
        startsWithFunctionOrClass,
      });
  }

  reduceContinueStatement(node) {
    return seq(this.t('continue'), node.label ? seq(this.sep(Sep.BEFORE_JUMP_LABEL), this.t(node.label)) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceDataProperty(node, { name, expression }) {
    return seq(name, this.sep(Sep.BEFORE_PROP), this.t(':'), this.sep(Sep.AFTER_PROP), this.getAssignmentExpr(expression));
  }

  reduceDebuggerStatement(node) {
    return seq(this.t('debugger'), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceDoWhileStatement(node, { body, test }) {
    return seq(this.t('do'), this.sep(Sep.AFTER_DO), body, this.sep(Sep.BEFORE_DOWHILE_WHILE), this.t('while'), this.sep(Sep.AFTER_DOWHILE_WHILE), this.paren(test, Sep.DO_WHILE_TEST_PAREN_BEFORE, Sep.DO_WHILE_TEST_PAREN_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceEmptyStatement(node) {
    return seq(this.t(';'), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceExpressionStatement(node, { expression }) {
    let needsParens =
      expression.startsWithCurly ||
      expression.startsWithLetSquareBracket ||
      expression.startsWithFunctionOrClass;
    return seq(needsParens ? this.paren(expression, Sep.EXPRESSION_STATEMENT_PAREN_BEFORE, Sep.EXPRESSION_STATEMENT_PAREN_AFTER) : expression, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceForInStatement(node, { left, right, body }) {
    left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
    return objectAssign(
      seq(this.t('for'), this.sep(Sep.AFTER_FORIN_FOR), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_IN_LET_PAREN_BEFORE, Sep.FOR_IN_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FORIN_IN), this.t('in'), this.sep(Sep.AFTER_FORIN_FOR), right), Sep.FOR_IN_PAREN_BEFORE, Sep.FOR_IN_PAREN_AFTER), this.sep(Sep.BEFORE_FORIN_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      { endsWithMissingElse: body.endsWithMissingElse });
  }

  reduceForOfStatement(node, { left, right, body }) {
    left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
    return objectAssign(
      seq(this.t('for'), this.sep(Sep.AFTER_FOROF_FOR), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_OF_LET_PAREN_BEFORE, Sep.FOR_OF_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FOROF_OF), this.t('of'), this.sep(Sep.AFTER_FOROF_FOR), this.p(node.right, Precedence.Assignment, right)), Sep.FOR_OF_PAREN_BEFORE, Sep.FOR_OF_PAREN_AFTER), this.sep(Sep.BEFORE_FOROF_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      { endsWithMissingElse: body.endsWithMissingElse });
  }

  reduceForStatement(node, { init, test, update, body }) {
    if (init) {
      if (init.startsWithLetSquareBracket) {
        init = this.paren(init, Sep.FOR_LET_PAREN_BEFORE, Sep.FOR_LET_PAREN_AFTER);
      }
      init = noIn(markContainsIn(init));
    }
    return objectAssign(
      seq(
        this.t('for'), this.sep(Sep.AFTER_FOR_FOR),
        this.paren(seq(init ? seq(this.sep(Sep.BEFORE_FOR_INIT), init, this.sep(Sep.AFTER_FOR_INIT)) : this.sep(Sep.EMPTY_FOR_INIT), this.t(';'), test ? seq(this.sep(Sep.BEFORE_FOR_TEST), test, this.sep(Sep.AFTER_FOR_TEST)) : this.sep(Sep.EMPTY_FOR_TEST), this.t(';'), update ? seq(this.sep(Sep.BEFORE_FOR_UPDATE), update, this.sep(Sep.AFTER_FOR_UPDATE)) : this.sep(Sep.EMPTY_FOR_UPDATE))),
        this.sep(Sep.BEFORE_FOR_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      {
        endsWithMissingElse: body.endsWithMissingElse,
      });
  }

  reduceForAwaitStatement(node, { left, right, body }) {
    left = node.left.type === 'VariableDeclaration' ? noIn(markContainsIn(left)) : left;
    return objectAssign(
      seq(this.t('for'), this.sep(Sep.AFTER_FOROF_FOR), this.t('await'), this.sep(Sep.AFTER_FORAWAIT_AWAIT), this.paren(seq(left.startsWithLet ? this.paren(left, Sep.FOR_OF_LET_PAREN_BEFORE, Sep.FOR_OF_LET_PAREN_AFTER) : left, this.sep(Sep.BEFORE_FOROF_OF), this.t('of'), this.sep(Sep.AFTER_FOROF_FOR), this.p(node.right, Precedence.Assignment, right)), Sep.FOR_OF_PAREN_BEFORE, Sep.FOR_OF_PAREN_AFTER), this.sep(Sep.BEFORE_FOROF_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      { endsWithMissingElse: body.endsWithMissingElse });
  }

  reduceFunctionBody(node, { directives, statements }) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, directives.length ? this.sep(Sep.AFTER_FUNCTION_DIRECTIVES) : empty(), ...statements);
  }

  reduceFunctionDeclaration(node, { name, params, body }) {
    return seq(node.isAsync ? this.t('async') : empty(), this.t('function'), node.isGenerator ? seq(this.sep(Sep.BEFORE_GENERATOR_STAR), this.t('*'), this.sep(Sep.AFTER_GENERATOR_STAR)) : empty(), this.sep(Sep.BEFORE_FUNCTION_NAME(node)), node.name.name === '*default*' ? empty() : name, this.sep(Sep.BEFORE_FUNCTION_PARAMS), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_FUNCTION_DECLARATION_BODY), this.brace(body, node, Sep.FUNCTION_BRACE_INITIAL, Sep.FUNCTION_BRACE_FINAL, Sep.FUNCTION_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceFunctionExpression(node, { name, params, body }) {
    let state = seq(node.isAsync ? this.t('async') : empty(), this.t('function'), node.isGenerator ? seq(this.sep(Sep.BEFORE_GENERATOR_STAR), this.t('*'), this.sep(Sep.AFTER_GENERATOR_STAR)) : empty(), this.sep(Sep.BEFORE_FUNCTION_NAME(node)), name ? name : empty(), this.sep(Sep.BEFORE_FUNCTION_PARAMS), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_FUNCTION_EXPRESSION_BODY), this.brace(body, node, Sep.FUNCTION_EXPRESSION_BRACE_INITIAL, Sep.FUNCTION_EXPRESSION_BRACE_FINAL, Sep.FUNCTION_EXPRESSION_EMPTY));
    state.startsWithFunctionOrClass = true;
    return state;
  }

  reduceFormalParameters(node, { items, rest }) {
    return this.commaSep(items.concat(rest == null ? [] : [seq(this.t('...'), this.sep(Sep.REST), rest)]), Sep.PARAMETER_BEFORE_COMMA, Sep.PARAMETER_AFTER_COMMA);
  }

  reduceArrowExpression(node, { params, body }) {
    if (node.params.rest != null || node.params.items.length !== 1 || node.params.items[0].type !== 'BindingIdentifier') {
      params = this.paren(params, Sep.ARROW_PARAMETERS_PAREN_BEFORE, Sep.ARROW_PARAMETERS_PAREN_AFTER, Sep.ARROW_PARAMETERS_PAREN_EMPTY);
    }
    let containsIn = false;
    if (node.body.type === 'FunctionBody') {
      body = this.brace(body, node, Sep.ARROW_BRACE_INITIAL, Sep.ARROW_BRACE_FINAL, Sep.ARROW_BRACE_EMPTY);
    } else if (body.startsWithCurly) {
      body = this.paren(body, Sep.ARROW_BODY_PAREN_BEFORE, Sep.ARROW_BODY_PAREN_AFTER);
    } else if (body.containsIn) {
      containsIn = true;
    }
    return objectAssign(seq(node.isAsync ? seq(this.t('async'), this.sep(Sep.BEFORE_ARROW_ASYNC_PARAMS)) : empty(), params, this.sep(Sep.BEFORE_ARROW), this.t('=>'), this.sep(Sep.AFTER_ARROW), this.p(node.body, Precedence.Assignment, body)), { containsIn });
  }

  reduceGetter(node, { name, body }) {
    return seq(this.t('get'), this.sep(Sep.AFTER_GET), name, this.sep(Sep.BEFORE_GET_PARAMS), this.paren(empty(), null, null, Sep.GETTER_PARAMS), this.sep(Sep.BEFORE_GET_BODY), this.brace(body, node, Sep.GET_BRACE_INTIAL, Sep.GET_BRACE_FINAL, Sep.GET_BRACE_EMPTY));
  }

  reduceIdentifierExpression(node) {
    let a = this.t(node.name);
    if (node.name === 'let') {
      a.startsWithLet = true;
    }
    return a;
  }

  reduceIfStatement(node, { test, consequent, alternate }) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = this.brace(consequent, node, Sep.MISSING_ELSE_INTIIAL, Sep.MISSING_ELSE_FINAL, Sep.MISSING_ELSE_EMPTY);
    }
    return objectAssign(
      seq(this.t('if'), this.sep(Sep.AFTER_IF),
        this.paren(test, Sep.IF_PAREN_BEFORE, Sep.IF_PAREN_AFTER), this.sep(Sep.AFTER_IF_TEST),
        consequent,
        alternate ? seq(this.sep(Sep.BEFORE_ELSE), this.t('else'), this.sep(Sep.AFTER_ELSE), alternate) : empty(), this.sep(Sep.AFTER_STATEMENT(node))),
      { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
  }

  reduceImport(node, { defaultBinding, namedImports }) {
    let bindings = [];
    if (defaultBinding != null) {
      bindings.push(defaultBinding);
    }
    if (namedImports.length > 0) {
      bindings.push(this.brace(this.commaSep(namedImports, Sep.NAMED_IMPORT_BEFORE_COMMA, Sep.NAMED_IMPORT_AFTER_COMMA), node, Sep.IMPORT_BRACE_INTIAL, Sep.IMPORT_BRACE_FINAL, Sep.IMPORT_BRACE_EMPTY));
    }
    if (bindings.length === 0) {
      return seq(this.t('import'), this.sep(Sep.BEFORE_IMPORT_MODULE), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
    return seq(this.t('import'), this.sep(Sep.BEFORE_IMPORT_BINDINGS), this.commaSep(bindings, Sep.IMPORT_BEFORE_COMMA, Sep.IMPORT_AFTER_COMMA), this.sep(Sep.AFTER_IMPORT_BINDINGS), this.t('from'), this.sep(Sep.AFTER_FROM), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceImportNamespace(node, { defaultBinding, namespaceBinding }) {
    return seq(
      this.t('import'), this.sep(Sep.BEFORE_IMPORT_NAMESPACE),
      defaultBinding == null ? empty() : seq(defaultBinding, this.sep(Sep.IMPORT_BEFORE_COMMA), this.t(','), this.sep(Sep.IMPORT_AFTER_COMMA)),
      this.sep(Sep.BEFORE_IMPORT_STAR), this.t('*'), this.sep(Sep.AFTER_IMPORT_STAR),
      this.t('as'), this.sep(Sep.AFTER_IMPORT_AS),
      namespaceBinding, this.sep(Sep.AFTER_NAMESPACE_BINDING),
      this.t('from'), this.sep(Sep.AFTER_FROM),
      this.t(escapeStringLiteral(node.moduleSpecifier)),
      this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node))
    );
  }

  reduceImportSpecifier(node, { binding }) {
    if (node.name == null) return binding;
    return seq(this.t(node.name), this.sep(Sep.BEFORE_IMPORT_AS), this.t('as'), this.sep(Sep.AFTER_IMPORT_AS), binding);
  }

  reduceExportAllFrom(node) {
    return seq(this.t('export'), this.sep(Sep.BEFORE_EXPORT_STAR), this.t('*'), this.sep(Sep.AFTER_EXPORT_STAR), this.t('from'), this.sep(Sep.AFTER_FROM), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceExportFrom(node, { namedExports }) {
    return seq(this.t('export'), this.sep(Sep.BEFORE_EXPORT_BINDINGS), this.brace(this.commaSep(namedExports, Sep.EXPORTS_BEFORE_COMMA, Sep.EXPORTS_AFTER_COMMA), node, Sep.EXPORT_BRACE_INITIAL, Sep.EXPORT_BRACE_FINAL, Sep.EXPORT_BRACE_EMPTY), this.sep(Sep.AFTER_EXPORT_FROM_BINDINGS), this.t('from'), this.sep(Sep.AFTER_FROM), this.t(escapeStringLiteral(node.moduleSpecifier)), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceExportLocals(node, { namedExports }) {
    return seq(this.t('export'), this.sep(Sep.BEFORE_EXPORT_BINDINGS), this.brace(this.commaSep(namedExports, Sep.EXPORTS_BEFORE_COMMA, Sep.EXPORTS_AFTER_COMMA), node, Sep.EXPORT_BRACE_INITIAL, Sep.EXPORT_BRACE_FINAL, Sep.EXPORT_BRACE_EMPTY), this.sep(Sep.AFTER_EXPORT_LOCAL_BINDINGS), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceExport(node, { declaration }) {
    switch (node.declaration.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        break;
      default:
        declaration = seq(declaration, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
    return seq(this.t('export'), this.sep(Sep.AFTER_EXPORT), declaration);
  }

  reduceExportDefault(node, { body }) {
    body = body.startsWithFunctionOrClass ? this.paren(body, Sep.EXPORT_PAREN_BEFORE, Sep.EXPORT_PAREN_AFTER) : body;
    switch (node.body.type) {
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        return seq(this.t('export'), this.sep(Sep.EXPORT_DEFAULT), this.t('default'), this.sep(Sep.AFTER_EXPORT_DEFAULT), body);
      default:
        return seq(this.t('export'), this.sep(Sep.EXPORT_DEFAULT), this.t('default'), this.sep(Sep.AFTER_EXPORT_DEFAULT), this.p(node.body, Precedence.Assignment, body), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
    }
  }

  reduceExportFromSpecifier(node) {
    if (node.exportedName == null) return this.t(node.name);
    return seq(this.t(node.name), this.sep(Sep.BEFORE_EXPORT_AS), this.t('as'), this.sep(Sep.AFTER_EXPORT_AS), this.t(node.exportedName));
  }

  reduceExportLocalSpecifier(node, { name }) {
    if (node.exportedName == null) return name;
    return seq(name, this.sep(Sep.BEFORE_EXPORT_AS), this.t('as'), this.sep(Sep.AFTER_EXPORT_AS), this.t(node.exportedName));
  }

  reduceLabeledStatement(node, { body }) {
    return objectAssign(seq(this.t(node.label), this.sep(Sep.BEFORE_LABEL_COLON), this.t(':'), this.sep(Sep.AFTER_LABEL_COLON), body), { endsWithMissingElse: body.endsWithMissingElse });
  }

  reduceLiteralBooleanExpression(node) {
    return this.t(node.value.toString());
  }

  reduceLiteralNullExpression(/* node */) {
    return this.t('null');
  }

  reduceLiteralInfinityExpression(/* node */) {
    return this.t('2e308');
  }

  reduceLiteralNumericExpression(node) {
    return new NumberCodeRep(node.value);
  }

  reduceLiteralRegExpExpression(node) {
    return this.t(`/${node.pattern}/${node.global ? 'g' : ''}${node.ignoreCase ? 'i' : ''}${node.multiLine ? 'm' : ''}${node.dotAll ? 's' : ''}${node.unicode ? 'u' : ''}${node.sticky ? 'y' : ''}`, true);
  }

  reduceLiteralStringExpression(node) {
    return this.t(escapeStringLiteral(node.value));
  }

  reduceMethod(node, { name, params, body }) {
    return seq(node.isAsync ? seq(this.t('async'), this.sep(Sep.AFTER_METHOD_ASYNC)) : empty(), node.isGenerator ? seq(this.t('*'), this.sep(Sep.AFTER_METHOD_GENERATOR_STAR)) : empty(), name, this.sep(Sep.AFTER_METHOD_NAME), this.paren(params, Sep.PARAMETERS_PAREN_BEFORE, Sep.PARAMETERS_PAREN_AFTER, Sep.PARAMETERS_PAREN_EMPTY), this.sep(Sep.BEFORE_METHOD_BODY), this.brace(body, node, Sep.METHOD_BRACE_INTIAL, Sep.METHOD_BRACE_FINAL, Sep.METHOD_BRACE_EMPTY));
  }

  reduceModule(node, { directives, items }) {
    if (items.length) {
      items[0] = this.parenToAvoidBeingDirective(node.items[0], items[0]);
    }
    return seq(...directives, directives.length ? this.sep(Sep.AFTER_MODULE_DIRECTIVES) : empty(), ...items);
  }

  reduceNewExpression(node, { callee, arguments: args }) {
    const parenthizedArgs = args.map((a, i) => this.p(node.arguments[i], Precedence.Assignment, a));
    let calleeRep = getPrecedence(node.callee) === Precedence.Call ? this.paren(callee, Sep.NEW_CALLEE_PAREN_BEFORE, Sep.NEW_CALLEE_PAREN_AFTER) :
      this.p(node.callee, getPrecedence(node), callee);
    return seq(this.t('new'), this.sep(Sep.AFTER_NEW), calleeRep, args.length === 0 ? this.sep(Sep.EMPTY_NEW_CALL) : seq(this.sep(Sep.BEFORE_NEW_ARGS), this.paren(this.commaSep(parenthizedArgs, Sep.ARGS_BEFORE_COMMA, Sep.ARGS_AFTER_COMMA), Sep.NEW_PAREN_BEFORE, Sep.NEW_PAREN_AFTER, Sep.NEW_PAREN_EMPTY)));
  }

  reduceNewTargetExpression() {
    return seq(this.t('new'), this.sep(Sep.NEW_TARGET_BEFORE_DOT), this.t('.'), this.sep(Sep.NEW_TARGET_AFTER_DOT), this.t('target'));
  }

  reduceObjectExpression(node, { properties }) {
    let state = this.brace(this.commaSep(properties, Sep.OBJECT_BEFORE_COMMA, Sep.OBJECT_AFTER_COMMA), node, Sep.OBJECT_BRACE_INITIAL, Sep.OBJECT_BRACE_FINAL, Sep.OBJECT_EMPTY);
    state.startsWithCurly = true;
    return state;
  }

  reduceUpdateExpression(node, { operand }) {
    if (node.isPrefix) {
      return this.reduceUnaryExpression(...arguments);
    }
    return objectAssign(
      seq(this.p(node.operand, Precedence.New, operand), this.sep(Sep.BEFORE_POSTFIX(node.operator)), this.t(node.operator)),
      {
        startsWithCurly: operand.startsWithCurly,
        startsWithLetSquareBracket: operand.startsWithLetSquareBracket,
        startsWithFunctionOrClass: operand.startsWithFunctionOrClass,
      }
    );

  }

  reduceUnaryExpression(node, { operand }) {
    return seq(this.t(node.operator), this.sep(Sep.UNARY(node.operator)), this.p(node.operand, getPrecedence(node), operand));
  }

  reduceReturnStatement(node, { expression }) {
    return seq(this.t('return'), expression ? seq(this.sep(Sep.RETURN), expression) : empty(), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceScript(node, { directives, statements }) {
    if (statements.length) {
      statements[0] = this.parenToAvoidBeingDirective(node.statements[0], statements[0]);
    }
    return seq(...directives, directives.length ? this.sep(Sep.AFTER_SCRIPT_DIRECTIVES) : empty(), ...statements);
  }

  reduceSetter(node, { name, param, body }) {
    return seq(this.t('set'), this.sep(Sep.AFTER_SET), name, this.sep(Sep.BEFORE_SET_PARAMS), this.paren(param, Sep.SETTER_PARAM_BEFORE, Sep.SETTER_PARAM_AFTER), this.sep(Sep.BEFORE_SET_BODY), this.brace(body, node, Sep.SET_BRACE_INTIIAL, Sep.SET_BRACE_FINAL, Sep.SET_BRACE_EMPTY));
  }

  reduceShorthandProperty(node, { name }) {
    return name;
  }

  reduceStaticMemberAssignmentTarget(node, { object }) {
    const state = seq(this.p(node.object, getPrecedence(node), object), this.sep(Sep.BEFORE_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT), this.t('.'), this.sep(Sep.AFTER_STATIC_MEMBER_ASSIGNMENT_TARGET_DOT), this.t(node.property));
    state.startsWithLet = object.startsWithLet;
    state.startsWithCurly = object.startsWithCurly;
    state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
    state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
    return state;
  }

  reduceStaticMemberExpression(node, { object }) {
    const state = seq(this.p(node.object, getPrecedence(node), object), this.sep(Sep.BEFORE_STATIC_MEMBER_DOT), this.t('.'), this.sep(Sep.AFTER_STATIC_MEMBER_DOT), this.t(node.property));
    state.startsWithLet = object.startsWithLet;
    state.startsWithCurly = object.startsWithCurly;
    state.startsWithLetSquareBracket = object.startsWithLetSquareBracket;
    state.startsWithFunctionOrClass = object.startsWithFunctionOrClass;
    return state;
  }

  reduceStaticPropertyName(node) {
    if (keyword.isIdentifierNameES6(node.value)) {
      return this.t(node.value);
    }
    let n = parseFloat(node.value);
    if (n >= 0 && n.toString() === node.value) {
      return new NumberCodeRep(n);
    }
    return this.t(escapeStringLiteral(node.value));
  }

  reduceSuper() {
    return this.t('super');
  }

  reduceSwitchCase(node, { test, consequent }) {
    return seq(this.t('case'), this.sep(Sep.BEFORE_CASE_TEST), test, this.sep(Sep.AFTER_CASE_TEST), this.t(':'), this.sep(Sep.BEFORE_CASE_BODY), seq(...consequent), this.sep(Sep.AFTER_CASE_BODY));
  }

  reduceSwitchDefault(node, { consequent }) {
    return seq(this.t('default'), this.sep(Sep.DEFAULT), this.t(':'), this.sep(Sep.BEFORE_CASE_BODY), seq(...consequent), this.sep(Sep.AFTER_DEFAULT_BODY));
  }

  reduceSwitchStatement(node, { discriminant, cases }) {
    return seq(this.t('switch'), this.sep(Sep.BEFORE_SWITCH_DISCRIM), this.paren(discriminant, Sep.SWITCH_DISCRIM_PAREN_BEFORE, Sep.SWITCH_DISCRIM_PAREN_AFTER), this.sep(Sep.BEFORE_SWITCH_BODY), this.brace(seq(...cases), node, Sep.SWITCH_BRACE_INTIAL, Sep.SWITCH_BRACE_FINAL, Sep.SWITCH_BRACE_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceSwitchStatementWithDefault(node, { discriminant, preDefaultCases, defaultCase, postDefaultCases }) {
    return seq(
      this.t('switch'),
      this.sep(Sep.BEFORE_SWITCH_DISCRIM), this.paren(discriminant, Sep.SWITCH_DISCRIM_PAREN_BEFORE, Sep.SWITCH_DISCRIM_PAREN_AFTER), this.sep(Sep.BEFORE_SWITCH_BODY),
      this.brace(seq(...preDefaultCases, defaultCase, ...postDefaultCases), node, Sep.SWITCH_BRACE_INTIAL, Sep.SWITCH_BRACE_FINAL, Sep.SWITCH_BRACE_EMPTY), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceTemplateExpression(node, { tag, elements }) {
    let state = node.tag == null ? empty() : seq(this.p(node.tag, getPrecedence(node), tag), this.sep(Sep.TEMPLATE_TAG));
    state = seq(state, this.t('`'));
    for (let i = 0, l = node.elements.length; i < l; ++i) {
      if (node.elements[i].type === 'TemplateElement') {
        let d = '';
        if (i > 0) d += '}';
        d += node.elements[i].rawValue;
        if (i < l - 1) d += '${';
        state = seq(state, this.t(d));
      } else {
        state = seq(state, this.sep(Sep.BEFORE_TEMPLATE_EXPRESSION), elements[i], this.sep(Sep.AFTER_TEMPLATE_EXPRESSION));
      }
    }
    state = seq(state, this.t('`'));
    if (node.tag != null) {
      state.startsWithCurly = tag.startsWithCurly;
      state.startsWithLet = tag.startsWithLet;
      state.startsWithLetSquareBracket = tag.startsWithLetSquareBracket;
      state.startsWithFunctionOrClass = tag.startsWithFunctionOrClass;
    }
    return state;
  }

  reduceTemplateElement(node) {
    return this.t(node.rawValue);
  }

  reduceThisExpression(/* node */) {
    return this.t('this');
  }

  reduceThrowStatement(node, { expression }) {
    return seq(this.t('throw'), this.sep(Sep.THROW), expression, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceTryCatchStatement(node, { body, catchClause }) {
    return seq(this.t('try'), this.sep(Sep.AFTER_TRY), body, this.sep(Sep.BEFORE_CATCH), catchClause, this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceTryFinallyStatement(node, { body, catchClause, finalizer }) {
    return seq(this.t('try'), this.sep(Sep.AFTER_TRY), body, catchClause ? seq(this.sep(Sep.BEFORE_CATCH), catchClause) : empty(), this.sep(Sep.BEFORE_FINALLY), this.t('finally'), this.sep(Sep.AFTER_FINALLY), finalizer, this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceYieldExpression(node, { expression }) {
    if (node.expression == null) return this.t('yield');
    return objectAssign(seq(this.t('yield'), this.sep(Sep.YIELD), this.p(node.expression, getPrecedence(node), expression)), { containsIn: expression.containsIn });
  }

  reduceYieldGeneratorExpression(node, { expression }) {
    return objectAssign(seq(this.t('yield'), this.sep(Sep.BEFORE_YIELD_STAR), this.t('*'), this.sep(Sep.AFTER_YIELD_STAR), this.p(node.expression, getPrecedence(node), expression)), { containsIn: expression.containsIn });
  }

  reduceDirective(node) {
    let delim = node.rawValue.match(/(^|[^\\])(\\\\)*"/) ? '\'' : '"';
    return seq(this.t(delim + node.rawValue + delim), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceVariableDeclaration(node, { declarators }) {
    return seq(this.t(node.kind), this.sep(Sep.VARIABLE_DECLARATION), this.commaSep(declarators, Sep.DECLARATORS_BEFORE_COMMA, Sep.DECLARATORS_AFTER_COMMA));
  }

  reduceVariableDeclarationStatement(node, { declaration }) {
    return seq(declaration, this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceVariableDeclarator(node, { binding, init }) {
    let containsIn = init && init.containsIn && !init.containsGroup;
    if (init) {
      if (init.containsGroup) {
        init = this.paren(init, Sep.EXPRESSION_PAREN_BEFORE, Sep.EXPRESSION_PAREN_AFTER);
      } else {
        init = markContainsIn(init);
      }
    }
    return objectAssign(init == null ? binding : seq(binding, this.sep(Sep.BEFORE_INIT_EQUALS), this.t('='), this.sep(Sep.AFTER_INIT_EQUALS), init), { containsIn });
  }

  reduceWhileStatement(node, { test, body }) {
    return objectAssign(seq(this.t('while'), this.sep(Sep.AFTER_WHILE), this.paren(test, Sep.WHILE_TEST_PAREN_BEFORE, Sep.WHILE_TEST_PAREN_AFTER), this.sep(Sep.BEFORE_WHILE_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))), { endsWithMissingElse: body.endsWithMissingElse });
  }

  reduceWithStatement(node, { object, body }) {
    return objectAssign(
      seq(this.t('with'), this.sep(Sep.AFTER_WITH), this.paren(object, Sep.WITH_PAREN_BEFORE, Sep.WITH_PAREN_AFTER), this.sep(Sep.BEFORE_WITH_BODY), body, this.sep(Sep.AFTER_STATEMENT(node))),
      { endsWithMissingElse: body.endsWithMissingElse });
  }
}


function withoutTrailingLinebreak(state) {
  if (state && state instanceof Seq) {
    let lastChild = state.children[state.children.length - 1];
    /* istanbul ignore next */
    while (lastChild instanceof Empty) {
      state.children.pop();
      lastChild = state.children[state.children.length - 1];
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

class FormattedCodeGen extends ExtensibleCodeGen {
  parenToAvoidBeingDirective(element, original) {
    if (element && element.type === 'ExpressionStatement' && element.expression.type === 'LiteralStringExpression') {
      return seq(this.paren(original.children[0], Sep.PAREN_AVOIDING_DIRECTIVE_BEFORE, Sep.PAREN_AVOIDING_DIRECTIVE_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(element)));
    }
    return original;
  }

  brace(rep, node) {
    if (isEmpty(rep)) {
      return this.t('{}');
    }

    switch (node.type) {
      case 'ObjectAssignmentTarget':
      case 'ObjectBinding':
      case 'Import':
      case 'ExportFrom':
      case 'ExportLocals':
      case 'ObjectExpression':
        return new Brace(rep);
    }

    rep = seq(new Linebreak, rep);
    indent(rep, false);
    return new Brace(rep);
  }

  reduceDoWhileStatement(node, { body, test }) {
    return seq(this.t('do'), this.sep(Sep.AFTER_DO), withoutTrailingLinebreak(body), this.sep(Sep.BEFORE_DOWHILE_WHILE), this.t('while'), this.sep(Sep.AFTER_DOWHILE_WHILE), this.paren(test, Sep.DO_WHILE_TEST_PAREN_BEFORE, Sep.DO_WHILE_TEST_PAREN_AFTER), this.semiOp(), this.sep(Sep.AFTER_STATEMENT(node)));
  }

  reduceIfStatement(node, { test, consequent, alternate }) {
    if (alternate && consequent.endsWithMissingElse) {
      consequent = this.brace(consequent, node);
    }
    return objectAssign(
      seq(this.t('if'), this.sep(Sep.AFTER_IF),
        this.paren(test, Sep.IF_PAREN_BEFORE, Sep.IF_PAREN_AFTER), this.sep(Sep.AFTER_IF_TEST),
        withoutTrailingLinebreak(consequent),
        alternate ? seq(this.sep(Sep.BEFORE_ELSE), this.t('else'), this.sep(Sep.AFTER_ELSE), withoutTrailingLinebreak(alternate)) : empty(),
        this.sep(Sep.AFTER_STATEMENT(node))),
      { endsWithMissingElse: alternate ? alternate.endsWithMissingElse : true });
  }

  reduceSwitchCase(node, { test, consequent }) {
    consequent = indent(withoutTrailingLinebreak(seq(this.sep(Sep.BEFORE_CASE_BODY), ...consequent)), true);
    return seq(this.t('case'), this.sep(Sep.BEFORE_CASE_TEST), test, this.sep(Sep.AFTER_CASE_TEST), this.t(':'),
      consequent, this.sep(Sep.AFTER_CASE_BODY));
  }

  reduceSwitchDefault(node, { consequent }) {
    consequent = indent(withoutTrailingLinebreak(seq(this.sep(Sep.BEFORE_CASE_BODY), ...consequent)), true);
    return seq(this.t('default'), this.sep(Sep.DEFAULT), this.t(':'),
      consequent, this.sep(Sep.AFTER_DEFAULT_BODY));
  }

  sep(separator) {
    switch (separator.type) {
      case 'AWAIT':
      case 'AFTER_FORAWAIT_AWAIT':
      case 'ARRAY_AFTER_COMMA':
      case 'OBJECT_AFTER_COMMA':
      case 'ARGS_AFTER_COMMA':
      case 'PARAMETER_AFTER_COMMA':
      case 'DECLARATORS_AFTER_COMMA':
      case 'NAMED_IMPORT_AFTER_COMMA':
      case 'IMPORT_AFTER_COMMA':
      case 'BEFORE_DEFAULT_EQUALS':
      case 'AFTER_DEFAULT_EQUALS':
      case 'AFTER_PROP':
      case 'BEFORE_JUMP_LABEL':
      case 'BEFORE_CATCH_BINDING':
      case 'AFTER_CATCH_BINDING':
      case 'BEFORE_CLASS_NAME':
      case 'BEFORE_EXTENDS':
      case 'AFTER_EXTENDS':
      case 'BEFORE_CLASS_DECLARATION_ELEMENTS':
      case 'BEFORE_CLASS_EXPRESSION_ELEMENTS':
      case 'AFTER_STATIC':
      case 'BEFORE_TERNARY_QUESTION':
      case 'AFTER_TERNARY_QUESTION':
      case 'BEFORE_TERNARY_COLON':
      case 'AFTER_TERNARY_COLON':
      case 'AFTER_DO':
      case 'BEFORE_DOWHILE_WHILE':
      case 'AFTER_DOWHILE_WHILE':
      case 'AFTER_FORIN_FOR':
      case 'BEFORE_FORIN_IN':
      case 'BEFORE_FORIN_BODY':
      case 'BEFORE_FOROF_OF':
      case 'AFTER_FOROF_FOR':
      case 'BEFORE_FOROF_BODY':
      case 'AFTER_FOR_FOR':
      case 'BEFORE_FOR_TEST':
      case 'BEFORE_FOR_UPDATE':
      case 'BEFORE_FOR_BODY':
      case 'BEFORE_FUNCTION_DECLARATION_BODY':
      case 'BEFORE_FUNCTION_EXPRESSION_BODY':
      case 'BEFORE_ARROW':
      case 'AFTER_ARROW':
      case 'BEFORE_ARROW_ASYNC_PARAMS':
      case 'AFTER_GET':
      case 'BEFORE_GET_BODY':
      case 'AFTER_IF':
      case 'AFTER_IF_TEST':
      case 'BEFORE_ELSE':
      case 'AFTER_ELSE':
      case 'BEFORE_IMPORT_BINDINGS':
      case 'BEFORE_IMPORT_MODULE':
      case 'AFTER_IMPORT_BINDINGS':
      case 'AFTER_FROM':
      case 'BEFORE_IMPORT_NAMESPACE':
      case 'BEFORE_IMPORT_STAR':
      case 'AFTER_IMPORT_STAR':
      case 'AFTER_NAMESPACE_BINDING':
      case 'BEFORE_IMPORT_AS':
      case 'AFTER_IMPORT_AS':
      case 'EXPORTS_AFTER_COMMA':
      case 'BEFORE_EXPORT_STAR':
      case 'AFTER_EXPORT_STAR':
      case 'BEFORE_EXPORT_BINDINGS':
      case 'AFTER_EXPORT_FROM_BINDINGS':
      case 'AFTER_EXPORT':
      case 'AFTER_EXPORT_DEFAULT':
      case 'BEFORE_EXPORT_AS':
      case 'AFTER_EXPORT_AS':
      case 'AFTER_LABEL_COLON':
      case 'AFTER_METHOD_ASYNC':
      case 'BEFORE_METHOD_BODY':
      case 'AFTER_NEW':
      case 'RETURN':
      case 'AFTER_SET':
      case 'BEFORE_SET_BODY':
      case 'BEFORE_SET_PARAMS':
      case 'BEFORE_CASE_TEST':
      case 'BEFORE_SWITCH_DISCRIM':
      case 'BEFORE_SWITCH_BODY':
      case 'THROW':
      case 'AFTER_TRY':
      case 'BEFORE_CATCH':
      case 'BEFORE_FINALLY':
      case 'AFTER_FINALLY':
      case 'VARIABLE_DECLARATION':
      case 'YIELD':
      case 'AFTER_YIELD_STAR':
      case 'BEFORE_INIT_EQUALS':
      case 'AFTER_INIT_EQUALS':
      case 'AFTER_WHILE':
      case 'BEFORE_WHILE_BODY':
      case 'AFTER_WITH':
      case 'BEFORE_WITH_BODY':
      case 'BEFORE_FUNCTION_NAME':
      case 'AFTER_BINOP':
      case 'BEFORE_ASSIGN_OP':
      case 'AFTER_ASSIGN_OP':
        return this.t(' ');
      case 'AFTER_STATEMENT':
        switch (separator.node.type) {
          case 'ForInStatement':
          case 'ForOfStatement':
          case 'ForStatement':
          case 'WhileStatement':
          case 'WithStatement':
            return empty(); // because those already end with an AFTER_STATEMENT
          default:
            return new Linebreak;
        }
      case 'AFTER_CLASS_ELEMENT':
      case 'BEFORE_CASE_BODY':
      case 'AFTER_CASE_BODY':
      case 'AFTER_DEFAULT_BODY':
        return new Linebreak;
      case 'BEFORE_BINOP':
        return separator.op === ',' ? empty() : this.t(' ');
      case 'UNARY':
        return separator.op === 'delete' || separator.op === 'void' || separator.op === 'typeof' ? this.t(' ') : empty();
      default:
        return empty();
    }
  }
}

module.exports = {
  Sep,
  ExtensibleCodeGen,
  FormattedCodeGen,
};
