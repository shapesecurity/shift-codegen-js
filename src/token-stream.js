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

import { idContinueLargeRegex, idContinueBool } from './unicode';

function isIdentifierPartES6(char) {
  let charCode = char.charCodeAt(0);
  if (charCode < 128) {
    return idContinueBool[charCode];
  }
  return idContinueLargeRegex.test(char);
}

export function needsDoubleDot(fragment) {
  return fragment.indexOf('.') < 0 && fragment.indexOf('e') < 0 && fragment.indexOf('x') < 0;
}

function renderNumber(n) {
  let s;
  if (n >= 1e3 && n % 10 === 0) {
    s = n.toString(10);
    if (/[eE]/.test(s)) {
      return s.replace(/[eE]\+/, 'e');
    }
    return n.toString(10).replace(/0{3,}$/, match => {
      return 'e' + match.length;
    });
  } else if (n % 1 === 0) {
    if (n > 1e15 && n < 1e20) {
      return '0x' + n.toString(16).toUpperCase();
    }
    return n.toString(10).replace(/[eE]\+/, 'e');
  }
  return n.toString(10).replace(/^0\./, '.').replace(/[eE]\+/, 'e');

}

export class TokenStream {
  constructor() {
    this.result = '';
    this.lastNumber = null;
    this.lastCodePoint = null;
    this.lastTokenStr = '';
    this.optionalSemi = false;
    this.previousWasRegExp = false;
    this.partialHtmlComment = false;
  }

  putNumber(number) {
    let tokenStr = renderNumber(number);
    this.put(tokenStr);
    this.lastNumber = tokenStr;
  }

  putOptionalSemi() {
    this.optionalSemi = true;
  }

  putRaw(tokenStr) {
    this.result += tokenStr;
    this.lastTokenStr = tokenStr;
  }

  put(tokenStr, isRegExp) {
    if (this.optionalSemi) {
      this.optionalSemi = false;
      if (tokenStr !== '}') {
        this.result += ';';
        this.lastCodePoint = ';';
        this.previousWasRegExp = false;
      }
    }
    if (this.lastNumber !== null && tokenStr.length === 1) {
      if (tokenStr === '.') {
        this.result += needsDoubleDot(this.lastNumber) ? '..' : '.';
        this.lastNumber = null;
        this.lastCodePoint = '.';
        return;
      }
    }
    let tokenStrCodePointCount = [...tokenStr].length; // slow, no unicode length?
    if (tokenStrCodePointCount > 0) {
      this.lastNumber = null;
      let rightCodePoint = String.fromCodePoint(tokenStr.codePointAt(0));
      let lastCodePoint = this.lastCodePoint;
      this.lastCodePoint = String.fromCodePoint(tokenStr.codePointAt(tokenStrCodePointCount - 1));
      let previousWasRegExp = this.previousWasRegExp;
      this.previousWasRegExp = isRegExp;

      if (lastCodePoint &&
          ((lastCodePoint === '+' || lastCodePoint === '-') &&
          lastCodePoint === rightCodePoint ||
          isIdentifierPartES6(lastCodePoint) && isIdentifierPartES6(rightCodePoint) ||
          lastCodePoint === '/' && rightCodePoint === '/' ||
          previousWasRegExp && rightCodePoint === 'i' ||
          this.partialHtmlComment && tokenStr.startsWith('--'))) {
        this.result += ' ';
      }
    }

    this.partialHtmlComment = this.lastTokenStr.endsWith('<') && tokenStr === '!';

    this.result += tokenStr;
    this.lastTokenStr = tokenStr;
  }
}
