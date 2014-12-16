"use strict";

var code = require("esutils").code;


function numberDot(fragment) {
  if (fragment.indexOf(".") < 0 && fragment.indexOf("e") < 0) {
    return "..";
  }
  return ".";
}

var TokenStream = (function () {
  var TokenStream = function TokenStream() {
    this.result = "";
    this.lastNumber = null;
    this.lastChar = null;
    this.optionalSemi = false;
  };

  TokenStream.prototype.putNumber = function (number) {
    var tokenStr = number.toString();
    this.put(tokenStr);
    this.lastNumber = tokenStr;
  };

  TokenStream.prototype.putOptionalSemi = function () {
    this.optionalSemi = true;
  };

  TokenStream.prototype.put = function (tokenStr) {
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
    var rightChar = tokenStr.charAt(0);
    var lastChar = this.lastChar;
    this.lastChar = tokenStr.charAt(tokenStr.length - 1);
    if (lastChar && ((lastChar == "+" || lastChar == "-") && lastChar == rightChar || code.isIdentifierPart(lastChar.charCodeAt(0)) && code.isIdentifierPart(rightChar.charCodeAt(0)) || lastChar == "/" && rightChar == "i")) {
      this.result += " ";
    }

    this.result += tokenStr;
  };

  return TokenStream;
})();

exports.TokenStream = TokenStream;