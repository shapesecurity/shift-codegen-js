const { reduce, adapt } = require('shift-reducer');
const { TokenStream, needsDoubleDot } = require('./token-stream');
const MinimalCodeGen = require('./minimal-codegen');

function mightHaveSemi(type) {
  return /(Import)|(Export)|(Statement)|(Directive)|(SwitchCase)|(SwitchDefault)/.test(type);
}

class TokenStreamWithLocation extends TokenStream {
  constructor() {
    super();
    this.line = 1;
    this.column = 0;
    this.startingNodes = [];
    this.finishingStatements = [];
    this.lastNumberNode = null;
    this.locations = new WeakMap;
  }

  putRaw(tokenStr) {
    let previousLength = this.result.length;
    super.putRaw(tokenStr);
    this.startNodes(tokenStr, previousLength);
  }

  put(tokenStr, isRegExp) {
    if (this.optionalSemi && tokenStr !== '}') {
      for (let obj of this.finishingStatements) {
        ++obj.end.column;
        ++obj.end.offset;
      }
    }
    this.finishingStatements = [];

    if (this.lastNumber !== null && tokenStr === '.' && needsDoubleDot(this.lastNumber)) {
      let loc = this.locations.get(this.lastNumberNode).end;
      ++loc.column;
      ++loc.offset;
    }
    this.lastNumberNode = null;

    let previousLength = this.result.length;
    super.put(tokenStr, isRegExp);
    this.startNodes(tokenStr, previousLength);
  }

  startNodes(tokenStr, previousLength) {
    let linebreakRegex = /\r\n?|[\n\u2028\u2029]/g;
    let matched = false;
    let match;
    let startLine = this.line;
    let startColumn = this.column;
    while ((match = linebreakRegex.exec(tokenStr))) {
      ++this.line;
      this.column = tokenStr.length - match.index - match[0].length;
      matched = true;
    }

    if (!matched) {
      this.column += this.result.length - previousLength;
      startColumn = this.column - tokenStr.length; // i.e., skip past any additional characters which were necessitated by, but not part of, this part
    }
    for (const node of this.startingNodes) {
      this.locations.set(node, {
        start: {
          line: startLine,
          column: startColumn,
          offset: this.result.length - tokenStr.length,
        },
        end: null,
      });
    }
    this.startingNodes = [];
  }

  startEmit(node) {
    this.startingNodes.push(node);
  }

  finishEmit(node) {
    this.locations.get(node).end = {
      line: this.line,
      column: this.column,
      offset: this.result.length,
    };
    if (mightHaveSemi(node.type)) {
      this.finishingStatements.push(this.locations.get(node));
    }
  }
}

function addLocation(rep, node) {
  const originalEmit = rep.emit.bind(rep);
  if (node.type === 'Script' || node.type === 'Module') {
    // These are handled specially: they include beginning and trailing whitespace.
    rep.emit = (ts, ...args) => {
      ts.locations.set(node, {
        start: {
          line: 1,
          column: 0,
          offset: 0,
        },
        end: null,
      });
      originalEmit(ts, ...args);
      ts.locations.get(node).end = {
        line: ts.line,
        column: ts.column,
        offset: ts.result.length,
      };
    };
  } else if (node.type === 'LiteralNumericExpression') {
    rep.emit = (ts, ...args) => {
      ts.startEmit(node);
      originalEmit(ts, ...args);
      ts.finishEmit(node);
      ts.lastNumberNode = node;
    };
  } else {
    rep.emit = (ts, ...args) => {
      ts.startEmit(node);
      originalEmit(ts, ...args);
      ts.finishEmit(node);
    };
  }
  return rep;
}

function addLocationToReducer(reducer) {
  const wrapped = adapt(addLocation, reducer);

  const originalRegenerate = wrapped.regenerateArrowParams.bind(wrapped);
  wrapped.regenerateArrowParams = function (element, original) {
    const out = originalRegenerate(element, original);
    if (out !== original) {
      addLocation(out, element);
    }
    return out;
  };

  const originalDirective = wrapped.parenToAvoidBeingDirective.bind(wrapped);
  wrapped.parenToAvoidBeingDirective = function (element, original) {
    const out = originalDirective(element, original);
    if (out !== original) {
      addLocation(out, element);
    }
    return out;
  };

  return wrapped;
}

function codeGenWithLocation(program, generator = new MinimalCodeGen) {
  let ts = new TokenStreamWithLocation;
  let rep = reduce(addLocationToReducer(generator), program);
  rep.emit(ts);
  return { source: ts.result, locations: ts.locations };
}

module.exports = codeGenWithLocation;
