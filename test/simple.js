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

var expect = require("expect.js");
var Shift = require("shift-ast");
var codeGen = require("../")["default"];
var parse = require("shift-parser")["default"];

describe("API", function () {
  it("should exist", function () {
    expect(typeof codeGen).be("function");
  });
});

describe("Code generator", function () {

  var IdentifierExpression = Shift.IdentifierExpression;
  var EmptyStatement = Shift.EmptyStatement;
  var IfStatement = Shift.IfStatement;
  var LabeledStatement = Shift.LabeledStatement;
  var Identifier = Shift.Identifier;
  var WhileStatement = Shift.WhileStatement;
  var WithStatement = Shift.WithStatement;
  var ForStatement = Shift.ForStatement;
  var ForInStatement = Shift.ForInStatement;

  describe("generates simple ECMAScript", function () {
    function statement(stmt) {
      return new Shift.Script(new Shift.FunctionBody([], [stmt]));
    }

    function testShift(to, tree) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      var dst = codeGen(tree);
      expect(dst).be(to);
      expect(codeGen(parse(to))).be(to);
      expect(parse(to)).eql(tree);
    }

    function testShiftLoose(to, tree) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      expect(codeGen(tree)).eql(to);
    }

    function test(source) {
      if (arguments.length !== 1) {
        throw new Error('Not supported');
      }
      expect(codeGen(parse(source))).be(source);
      expect(parse(codeGen(parse(source)))).eql(parse(source));
    }

    function test2(expected, source) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      expect(codeGen(parse(source))).be(expected);
      expect(codeGen(parse(expected))).be(expected);
    }

    it("Directives", function () {
      test("\"use strict\"");
      test("\"use\\u0020strict\"");
      testShift("\"abc\"",
          new Shift.Script(new Shift.FunctionBody([new Shift.UnknownDirective("abc")], [])));
      testShift("\"use\\u0020strict\"",
          new Shift.Script(new Shift.FunctionBody([new Shift.UnknownDirective("use strict")], [])));
      test("\"use strict\"");
      testShift("(\"use strict\")",
          statement(new Shift.ExpressionStatement(new Shift.LiteralStringExpression("use strict", "\'use strict\'"))));
      testShift("(\"use strict\");;",
          new Shift.Script(new Shift.FunctionBody([],
              [new Shift.ExpressionStatement(new Shift.LiteralStringExpression("use strict", "\'use strict\'")), new EmptyStatement()])));
    });

    it("ArrayExpression", function () {
      test("[]");
      test("[a]");
      test2("[a]", "[a,]");
      test2("[a,b,c]", "[a,b,c,]");
      test("[a,,]");
      test("[a,,,]");
      test("[[a]]");
      test("[(a,a)]");
    });

    it("ObjectExpression", function () {
      test("({})");
      test2("({a:1})", "({a:1,})");
      test("({}.a--)");
      test2("({1:1})", "({1.0:1})");
      test("({a:b})");
      test("({\"a\":b})");
      test("({\" \":b})");
      test("({get a(){;}})");
      test("({set a(param){;}})");
      test("({get a(){;},set a(param){;},b:1})");
      test("({a:(a,b)})");
    });

    it("Sequence", function () {
      test("a,b,c,d");
    });

    it("Assignment", function () {
      test("a=b");
      test("a+=b");
      test("a*=b");
      test("a%=b");
      test("a<<=b");
      test("a>>=b");
      test("a>>>=b");
      test("a/=b");
      test("a|=b");
      test("a^=b");
      test("a,b^=b");
      test("b^=b,b");
      test("b^=(b,b)");

      test("a.b=0");
      test("a[b]=0");
      test("a()=0");
      test("new a=0");
      test("(!a)=0");
      test("(typeof a)=0");
      test("(a++)=0");
      test("(a,b)=0");
    });

    it("Conditional", function () {
      test("a?b:c");
      test("a?b?c:d:e");
      test("a?b:c?d:e");
      test("a?b?c:d:e?f:g");
      test("(a?b:c)?d:e");
      test("(a,b)?(c,d):(e,f)");
      test("a?b=c:d");
      test("a?b=c:d=e");
      test("a||b?c=d:e=f");
      test("(a=b)?c:d");
      test("a||(b?c:d)");
      test("a?b||c:d");
      test("a?b:c||d");

    });

    it("LogicalOr", function () {
      test("a||b");
    });

    it("LogicalAnd", function () {
      test("a||b");
    });

    it("BitwiseOr", function () {
      test("a|b");
    });

    it("BitwiseAnd", function () {
      test("a&b");
    });

    it("BitwiseXor", function () {
      test("a^b");
      test("a^b&b");
      test("(a^b)&b");
    });

    it("Equality", function () {
      test("a==b");
      test("a!=b");
      test("a==b");
      test("a!=b");
      test("a==b==c");
      test("a==(b==c)");
    });

    it("Relational", function () {
      test("a<b");
      test("a<=b");
      test("a>b");
      test("a>=b");
      test("a instanceof b");
      test("a in b");
      test("a==b<b");
      test("(a==b)<b");
      test("for((b in b);;);");
      test("for((b in b);b in b;b in b);");
      test("for(var a=(b in b);b in b;b in b);");
      test("for(var a=(b in b),c=(b in b);b in b;b in b);");
      test("for(b in c in d);");
    });

    it("Shift", function () {
      test("a<<b");
      test("a>>b");
      test("a>>>b");
      test("a<<b<<c");
      test("a<<(b<<c)");
      test("a<<b<c");
      test("a<<b<c");
      test("a<<(b<c)");
    });

    it("Additive", function () {
      test("a+b");
      test("a-b");
      test("a+(b+b)");
      test("a+(b<<b)");
      test("a+b<<b");
      test("(a<<b)+(c>>d)");
      test2("a*b+c/d", "(a*b)+(c/d)");
    });

    it("Multiplicative", function () {
      test("a*b");
      test("a/b");
      test("a%b");
      test("a%b%c");
      test("a%(b%c)");
      test("a+b%c");
      test("(a+b)%c");
      test("!a*b");
      test("a*(b+c)");
    });

    it("Prefix", function () {
      test("+a");
      test("-a");
      test("!a");
      test("~a");
      test("typeof a");
      test("void a");
      test("delete a");
      test("++a");
      test("--a");
      test("+ ++a");
      test("- --a");
      test("a+ +a");
      test("a-a");
      test("typeof-a");
      test("!!a");
      test("!!(a+a)");
    });

    it("Postfix", function () {
      test("a++");
      test("a--");
      test("(a--)--");
    });

    it("NewCallMember", function () {
      test("new a");
      test("new a(a)");
      test("new a(a,b)");
      test("new this.a");
      test("a()");
      test("a(a)");
      test("a(a,b)");
      test("a.a");
      test("a[a]");
      test2("new a", "new a()");
      test("new a(a)");
      test2("(new a).a", "new a().a");
      test("new a(a).v");
      test("new(a(a).v)");
      test("(new a)()");
      test2("(new new a(a).a.a).a", "(new (new a(a).a).a).a");
      test2("new((new a)().a)", "new((new a)()).a");
      test("new a.a");
      test("new(a().a)");
    });

    it("Primary", function () {
      test("0");
      test("1");
      test("2");
      test2("(\"a\")", "('a')");
      test2("(\"'\")", "('\\'')");
      test(";\"a\"");
      test(";\"\\\"\"");
      test("/a/");
      test("/a/i");
      test("/a/ig");
      test("/a\\s/ig");
      test("/a\\r/ig");
      test("/a\\r/ instanceof 3");
      test("/a\\r/g instanceof 3");
      test("true");
      test("false");
      test("null");
      test2("null", "nul\\u006c");
      test("(\"\\b\\n\\r\\t\\v\\f\\\\\\u2028\\u2029日本\")");
      test("(function(){})");
    });

    it("FloatingPoint", function () {
      test("1.1.valueOf()");
      test("15..valueOf()");
      test("1..valueOf()");
      test("1e+300.valueOf()");
      test("8000000000000000..valueOf()");
      test2("10..valueOf()", "1e1.valueOf()");
      test2("1.3754889325393114", "1.3754889325393114");
      test2("1.3754889325393114e+24", "0x0123456789abcdefABCDEF");
      test2("4.185580496821357e+298", "4.1855804968213567e298");
      test2("5.562684646268003e-308", "5.5626846462680035e-308");
      test2("5.562684646268003e-309", "5.5626846462680035e-309");
      test2("2147483648", "2147483648.0");
      test("1e-7");
      test("1e-8");
      test("1e-9");
      test2("1e+308", "1e308");
      test2("2e308", "2e308");
      test2("1+2e308", "1+2e308");
      test2("2e308", "3e308");
    });

    it("BlockStatement", function () {
      test("{}");
      test("{{}}");
      test("{a:{}}");
      test2("{a;b}", "{a\nb\n}");
    });

    it("BreakStatement", function () {
      test2("while(1)break", "while(1)break");
      test2("while(1){break;break}", "while(1){break;break;}");
      test2("a:while(1){break;break a}", "a:while(1){break;break a;}");
      test2("switch(1){case 1:break}", "switch(1){case 1:break;}");
    });

    it("ContinueStatement", function () {
      test2("while(1)continue", "while(1)continue");
      test2("while(1){continue;continue}", "while(1){continue;continue;}");
      test2("a:while(1){continue;continue a}", "a:while(1){continue;continue a;}");
    });

    it("DebuggerStatement", function () {
      test2("debugger", "debugger");
    });

    it("DoWhileStatement", function () {
      test2("do;while(1)", "do;while(1)");
      test2("do{}while(1)", "do{}while(1)");
      test("do debugger;while(1)");
      test("do if(3){}while(1)");
      test2("do 3;while(1)", "do(3);while(1)");
    });

    it("ExpressionStatement", function () {
      test("a");
      test("({a:3})");
      test("do({a:3});while(1)");
      test("~{a:3}");
      test("({a:3}+1)");
      test("a:~{a:3}");
      test("~function(){}");
      test("~function(){}()");
      test("function name(){}");
    });

    it("ForInStatement", function () {
      test("for(var a in 1);");
      test("for(var a=3 in 1);");
      test("for(var a=(3 in 5)in 1);");
      test("for(var a=(3 in 5==7 in 4)in 1);");
      test("for(var a=1+1 in 1);");
      test("for((1+1)in 1);");
      test("for((+1)in 1);");
      test("for(new 1 in 1);");
      test("for(1()in 1);");
    });

    it("ForStatement", function () {
      test("for(var i=(1 in[]);;);");
      test("for(var i=(1 in[]),b,c=(1 in[]);;);");
      test("for((1 in[]);;);");
      test("for(1*(1 in[]);;);");
      test("for(1*(1+1 in[]);;);");
      test("for(1*(1+1 in[]);;);");
      test("for(1*(1+(1 in[]));;);");
    });

    it("IfStatement", function () {
      test("if(a);");
      test("if(a)b");
      test("if(a)if(a)b");
      test("if(a){}");
      test("if(a);else;");
      test("if(a);else{}");
      test("if(a){}else{}");
      test("if(a)if(a){}else{}else{}");
      var IDENT = new IdentifierExpression(new Identifier("a"));
      var EMPTY = new EmptyStatement();

      var MISSING_ELSE = new IfStatement(IDENT, EMPTY, null);
      testShiftLoose("if(a){if(a);}else;",
          statement(new IfStatement(IDENT, MISSING_ELSE, EMPTY)));
      testShiftLoose("if(a){a:if(a);}else;",
          statement(new IfStatement(IDENT, new LabeledStatement(new Identifier("a"), MISSING_ELSE), EMPTY)));
      testShiftLoose("if(a){if(a);else if(a);}else;",
          statement(new IfStatement(IDENT, new IfStatement(IDENT, EMPTY, MISSING_ELSE), EMPTY)));
      testShiftLoose("if(a){if(a);}else;",
          statement(new IfStatement(IDENT, MISSING_ELSE, EMPTY)));
      testShiftLoose("if(a){while(a)if(a);}else;",
          statement(new IfStatement(IDENT, new WhileStatement(IDENT, MISSING_ELSE), EMPTY)));
      testShiftLoose("if(a){with(a)if(a);}else;",
          statement(new IfStatement(IDENT, new WithStatement(IDENT, MISSING_ELSE), EMPTY)));
      testShiftLoose("if(a){for(;;)if(a);}else;",
          statement(new IfStatement(IDENT, new ForStatement(null, null, null, MISSING_ELSE), EMPTY)));
      testShiftLoose("if(a){for(a in a)if(a);}else;",
          statement(new IfStatement(IDENT, new ForInStatement(IDENT, IDENT, MISSING_ELSE), EMPTY)));
    });

    it("LabeledStatement", function () {
      test("a:;");
      test("a:b:;");
    });

    it("ReturnStatement", function () {
      test("function a(){return}");
      test("function a(){return 0}");
      test("function a(){return function a(){return 0}}");
    });

    it("SwitchStatement", function () {
      test("switch(0){}");
      test("switch(0){default:}");
      test("switch(0){case 0:default:}");
      test("switch(0){case 0:a;default:c:b}");
    });

    it("ThrowStatement", function () {
      test("throw 0");
      test("throw(1<1)+1");
    });

    it("TryStatement", function () {
      test("try{}catch(a){}");
      test("try{}catch(a){}finally{}");
      test("try{}finally{}");
    });

    it("VariableDeclarationStatement", function () {
      test("var a=0");
      test("var a=0,b=0");
      test("var a=(0,0)");
      test("var a=(0,0,0)");
      test("var a");
      test("var a,b");
      test("var a=\"\"in{}");
    });

    it("WhileStatement", function () {
      test("while(0);");
      test("while(0)while(0);");
    });

    it("WithStatement", function () {
      test("with(0);");
      test("with(0)with(0);");
    });

    it("Script", function () {
      test("");
    });

  });
});
