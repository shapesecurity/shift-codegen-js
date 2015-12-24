import reduce from "shift-reducer";
import {TokenStream} from "./token_stream";
import MinimalCodeGen from "./minimal-codegen";

export default function codeGen(script, generator = new MinimalCodeGen) {
  let ts = new TokenStream;
  let rep = reduce(generator, script);
  rep.emit(ts);
  return ts.result;
}

export {MinimalCodeGen} from "./minimal-codegen";
export {ExtensibleCodeGen, FormattedCodeGen} from "./formatted-codegen";
