"use strict";

// istanbul ignore next
var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

// istanbul ignore next
var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

var code = require("esutils").code;


function numberDot(fragment) {
  if (fragment.indexOf(".") < 0 && fragment.indexOf("e") < 0) {
    return "..";
  }
  return ".";
}

var TokenStream = exports.TokenStream = (function () {
  function TokenStream() {
    _classCallCheck(this, TokenStream);

    this.result = "";
    this.lastNumber = null;
    this.lastChar = null;
    this.optionalSemi = false;
  }

  _prototypeProperties(TokenStream, null, {
    putNumber: {
      value: function putNumber(number) {
        var tokenStr = number.toString();
        this.put(tokenStr);
        this.lastNumber = tokenStr;
      },
      writable: true,
      configurable: true
    },
    putOptionalSemi: {
      value: function putOptionalSemi() {
        this.optionalSemi = true;
      },
      writable: true,
      configurable: true
    },
    put: {
      value: function put(tokenStr) {
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
      },
      writable: true,
      configurable: true
    }
  });

  return TokenStream;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90b2tlbl9zdHJlYW0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZ0JRLElBQUksV0FBTyxTQUFTLEVBQXBCLElBQUk7OztBQUVaLFNBQVMsU0FBUyxDQUFDLFFBQVEsRUFBRTtBQUMzQixNQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzFELFdBQU8sSUFBSSxDQUFDO0dBQ2I7QUFDRCxTQUFPLEdBQUcsQ0FBQztDQUNaOztJQUVZLFdBQVcsV0FBWCxXQUFXO0FBQ1gsV0FEQSxXQUFXOzBCQUFYLFdBQVc7O0FBRXBCLFFBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFFBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0dBQzNCOzt1QkFOVSxXQUFXO0FBUXRCLGFBQVM7YUFBQSxtQkFBQyxNQUFNLEVBQUU7QUFDaEIsWUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbkIsWUFBSSxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7T0FDNUI7Ozs7QUFFRCxtQkFBZTthQUFBLDJCQUFHO0FBQ2hCLFlBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO09BQzFCOzs7O0FBRUQsT0FBRzthQUFBLGFBQUMsUUFBUSxFQUFFO0FBQ1osWUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ3JCLGNBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBQzFCLGNBQUksUUFBUSxLQUFLLEdBQUcsRUFBRTtBQUNwQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztXQUNmO1NBQ0Y7QUFDRCxZQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQ3BELGNBQUksUUFBUSxLQUFLLEdBQUcsRUFBRTtBQUNwQixnQkFBSSxDQUFDLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFDLGdCQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixnQkFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFDcEIsbUJBQU87V0FDUjtTQUNGO0FBQ0QsWUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsWUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzdCLFlBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3JELFlBQUksUUFBUSxLQUNQLENBQUMsUUFBUSxJQUFJLEdBQUcsSUFBSSxRQUFRLElBQUksR0FBRyxDQUFBLElBQ3BDLFFBQVEsSUFBSSxTQUFTLElBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFDL0YsUUFBUSxJQUFJLEdBQUcsSUFBSSxTQUFTLElBQUksR0FBRyxDQUFBLEFBQUMsRUFBRTtBQUN4QyxjQUFJLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQztTQUNwQjs7QUFFRCxZQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQztPQUN6Qjs7Ozs7O1NBOUNVLFdBQVciLCJmaWxlIjoic3JjL3Rva2VuX3N0cmVhbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2NvZGV9IGZyb20gXCJlc3V0aWxzXCI7XG5cbmZ1bmN0aW9uIG51bWJlckRvdChmcmFnbWVudCkge1xuICBpZiAoZnJhZ21lbnQuaW5kZXhPZihcIi5cIikgPCAwICYmIGZyYWdtZW50LmluZGV4T2YoXCJlXCIpIDwgMCkge1xuICAgIHJldHVybiBcIi4uXCI7XG4gIH1cbiAgcmV0dXJuIFwiLlwiO1xufVxuXG5leHBvcnQgY2xhc3MgVG9rZW5TdHJlYW0ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnJlc3VsdCA9IFwiXCI7XG4gICAgdGhpcy5sYXN0TnVtYmVyID0gbnVsbDtcbiAgICB0aGlzLmxhc3RDaGFyID0gbnVsbDtcbiAgICB0aGlzLm9wdGlvbmFsU2VtaSA9IGZhbHNlO1xuICB9XG5cbiAgcHV0TnVtYmVyKG51bWJlcikge1xuICAgIGxldCB0b2tlblN0ciA9IG51bWJlci50b1N0cmluZygpO1xuICAgIHRoaXMucHV0KHRva2VuU3RyKTtcbiAgICB0aGlzLmxhc3ROdW1iZXIgPSB0b2tlblN0cjtcbiAgfVxuXG4gIHB1dE9wdGlvbmFsU2VtaSgpIHtcbiAgICB0aGlzLm9wdGlvbmFsU2VtaSA9IHRydWU7XG4gIH1cblxuICBwdXQodG9rZW5TdHIpIHtcbiAgICBpZiAodGhpcy5vcHRpb25hbFNlbWkpIHtcbiAgICAgIHRoaXMub3B0aW9uYWxTZW1pID0gZmFsc2U7XG4gICAgICBpZiAodG9rZW5TdHIgIT09IFwifVwiKSB7XG4gICAgICAgIHRoaXMucHV0KFwiO1wiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMubGFzdE51bWJlciAhPT0gbnVsbCAmJiB0b2tlblN0ci5sZW5ndGggPT0gMSkge1xuICAgICAgaWYgKHRva2VuU3RyID09PSBcIi5cIikge1xuICAgICAgICB0aGlzLnJlc3VsdCArPSBudW1iZXJEb3QodGhpcy5sYXN0TnVtYmVyKTtcbiAgICAgICAgdGhpcy5sYXN0TnVtYmVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5sYXN0Q2hhciA9IFwiLlwiO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubGFzdE51bWJlciA9IG51bGw7XG4gICAgbGV0IHJpZ2h0Q2hhciA9IHRva2VuU3RyLmNoYXJBdCgwKTtcbiAgICBsZXQgbGFzdENoYXIgPSB0aGlzLmxhc3RDaGFyO1xuICAgIHRoaXMubGFzdENoYXIgPSB0b2tlblN0ci5jaGFyQXQodG9rZW5TdHIubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGxhc3RDaGFyICYmXG4gICAgICAgICgobGFzdENoYXIgPT0gXCIrXCIgfHwgbGFzdENoYXIgPT0gXCItXCIpICYmXG4gICAgICAgIGxhc3RDaGFyID09IHJpZ2h0Q2hhciB8fFxuICAgICAgICBjb2RlLmlzSWRlbnRpZmllclBhcnQobGFzdENoYXIuY2hhckNvZGVBdCgwKSkgJiYgY29kZS5pc0lkZW50aWZpZXJQYXJ0KHJpZ2h0Q2hhci5jaGFyQ29kZUF0KDApKSB8fFxuICAgICAgICBsYXN0Q2hhciA9PSBcIi9cIiAmJiByaWdodENoYXIgPT0gXCJpXCIpKSB7XG4gICAgICB0aGlzLnJlc3VsdCArPSBcIiBcIjtcbiAgICB9XG5cbiAgICB0aGlzLnJlc3VsdCArPSB0b2tlblN0cjtcbiAgfVxufVxuIl19