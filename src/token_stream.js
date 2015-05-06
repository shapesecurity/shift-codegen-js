/**
 * Copyright 2014 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {code} from "esutils";

function numberDot(fragment) {
  if (fragment.indexOf(".") < 0 && fragment.indexOf("e") < 0) {
    return "..";
  }
  return ".";
}

export class TokenStream {
  constructor() {
    this.result = "";
    this.lastNumber = null;
    this.lastChar = null;
    this.optionalSemi = false;
  }

  putNumber(number) {
    let tokenStr = number.toString();
    this.put(tokenStr);
    this.lastNumber = tokenStr;
  }

  putOptionalSemi() {
    this.optionalSemi = true;
  }

  put(tokenStr) {
    if (this.optionalSemi) {
      this.optionalSemi = false;
      if (tokenStr !== "}") {
        this.put(";");
      }
    }
    if (this.lastNumber !== null && tokenStr.length == 1) {
      if (tokenStr === ".") {
        this.result += numberDot(this.lastNumber);
        this.lastNumber = null;
        this.lastChar = ".";
        return;
      }
    }
    this.lastNumber = null;
    let rightChar = tokenStr.charAt(0);
    let lastChar = this.lastChar;
    this.lastChar = tokenStr.charAt(tokenStr.length - 1);
    if (lastChar &&
        ((lastChar == "+" || lastChar == "-") &&
        lastChar == rightChar ||
        code.isIdentifierPartES6(lastChar.charCodeAt(0)) && code.isIdentifierPartES6(rightChar.charCodeAt(0)) ||
        lastChar == "/" && rightChar == "i")) {
      this.result += " ";
    }

    this.result += tokenStr;
  }
}
