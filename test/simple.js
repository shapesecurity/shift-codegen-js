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

var fs = require("fs");
var expect = require("expect.js");
var codeGen = require("../")["default"];
var MinimalCodeGen = require("../")["MinimalCodeGen"];
var FormattedCodeGen = require("../")["FormattedCodeGen"];
var ExtensibleCodeGen = require("../")["ExtensibleCodeGen"];
var Sep = require("../")["Sep"];
var parse = require("shift-parser").parseModule;
var parseScript = require("shift-parser").parseScript;
var reduce = require("shift-reducer").default;
var Precedence = require("../").Precedence;
var getPrecedence = require("../").getPrecedence;
var escapeStringLiteral = require("../").escapeStringLiteral;
var CodeRep = require("../").CodeRep;
var Empty = require("../").Empty;
var Token = require("../").Token;
var NumberCodeRep = require("../").NumberCodeRep;
var Paren = require("../").Paren;
var Bracket = require("../").Bracket;
var Brace = require("../").Brace;
var NoIn = require("../").NoIn;
var ContainsIn = require("../").ContainsIn;
var Seq = require("../").Seq;
var Semi = require("../").Semi;
var CommaSep = require("../").CommaSep;
var SemiOp = require("../").SemiOp;


describe("API", function () {
  it("should exist", function () {
    expect(typeof codeGen).be("function");
  });

  it("should export the various codereps", function () {
    expect(typeof Precedence).be("object");
    expect(typeof getPrecedence).be("function");
    expect(typeof escapeStringLiteral).be("function");
    expect(typeof CodeRep).be("function");
    expect(typeof Empty).be("function");
    expect(typeof Token).be("function");
    expect(typeof NumberCodeRep).be("function");
    expect(typeof Paren).be("function");
    expect(typeof Bracket).be("function");
    expect(typeof Brace).be("function");
    expect(typeof NoIn).be("function");
    expect(typeof ContainsIn).be("function");
    expect(typeof Seq).be("function");
    expect(typeof Semi).be("function");
    expect(typeof CommaSep).be("function");
    expect(typeof SemiOp).be("function");
  });

});

describe("everything.js", function () {
  it("should round trip", function () {
    var source;

    source = "" + fs.readFileSync(require.resolve("everything.js/es2015-module"));
    expect(parse(codeGen(parse(source)))).eql(parse(source));

    source = "" + fs.readFileSync(require.resolve("everything.js/es2015-script"));
    expect(parseScript(codeGen(parseScript(source)))).eql(parseScript(source));
  });
});

