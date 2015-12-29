import reduce from "shift-reducer";
import {TokenStream} from "./token_stream";
import MinimalCodeGen from "./minimal-codegen";

export default function codeGen(script, generator = new MinimalCodeGen) {
  let ts = new TokenStream;
  let rep = reduce(generator, script);
  rep.emit(ts);
  return ts.result;
}

export {default as MinimalCodeGen} from "./minimal-codegen";
export {ExtensibleCodeGen, FormattedCodeGen, Sep} from "./formatted-codegen";
export {Precedence, getPrecedence, escapeStringLiteral, CodeRep, Empty, Token, NumberCodeRep, Paren, Bracket, Brace, NoIn, ContainsIn, Seq, Semi, CommaSep, SemiOp} from "./coderep";
