const reduce = require('shift-reducer').default;
const { TokenStream } = require('./token-stream');
const MinimalCodeGen = require('./minimal-codegen');

function codeGen(script, generator = new MinimalCodeGen) {
  let ts = new TokenStream;
  let rep = reduce(generator, script);
  rep.emit(ts);
  return ts.result;
}

const { ExtensibleCodeGen, FormattedCodeGen, Sep } = require('./formatted-codegen');
const { Precedence, getPrecedence, escapeStringLiteral, CodeRep, Empty, Token, NumberCodeRep, Paren, Bracket, Brace, NoIn, ContainsIn, Seq, Semi, CommaSep, SemiOp } = require('./coderep');
const codeGenWithLocation = require('./with-location');

module.exports = {
  default: codeGen,
  codeGen,
  MinimalCodeGen,
  ExtensibleCodeGen,
  FormattedCodeGen,
  Sep,
  Precedence,
  getPrecedence,
  escapeStringLiteral,
  CodeRep,
  Empty,
  Token,
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
  codeGenWithLocation,
};
