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
  Exponential: 13,
  Prefix: 14,
  Postfix: 15,
  New: 16,
  Call: 17,
  TaggedTemplate: 18,
  Member: 19,
  Primary: 20,
};

const BinaryPrecedence = {
  ',': Precedence.Sequence,
  '||': Precedence.LogicalOR,
  '&&': Precedence.LogicalAND,
  '|': Precedence.BitwiseOR,
  '^': Precedence.BitwiseXOR,
  '&': Precedence.BitwiseAND,
  '==': Precedence.Equality,
  '!=': Precedence.Equality,
  '===': Precedence.Equality,
  '!==': Precedence.Equality,
  '<': Precedence.Relational,
  '>': Precedence.Relational,
  '<=': Precedence.Relational,
  '>=': Precedence.Relational,
  'in': Precedence.Relational,
  'instanceof': Precedence.Relational,
  '<<': Precedence.BitwiseSHIFT,
  '>>': Precedence.BitwiseSHIFT,
  '>>>': Precedence.BitwiseSHIFT,
  '+': Precedence.Additive,
  '-': Precedence.Additive,
  '*': Precedence.Multiplicative,
  '%': Precedence.Multiplicative,
  '/': Precedence.Multiplicative,
  '**': Precedence.Exponential,
};

function getPrecedence(node) {
  switch (node.type) {
    case 'ArrayExpression':
    case 'FunctionExpression':
    case 'ClassExpression':
    case 'IdentifierExpression':
    case 'AssignmentTargetIdentifier':
    case 'NewTargetExpression':
    case 'Super':
    case 'LiteralBooleanExpression':
    case 'LiteralNullExpression':
    case 'LiteralNumericExpression':
    case 'LiteralInfinityExpression':
    case 'LiteralRegExpExpression':
    case 'LiteralStringExpression':
    case 'ObjectExpression':
    case 'ThisExpression':
    case 'SpreadElement':
    case 'FunctionBody':
      return Precedence.Primary;

    case 'ArrowExpression':
    case 'AssignmentExpression':
    case 'CompoundAssignmentExpression':
    case 'YieldExpression':
    case 'YieldGeneratorExpression':
      return Precedence.Assignment;

    case 'ConditionalExpression':
      return Precedence.Conditional;

    case 'ComputedMemberExpression':
    case 'StaticMemberExpression':
    case 'ComputedMemberAssignmentTarget':
    case 'StaticMemberAssignmentTarget':
      switch (node.object.type) {
        case 'CallExpression':
        case 'ComputedMemberExpression':
        case 'StaticMemberExpression':
        case 'TemplateExpression':
          return getPrecedence(node.object);
        default:
          return Precedence.Member;
      }

    case 'TemplateExpression':
      if (node.tag == null) return Precedence.Member;
      switch (node.tag.type) {
        case 'CallExpression':
        case 'ComputedMemberExpression':
        case 'StaticMemberExpression':
        case 'TemplateExpression':
          return getPrecedence(node.tag);
        default:
          return Precedence.Member;
      }

    case 'BinaryExpression':
      return BinaryPrecedence[node.operator];

    case 'CallExpression':
      return Precedence.Call;
    case 'NewExpression':
      return node.arguments.length === 0 ? Precedence.New : Precedence.Member;
    case 'UpdateExpression':
      return node.isPrefix ? Precedence.Prefix : Precedence.Postfix;
    case 'AwaitExpression':
    case 'UnaryExpression':
      return Precedence.Prefix;
    default:
      throw new Error('unreachable: ' + node.type);
  }
}

function escapeStringLiteral(stringValue) {
  let result = '';
  let nSingle = 0, nDouble = 0;
  for (let i = 0, l = stringValue.length; i < l; ++i) {
    let ch = stringValue[i];
    if (ch === '"') {
      ++nDouble;
    } else if (ch === '\'') {
      ++nSingle;
    }
  }
  let delim = nDouble > nSingle ? '\'' : '"';
  result += delim;
  for (let i = 0; i < stringValue.length; i++) {
    let ch = stringValue.charAt(i);
    switch (ch) {
      case delim:
        result += '\\' + delim;
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\\':
        result += '\\\\';
        break;
      case '\u2028':
        result += '\\u2028';
        break;
      case '\u2029':
        result += '\\u2029';
        break;
      default:
        result += ch;
        break;
    }
  }
  result += delim;
  return result;
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
  constructor(token, isRegExp = false) {
    super();
    this.token = token;
    this.isRegExp = isRegExp;
  }

  emit(ts) {
    ts.put(this.token, this.isRegExp);
  }
}

class RawToken extends CodeRep {
  constructor(token) {
    super();
    this.token = token;
  }

  emit(ts) {
    ts.putRaw(this.token);
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
    ts.put('(');
    this.expr.emit(ts, false);
    ts.put(')');
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
    ts.put('[');
    this.expr.emit(ts, false);
    ts.put(']');
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
    ts.put('{');
    this.expr.emit(ts, false);
    ts.put('}');
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
      ts.put('(');
      this.expr.emit(ts, false);
      ts.put(')');
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
    super(';');
  }
}

class CommaSep extends CodeRep {
  constructor(children) {
    super();
    this.children = children;
  }

  emit(ts, noIn) {
    let first = true;
    this.children.forEach(cr => {
      if (first) {
        first = false;
      } else {
        ts.put(',');
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

module.exports = {
  Precedence,
  getPrecedence,
  escapeStringLiteral,
  CodeRep,
  Empty,
  Token,
  RawToken,
  NumberCodeRep,
  Paren,
  Bracket,
  Brace,
  NoIn,
  ContainsIn,
  Seq,
  Semi,
  CommaSep,
  SemiOp,
};