describe("Code generator", function () {

  describe("generates simple ECMAScript", function () {
    function statement(stmt) {
      return { type: "Script", directives: [], statements: [stmt] };
    }

    function testShift(to, tree) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      var dst = codeGen(tree);
      expect(dst).be(to);
      expect(codeGen(parseScript(to))).be(to);
      expect(parseScript(to)).eql(tree);
    }

    function testShiftLoose(to, tree) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      expect(codeGen(tree)).eql(to);
      expect(codeGen(tree, new ExtensibleCodeGen)).eql(to);
    }

    function test(source) {
      if (arguments.length !== 1) {
        throw new Error('Not supported');
      }
      expect(codeGen(parse(source))).be(source);
      expect(codeGen(parse(source), new ExtensibleCodeGen)).be(source);
      expect(parse(codeGen(parse(source)))).eql(parse(source));
      expect(parse(codeGen(parse(source), new FormattedCodeGen))).eql(parse(source));
    }

    function testScript(source) {
      if (arguments.length !== 1) {
        throw new Error('Not supported');
      }
      expect(codeGen(parseScript(source))).be(source);
      expect(codeGen(parseScript(source), new ExtensibleCodeGen)).be(source);
      expect(parseScript(codeGen(parseScript(source)))).eql(parseScript(source));
      expect(parseScript(codeGen(parseScript(source), new FormattedCodeGen))).eql(parseScript(source));
    }

    function test2(expected, source) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      expect(codeGen(parse(source))).be(expected);
      expect(codeGen(parse(source), new ExtensibleCodeGen)).be(expected);
      expect(codeGen(parse(expected))).be(expected);
      expect(codeGen(parse(expected), new ExtensibleCodeGen)).be(expected);
    }

    function test2Script(expected, source) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      expect(codeGen(parseScript(source))).be(expected);
      expect(codeGen(parseScript(expected))).be(expected);
    }

    it("Directive", function () {
      testShift("\"use strict\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "use strict" }], statements: [] }
      );
      testShift("\"use\\u0020strict\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "use\\u0020strict" }], statements: [] }
      );
      testShift("\"use\\x20strict\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "use\\x20strict" }], statements: [] }
      );
      testShift("\"abc\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "abc" }], statements: [] }
      );
      testShift("\"use\\x20strict\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "use\\x20strict" }], statements: [] }
      );
      test("\"use strict\"");
      testShift("(\"use strict\")",
        statement({ type: "ExpressionStatement", expression: { type: "LiteralStringExpression", value: "use strict" } })
      );
      testShift("(\"use strict\");;",
        { type: "Script", directives: [], statements: [
          { type: "ExpressionStatement", expression: { type: "LiteralStringExpression", value: "use strict" } },
          { type: "EmptyStatement" }
        ]}
      );
      testShift("\"'\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "'" }], statements: [] }
      );
      testShift("'\"'",
        { type: "Script", directives: [{ type: "Directive", rawValue: "\"" }], statements: [] }
      );
      testShift("\"\\\"\"",
        { type: "Script", directives: [{ type: "Directive", rawValue: "\\\"" }], statements: [] }
      );
      testShift("'\\\\\"'",
        { type: "Script", directives: [{ type: "Directive", rawValue: "\\\\\"" }], statements: [] }
      );
      test("\"\\\n'\"");
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

    it("SpreadElement", function () {
      test("[...a]");
      test("[...a,...b]");
      test("[...a,b,...c]");
      test("[...a=b]");
      test("[...(a,b)]");
      test("f(...a)");
    });

    it("ObjectExpression", function () {
      test("({})");
      test2("({a:1})", "({a:1,})");
      test("({}.a--)");
      test2("({1:1})", "({1.0:1})");
      test("({a:b})");
      test2("({255:0})", "({0xFF:0})");
      test2("({63:0})", "({0o77:0})");
      test2("({3:0})", "({0b11:0})");
      test2("({0:0})", "({0.:0})");
      test2("({0:0})", "({.0:0})");
      test2("({.1:0})", "({0.1:0})");
      test("({.1:0})");
      test("({\"+0\":b})");
      test("({\"+1\":b})");
      test("({\"-0\":b})");
      test("({\"-1\":b})");
      test("({\".1\":b})");
      test("({\"01\":b})");
      test("({\"0x1\":b})");
      test("({\" 0\":b})");
      test("({\"  0\":b})");
      test("({\"\t0\":b})");
      test2("({\"\t0\":b})", "({\"\\t0\":b})");
      test("({\"\\n0\":b})");
      test("({[a]:b})");
      test2("({a:b})", "({\"a\":b})");
      test("({\" \":b})");
      test("({get a(){;}})");
      test("({set a(param){;}})");
      test("({get a(){;},set a(param){;},b:1})");
      test("({a:(a,b)})");
      test("({a})");
    });

    it("ArrayAssignmentTarget", function () {
      test("[]=0");
      test("[...a]=0");
      test("[a,...a]=0");
      test("[a,a=0,...a]=0");
      test("[,,]=0");
      test("[,...a]=0");
      test("[a=(0,0)]=0");
    });

    it("ObjectAssignmentTarget", function () {
      test("({a=(0,0)}=0)");
    });

    it("AssignmentTargetPropertyIdentifier", function () {
      test("({a=0}=0)");
    });

    it("AssignmentTargetPropertyProperty", function () {
      test("({a:b}=0)");
    });

    it("AssignmentTargetWithDefault", function () {
      test("[a=0]=0");
      test("({a:b=0}=0)");
    });

    it("ArrayBinding", function () {
      test("let[]=0");
      test("let[...a]=0");
      test("let[a,...b]=0");
      test("let[a,b=0,...c]=0");
      test("let[,,]=0");
      test("let[,...a]=0");
      test("let[a=(0,0)]=0");
    });

    it("ObjectBinding", function () {
      test("let{a=(0,0)}=0");
    });

    it("BindingPropertyIdentifier", function () {
      test("let{a=0}=0");
    });

    it("BindingPropertyProperty", function () {
      test("let{a:b}=0");
    });

    it("BindingWithDefault", function () {
      test("let[a=0]=0");
      test("let{a:b=0}=0");
    });

    it("ClassDeclaration", function () {
      test("class A{}");
      test("class A extends B{}");
      test("class A extends(B,C){}");
      test("class A extends(+B){}");
      test("class A extends(()=>0){}");
      test("class A extends[]{}");
      test("class A extends{}{}");
      test("class A extends B(){}");
      test("class A extends new B{}");
      test("class A extends B.C{}");
    });

    it("ClassExpression", function () {
      test("(class{})");
      test("(class A{})");
      test("(class A extends B{})");
      test("(class extends B{})");
      test("(class A extends(B,C){})");
      test("(class A extends(+B){})");
      test("(class A extends(()=>0){})");
      test("(class A extends[]{})");
      test("(class A extends{}{})");
      test("(class A extends B(){})");
      test("(class A extends new B{})");
      test("(class A extends B.C{})");
    });

    it("ClassElement", function () {
      test("(class{a(){}})");
      test("(class{*a(){}})");
      test("(class{static a(){}})");
      test("(class{static*a(){}})");
      test("(class{constructor(){}})");
    });

    it("Sequence", function () {
      test("a,b,c,d");
    });

    it("Assignment", function () {
      test("a=b");
      test("a+=b");
      test("a*=b");
      test("a%=b");
      test("a**=b");
      test("a<<=b");
      test("a>>=b");
      test("a>>>=b");
      test("a/=b");
      test("a|=b");
      test("a^=b");
      test("a,b=c");
      test("a=b,c");
      test("a=(b,c)");
      test("a,b^=c");
      test("a^=b,c");
      test("a^=(b,c)");

      test("a.b=0");
      test("a[b]=0");
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

      test("a/i");
    });

    it("Exponential", function () {
      test("a**b");
      test("(a**b)**c");
      test("a**b**c");
      test("a*b**c");
      test("(a*b)**c");
      test("a**b*c");
      test("a**(b*c)");
      test("(-a)**b");
      test("-(a**b)")
      test("(void a)**b")
      test("void(a**b)")
    });

    it("PrefixExpression", function () {
      test("+a");
      test("-a");
      test("!a");
      test("~a");
      test("typeof a");
      test("void a");
      test("delete a.b");
      test("++a");
      test("--a");
      test("+ ++a");
      test("- --a");
      test("a+ +a");
      test("a-a");
      test("typeof-a");
      test("!a++");
      test("!!a");
      test("!!(a+a)");
    });

    it("PostfixExpression", function () {
      test("a++");
      test("a--");
    });

    it("NewCallMember", function () {
      test("new a");
      test("new a(a)");
      test("new a(a,b)");
      test("new this.a");
      test("a()");
      test("a(a)");
      test("a(a,b)");
      test("a((a,b))");
      test("new a((a,b))");
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

    it("LiteralRegExpExpression", function () {
      test("a/ /b/");
      test("/a/");
      test("/a/i");
      test("/a/gi");
      test("/a\\s/gi");
      test("/a\\r/gi");
      test("/a\\r/ instanceof 3");
      test("/a\\r/g instanceof 3");
      test("/a/ in 0");
    });

    it("LiteralBooleanExpression", function () {
      test("true");
      test("false");
    });

    it("LiteralNullExpression", function () {
      test("null");
      test2("null", "nul\\u006c");
    });

    it("FunctionDeclaration", function () {
      test("function f(){}");
      test("function*f(){}");
      test("function f(a){}");
      test("function f(a,b){}");
      test("function f(a,b,...rest){}");
    });

    it("FunctionExpression", function () {
      test("(function(){})");
      test("(function f(){})");
      test("(function*(){})");
      test("(function*f(){})");
    });

    it("ArrowExpression", function () {
      test("a=>a");
      test("()=>a");
      test2("a=>a", "(a)=>a");
      test("(...a)=>a");
      test("(...[])=>0");
      test("(a,...b)=>a");
      test("(a=0)=>a");
      test("(a,b)=>a");
      test("({a})=>a");
      test("({a=0})=>a");
      test("([a])=>a");
      test("a=>({})");
      test("a=>{}");
      test("a=>{({})}");
      test("a=>{0;return}");
      test("()=>function(){}");
      test("()=>class{}");
      test("()=>(1,2)");
      test("(()=>0)()");
      test("(a=(0,0))=>0");
    });

    it("NewTargetExpression", function () {
      test("function f(){new.target}");
      test2("function f(){new.target}", "function f() { new . target }");
    });

    it("TemplateExpression", function () {
      test("``");
      test("````");
      test("a``");
      test("a.b``");
      test("a[b]``");
      test("a()``");
      test("(a+b)``");
      test2("(function(){}``)", "(function(){})``");
      test2("(class{}``)", "(class{})``");
      test2("({}``)", "({})``");
      test("`a`");
      test("a`a`");
      test("`a${b}c`");
      test("`${a}`");
      test("`${a}${b}`");
      test("` ${a} ${b} `");
      test2("` ${a} ${b} `", "` ${ a } ${ b } `");
      test("`a\\${b}c`");
      test("``.a");
      test("``()");
      test("new``");
      test2("new``", "new ``()");
      test2("new``(a)", "new ``(a)");
    });

    it("Super", function () {
      test("class A extends B{constructor(){super()}}");
      test("({m(){super.m()}})");
    });

    it("YieldExpression", function () {
      test("function*f(){yield}");
      test("function*f(){yield a}");
      test("function*f(){yield 0}");
      test("function*f(){yield{}}");
      test("function*f(){yield a+b}");
      test("function*f(){yield a=b}");
      test("function*f(){yield(a,b)}");
      test("function*f(){f(yield,yield)}");
      test("function*f(){f(yield a,yield b)}");
      test("function*f(){yield yield yield}");
    });

    it("YieldGeneratorExpression", function () {
      test("function*f(){yield*a}");
      test("function*f(){yield*0}");
      test("function*f(){yield*{}}");
      test("function*f(){yield*a+b}");
      test("function*f(){yield*a=b}");
      test("function*f(){yield*(a,b)}");
      test("function*f(){f(yield*a,yield*b)}");
      test("function*f(){yield*yield*(yield)*(yield)}");
    });

    it("ForOfStatement", function () {
      test("for(a of b);");
      test("for(a of(1,2));");
      test("for([a]of[b]);");
      test("for(let[a]of[b]);");
      testScript("for((let)of b);");
      testScript("for((let.a)of b);");
      testScript("for((let[a])of b);");
      test2Script("for((let.a)of b);", "for((let).a of b);");
      test("for(a of(b,c));");
    });

    it("LiteralNumericExpression", function () {
      test("0");
      test2("0", "0x0");
      test2("0", "0o0");
      test2("0", "0b0");
      test("1");
      test("2");
      test("0x38D7EA4C68001");
      test("0x38D7EA4C68001.valueOf()");
      test2("15e5", "1500000");
      test2("155e3", "155000");
      test(".1");
      test2(".1", "0.1");
      // floats
      test("1.1.valueOf()");
      test("15..valueOf()");
      test("1..valueOf()");
      test2("1e300.valueOf()", "1e+300.valueOf()");
      test2("8e15.valueOf()", "8000000000000000..valueOf()");
      test2("1e20", "100000000000000000001");
      test2("10..valueOf()", "1e1.valueOf()");
      test2("1", "1e0");
      test2("10", "1e1");
      test2("100", "1e2");
      test("1e3");
      test("1e4");
      test2("1e5", "100000");
      test2("1.3754889325393114", "1.3754889325393114");
      test2("1.3754889325393114e24", "0x0123456789abcdefABCDEF");
      test2("4.185580496821357e298", "4.1855804968213567e+298");
      test2("5.562684646268003e-308", "5.5626846462680035e-308");
      test2("5.562684646268003e-309", "5.5626846462680035e-309");
      test2("2147483648", "2147483648.0");
      test("1e-7");
      test("1e-8");
      test("1e-9");
      test2("1e308", "1e+308");
      test("1e308");
      test("1e-308");
    });

    it("LiteralInfinityExpression", function () {
      test2("2e308", "2e308");
      test2("1+2e308", "1+2e308");
      test2("2e308", "3e308");
    });

    it("LiteralStringExpression", function () {
      test("(\"\")");
      test2("(\"\")", "('')");
      test2("(\"a\")", "('a')");
      test2("('\"')", "(\"\\\"\")");
      test2("(\"a\")", "('a')");
      test2("(\"'\")", "('\\'')");
      test("(\"a\")");
      test("('\"')");
      test("(\"\b\\n\\r\t\v\f\\\\\\\"'\\u2028\\u2029日本\")");
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
      test("(function(){})");
      test("(class{})");
      testScript("let");
      testScript("(let[a])");
      testScript("(let[a]++)");
      testScript("(let[a]=0)");
      testScript("(let[a].b`c`||e?f:g)");
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
      testScript("for((let)in 1);");
      test("for(a in 1);");
      test("for(a in 1,2);");
      testScript("for((let)in b);");
      testScript("for((let.a)in b);");
      testScript("for((let[a])in b);");
      test2Script("for((let.a)in b);", "for((let).a in b);");
    });

    it("ForStatement", function () {
      test("for(var i=(1 in[]);;);");
      test("for(var i=(1 in[]),b,c=(1 in[]);;);");
      test("for(var a=(b=>c in 0);;);");
      test("!function*(){for((yield a in 0);;);}");
      test("!function*(){for((yield*a in 0);;);}");
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
      var IDENT = { type: "IdentifierExpression", name: "a" };
      var EMPTY = { type: "EmptyStatement" };

      var MISSING_ELSE = { type: "IfStatement", test: IDENT, consequent: EMPTY, alternate: null };
      testShiftLoose("if(a){if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: MISSING_ELSE, alternate: EMPTY })
      );
      testShiftLoose("if(a){a:if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: { type: "LabeledStatement", label: "a", body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose("if(a){if(a);else if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: { type: "IfStatement", test: IDENT, consequent: EMPTY, alternate: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose("if(a){while(a)if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: { type: "WhileStatement", test: IDENT, body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose("if(a){with(a)if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: { type: "WithStatement", object: IDENT, body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose("if(a){for(;;)if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: { type: "ForStatement", init: null, test: null, update: null, body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose("if(a){for(a in a)if(a);}else;",
        statement({ type: "IfStatement", test: IDENT, consequent: { type: "ForInStatement", left: IDENT, right: IDENT, body: MISSING_ELSE }, alternate: EMPTY })
      );
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
      testShift("with(null);",
        statement({ type: "WithStatement", object: { type: "LiteralNullExpression" }, body: { type: "EmptyStatement" }})
      );
    });

    it("Import", function () {
      test("import\"m\"");
      test("import\"m\";0");
      test("import a from\"m\"");
      test("import{a}from\"m\"");
      test("import{a,b}from\"m\"");
      test("import a,{b}from\"m\"");
      test("import a,{b,c}from\"m\"");
      test("import a,{b,c}from\"m\";0");
      test2("import\"m\"", "import {} from \"m\"");
      test2("import a from\"m\"", "import a,{}from \"m\"");
    });

    it("ImportNamespace", function () {
      test("import*as a from\"m\"");
      test("import*as a from\"m\";0");
      test("import a,*as b from\"m\"");
    });

    it("ImportSpecifier", function () {
      test("import{a}from\"m\"");
      test("import{a}from\"m\";0");
      test("import{a as b}from\"m\"");
      test("import{a,b}from\"m\"");
      test("import{a,b as c}from\"m\"");
      test("import{a as b,c}from\"m\"");
      test("import{a as b,c as d}from\"m\"");
    });

    it("ExportAllFrom", function () {
      test("export*from\"m\"");
      test("export*from\"m\";0");
    });

    it("ExportFrom", function () {
      test("export{}from\"m\"");
      test("export{}from\"m\";0");
      test("export{a}from\"m\"");
      test("export{a as b}from\"m\"");
      test("export{a,b}from\"m\"");
    });

    it("ExportLocals", function () {
      test("export{}");
      test("export{};0");
      test("let a;export{a}");
      test("let a;export{a as b}");
      test("let a,b;export{a,b}");
    });

    it("Export", function () {
      test("export var a");
      test("export var a;0");
      test("export var a=0");
      test("export var a,b");
      test("export var a=0,b=0");
      test("export const a=0");
      test("export let a");
      test("export function f(){}");
      test("export function f(){}0");
      test("export class A{}");
      test("export class A{}0");
    });

    it("ExportDefault", function () {
      test("export default function(){}");
      test("export default function(){}0");
      test("export default 0");
      test("export default 0;0");
      test("export default function f(){}");
      test("export default function*f(){}");
      test("export default class{}");
      test("export default class A{}");
      test("export default(class{})");
      test("export default(function(){})");
      test("export default{}");
      test("export default(0,0)");
    });

    it("ExportSpecifier", function () {
      test("let a;export{a}");
      test("let a,b;export{a as b}");
      test("let a,b;export{a,b}");
      test("let a,b,c;export{a,b as c}");
      test("let a,b,c;export{a as b,c}");
      test("let a,b,c,d;export{a as b,c as d}");
    });

    it("Module", function () {
      test("");
      test("a;a");
    });

    it("ComputedMemberAssignmentTarget", function () {
      test("(a.b++)[0]=1");
    });

    it("ComputedPropertyName", function () {
      test("({[(0,0)]:0})");
    });
  });
});

describe("Pretty code generator", function () {
  function testPretty(source, scriptMode) {
    var parseTest = scriptMode ? parseScript : parse;
    expect(codeGen(parseTest(source), new FormattedCodeGen)).be(source);
    expect(parseTest(codeGen(parseTest(source), new FormattedCodeGen))).eql(parseTest(source));
  }

  function testLoose(to, tree) {
    if (arguments.length !== 2) {
      throw new Error('Not supported');
    }
    expect(codeGen(tree, new FormattedCodeGen)).eql(to);
  }

  it("should output a newline after brace", function () {
    testPretty("export default function () {\n  null;\n}\n");
  });

  it("should output a newline after semiOp", function () {
    testPretty("export const FOO = 123;\n");
  });

  it("should output no newline after semi", function () {
    testPretty("(function () {\n  for (var x = 0;;) {}\n});\n");
  });

  it("should indent", function () {
    testPretty("function f() {\n  function g() {\n    null;\n    l: for (;;) {\n      break l;\n    }\n  }\n}\n");
  });

  it("should insert spaces in expressions", function () {
    testPretty("let [x, , y] = (0 + 1, {a: 2, b: 3}, (c, d) => (4, 5));\n");
  });

  it("should insert spaces in statements", function () {
    testPretty("with ({}) {}\n", true);
  });

  it("should put else and while inline", function () {
    testPretty("if (0) {} else {}\n");
    testPretty("do {} while (true);\n");
  });

  it("should not output linebreaks after function expressions", function () {
    testPretty("(function () {});\n");
  });

  it("should indent appropriately within expressions", function () {
    testPretty("[function () {\n  [function () {\n    let x = a in b;\n  }];\n}];\n");
  });

  it("should add spaces to the appropriate unary operations", function () {
    testPretty("++x;\n--x;\n+[];\n-[];\n+[];\n![];\n~[];\nvoid [];\ntypeof [];\ndelete [];\n");
  });

  it("should pretty-print switch statements", function () {
    testPretty("switch (0) {\n  case 0:\n  case 1:\n    0;\n  default:\n    0;\n    0;\n  case 3:\n    0;\n    0;\n  case 4:\n}\n");
  });

  it("should handle literal string expressions and directives properly", function () {
    testPretty("'\"';\n(\"expression\");\n");
  });

  it("should continue handling missing-else condition appropriately", function () {
    function statement(stmt) {
      return { type: "Script", directives: [], statements: [stmt] };
    }

    var IDENT = { type: "IdentifierExpression", name: "a" };
    var EMPTY = { type: "EmptyStatement" };

    var MISSING_ELSE = { type: "IfStatement", test: IDENT, consequent: EMPTY, alternate: null };
    testLoose("if (a) {\n  if (a) ;\n} else ;\n",
      statement({ type: "IfStatement", test: IDENT, consequent: MISSING_ELSE, alternate: EMPTY })
    );
  });

  it("should print the empty script as the empty script", function () {
    testPretty("", true);
  });

  it("should print directives with linebreaks", function () {
    testPretty("\"use strict\";\n!function () {\n  \"use strict\";\n};\n", true);
  });

  it("should pretty-print exports", function () {
    testPretty("export {a} from \"b\";\n");
    testPretty("let a;\nexport {a};\n");
  });
});

describe("CodeRep", function(){
  it("should call forEach the appropriate number of times", function () {
    var tree = reduce(new MinimalCodeGen, parse("f(0,1,(2,3))"));
    var count = 0;
    tree.forEach(function(){++count;});
    expect(count).eql(14);
  });
})
