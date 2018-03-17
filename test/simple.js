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

let fs = require('fs');
let expect = require('expect.js');
let codeGen = require('../').default;
let MinimalCodeGen = require('../').MinimalCodeGen;
let FormattedCodeGen = require('../').FormattedCodeGen;
let ExtensibleCodeGen = require('../').ExtensibleCodeGen;
let Sep = require('../').Sep;
let parse = require('shift-parser').parseModule;
let parseScript = require('shift-parser').parseScript;
let reduce = require('shift-reducer').default;
let Precedence = require('../').Precedence;
let getPrecedence = require('../').getPrecedence;
let escapeStringLiteral = require('../').escapeStringLiteral;
let CodeRep = require('../').CodeRep;
let Empty = require('../').Empty;
let Token = require('../').Token;
let NumberCodeRep = require('../').NumberCodeRep;
let Paren = require('../').Paren;
let Bracket = require('../').Bracket;
let Brace = require('../').Brace;
let NoIn = require('../').NoIn;
let ContainsIn = require('../').ContainsIn;
let Seq = require('../').Seq;
let Semi = require('../').Semi;
let CommaSep = require('../').CommaSep;
let SemiOp = require('../').SemiOp;


describe('API', () => {
  it('should exist', () => {
    expect(typeof codeGen).be('function');
  });

  it('should export the various codereps', () => {
    expect(typeof Precedence).be('object');
    expect(typeof getPrecedence).be('function');
    expect(typeof escapeStringLiteral).be('function');
    expect(typeof CodeRep).be('function');
    expect(typeof Empty).be('function');
    expect(typeof Token).be('function');
    expect(typeof NumberCodeRep).be('function');
    expect(typeof Paren).be('function');
    expect(typeof Bracket).be('function');
    expect(typeof Brace).be('function');
    expect(typeof NoIn).be('function');
    expect(typeof ContainsIn).be('function');
    expect(typeof Seq).be('function');
    expect(typeof Semi).be('function');
    expect(typeof CommaSep).be('function');
    expect(typeof SemiOp).be('function');
  });

});

describe('everything.js', () => {
  it('should round trip', () => {
    let source;

    source = '' + fs.readFileSync(require.resolve('everything.js/es2015-module'));
    expect(parse(codeGen(parse(source)))).eql(parse(source));

    source = '' + fs.readFileSync(require.resolve('everything.js/es2015-script'));
    expect(parseScript(codeGen(parseScript(source)))).eql(parseScript(source));
  });
});

describe('Code generator', () => {

  describe('generates simple ECMAScript', () => {
    function statement(stmt) {
      return { type: 'Script', directives: [], statements: [stmt] };
    }

    function testShift(to, tree) {
      if (arguments.length !== 2) {
        throw new Error('Not supported');
      }
      let dst = codeGen(tree);
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

    it('Directive', () => {
      testShift('"use strict"',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: 'use strict' }], statements: [] }
      );
      testShift('"use\\u0020strict"',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: 'use\\u0020strict' }], statements: [] }
      );
      testShift('"use\\x20strict"',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: 'use\\x20strict' }], statements: [] }
      );
      testShift('"abc"',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: 'abc' }], statements: [] }
      );
      testShift('"use\\x20strict"',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: 'use\\x20strict' }], statements: [] }
      );
      test('"use strict"');
      testShift('("use strict")',
        statement({ type: 'ExpressionStatement', expression: { type: 'LiteralStringExpression', value: 'use strict' } })
      );
      testShift('("use strict");;',
        { type: 'Script', directives: [], statements: [
          { type: 'ExpressionStatement', expression: { type: 'LiteralStringExpression', value: 'use strict' } },
          { type: 'EmptyStatement' },
        ] }
      );
      testShift('"\'"',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: '\'' }], statements: [] }
      );
      testShift('\'"\'',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: '"' }], statements: [] }
      );
      testShift('"\\""',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: '\\"' }], statements: [] }
      );
      testShift('\'\\\\"\'',
        { type: 'Script', directives: [{ type: 'Directive', rawValue: '\\\\"' }], statements: [] }
      );
      test('"\\\n\'"');
    });

    it('ArrayExpression', () => {
      test('[]');
      test('[a]');
      test2('[a]', '[a,]');
      test2('[a,b,c]', '[a,b,c,]');
      test('[a,,]');
      test('[a,,,]');
      test('[[a]]');
      test('[(a,a)]');
    });

    it('SpreadElement', () => {
      test('[...a]');
      test('[...a,...b]');
      test('[...a,b,...c]');
      test('[...a=b]');
      test('[...(a,b)]');
      test('f(...a)');
    });

    it('ObjectExpression', () => {
      test('({})');
      test2('({a:1})', '({a:1,})');
      test('({}.a--)');
      test2('({1:1})', '({1.0:1})');
      test('({a:b})');
      test2('({255:0})', '({0xFF:0})');
      test2('({63:0})', '({0o77:0})');
      test2('({3:0})', '({0b11:0})');
      test2('({0:0})', '({0.:0})');
      test2('({0:0})', '({.0:0})');
      test2('({.1:0})', '({0.1:0})');
      test('({.1:0})');
      test('({"+0":b})');
      test('({"+1":b})');
      test('({"-0":b})');
      test('({"-1":b})');
      test('({".1":b})');
      test('({"01":b})');
      test('({"0x1":b})');
      test('({" 0":b})');
      test('({"  0":b})');
      test('({"\t0":b})');
      test2('({"\t0":b})', '({"\\t0":b})');
      test('({"\\n0":b})');
      test('({[a]:b})');
      test2('({a:b})', '({"a":b})');
      test('({" ":b})');
      test('({get a(){;}})');
      test('({set a(param){;}})');
      test('({get a(){;},set a(param){;},b:1})');
      test('({a:(a,b)})');
      test('({a})');
    });

    it('ArrayAssignmentTarget', () => {
      test('[]=0');
      test('[...a]=0');
      test('[a,...a]=0');
      test('[a,a=0,...a]=0');
      test('[,,]=0');
      test('[,...a]=0');
      test('[a=(0,0)]=0');
    });

    it('ObjectAssignmentTarget', () => {
      test('({a=(0,0)}=0)');
    });

    it('AssignmentTargetPropertyIdentifier', () => {
      test('({a=0}=0)');
    });

    it('AssignmentTargetPropertyProperty', () => {
      test('({a:b}=0)');
    });

    it('AssignmentTargetWithDefault', () => {
      test('[a=0]=0');
      test('({a:b=0}=0)');
    });

    it('ArrayBinding', () => {
      test('let[]=0');
      test('let[...a]=0');
      test('let[a,...b]=0');
      test('let[a,b=0,...c]=0');
      test('let[,,]=0');
      test('let[,...a]=0');
      test('let[a=(0,0)]=0');
    });

    it('ObjectBinding', () => {
      test('let{a=(0,0)}=0');
    });

    it('BindingPropertyIdentifier', () => {
      test('let{a=0}=0');
    });

    it('BindingPropertyProperty', () => {
      test('let{a:b}=0');
    });

    it('BindingWithDefault', () => {
      test('let[a=0]=0');
      test('let{a:b=0}=0');
    });

    it('ClassDeclaration', () => {
      test('class A{}');
      test('class A extends B{}');
      test('class A extends(B,C){}');
      test('class A extends(+B){}');
      test('class A extends(()=>0){}');
      test('class A extends[]{}');
      test('class A extends{}{}');
      test('class A extends B(){}');
      test('class A extends new B{}');
      test('class A extends B.C{}');
    });

    it('ClassExpression', () => {
      test('(class{})');
      test('(class A{})');
      test('(class A extends B{})');
      test('(class extends B{})');
      test('(class A extends(B,C){})');
      test('(class A extends(+B){})');
      test('(class A extends(()=>0){})');
      test('(class A extends[]{})');
      test('(class A extends{}{})');
      test('(class A extends B(){})');
      test('(class A extends new B{})');
      test('(class A extends B.C{})');
    });

    it('ClassElement', () => {
      test('(class{a(){}})');
      test('(class{*a(){}})');
      test('(class{static a(){}})');
      test('(class{static*a(){}})');
      test('(class{constructor(){}})');
    });

    it('Sequence', () => {
      test('a,b,c,d');
    });

    it('Assignment', () => {
      test('a=b');
      test('a+=b');
      test('a*=b');
      test('a%=b');
      test('a**=b');
      test('a<<=b');
      test('a>>=b');
      test('a>>>=b');
      test('a/=b');
      test('a|=b');
      test('a^=b');
      test('a,b=c');
      test('a=b,c');
      test('a=(b,c)');
      test('a,b^=c');
      test('a^=b,c');
      test('a^=(b,c)');

      test('a.b=0');
      test('a[b]=0');
    });

    it('Conditional', () => {
      test('a?b:c');
      test('a?b?c:d:e');
      test('a?b:c?d:e');
      test('a?b?c:d:e?f:g');
      test('(a?b:c)?d:e');
      test('(a,b)?(c,d):(e,f)');
      test('a?b=c:d');
      test('a?b=c:d=e');
      test('a||b?c=d:e=f');
      test('(a=b)?c:d');
      test('a||(b?c:d)');
      test('a?b||c:d');
      test('a?b:c||d');
    });

    it('LogicalOr', () => {
      test('a||b');
    });

    it('LogicalAnd', () => {
      test('a||b');
    });

    it('BitwiseOr', () => {
      test('a|b');
    });

    it('BitwiseAnd', () => {
      test('a&b');
    });

    it('BitwiseXor', () => {
      test('a^b');
      test('a^b&b');
      test('(a^b)&b');
    });

    it('Equality', () => {
      test('a==b');
      test('a!=b');
      test('a==b');
      test('a!=b');
      test('a==b==c');
      test('a==(b==c)');
    });

    it('Relational', () => {
      test('a<b');
      test('a<=b');
      test('a>b');
      test('a>=b');
      test('a instanceof b');
      test('a in b');
      test('a==b<b');
      test('(a==b)<b');
      test('for((b in b);;);');
      test('for((b in b);b in b;b in b);');
      test('for(var a=(b in b);b in b;b in b);');
      test('for(var a=(b in b),c=(b in b);b in b;b in b);');
      test('for(b in c in d);');
    });

    it('Shift', () => {
      test('a<<b');
      test('a>>b');
      test('a>>>b');
      test('a<<b<<c');
      test('a<<(b<<c)');
      test('a<<b<c');
      test('a<<b<c');
      test('a<<(b<c)');
    });

    it('Additive', () => {
      test('a+b');
      test('a-b');
      test('a+(b+b)');
      test('a+(b<<b)');
      test('a+b<<b');
      test('(a<<b)+(c>>d)');
      test2('a*b+c/d', '(a*b)+(c/d)');
    });

    it('Multiplicative', () => {
      test('a*b');
      test('a/b');
      test('a%b');
      test('a%b%c');
      test('a%(b%c)');
      test('a+b%c');
      test('(a+b)%c');
      test('!a*b');
      test('a*(b+c)');

      test('a/i');
    });

    it('Exponential', () => {
      test('a**b');
      test('(a**b)**c');
      test('a**b**c');
      test('a*b**c');
      test('(a*b)**c');
      test('a**b*c');
      test('a**(b*c)');
      test('(-a)**b');
      test('-(a**b)');
      test('(void a)**b');
      test('void(a**b)');
    });

    it('PrefixExpression', () => {
      test('+a');
      test('-a');
      test('!a');
      test('~a');
      test('typeof a');
      test('void a');
      test('delete a.b');
      test('++a');
      test('--a');
      test('+ ++a');
      test('- --a');
      test('a+ +a');
      test('a-a');
      test('typeof-a');
      test('!a++');
      test('!!a');
      test('!!(a+a)');
    });

    it('PostfixExpression', () => {
      test('a++');
      test('a--');
    });

    it('NewCallMember', () => {
      test('new a');
      test('new a(a)');
      test('new a(a,b)');
      test('new this.a');
      test('a()');
      test('a(a)');
      test('a(a,b)');
      test('a((a,b))');
      test('new a((a,b))');
      test('a.a');
      test('a[a]');
      test2('new a', 'new a()');
      test('new a(a)');
      test2('(new a).a', 'new a().a');
      test('new a(a).v');
      test('new(a(a).v)');
      test('(new a)()');
      test2('(new new a(a).a.a).a', '(new (new a(a).a).a).a');
      test2('new((new a)().a)', 'new((new a)()).a');
      test('new a.a');
      test('new(a().a)');
    });

    it('LiteralRegExpExpression', () => {
      test('a/ /b/');
      test('/a/');
      test('/a/i');
      test('/a/gi');
      test('/a\\s/gi');
      test('/a\\r/gi');
      test('/a\\r/ instanceof 3');
      test('/a\\r/g instanceof 3');
      test('/a/ in 0');
    });

    it('LiteralBooleanExpression', () => {
      test('true');
      test('false');
    });

    it('LiteralNullExpression', () => {
      test('null');
      test2('null', 'nul\\u006c');
    });

    it('FunctionDeclaration', () => {
      test('function f(){}');
      test('function*f(){}');
      test('function f(a){}');
      test('function f(a,b){}');
      test('function f(a,b,...rest){}');
    });

    it('FunctionExpression', () => {
      test('(function(){})');
      test('(function f(){})');
      test('(function*(){})');
      test('(function*f(){})');
    });

    it('ArrowExpression', () => {
      test('a=>a');
      test('()=>a');
      test2('a=>a', '(a)=>a');
      test('(...a)=>a');
      test('(...[])=>0');
      test('(a,...b)=>a');
      test('(a=0)=>a');
      test('(a,b)=>a');
      test('({a})=>a');
      test('({a=0})=>a');
      test('([a])=>a');
      test('a=>({})');
      test('a=>{}');
      test('a=>{({})}');
      test('a=>{0;return}');
      test('()=>function(){}');
      test('()=>class{}');
      test('()=>(1,2)');
      test('(()=>0)()');
      test('(a=(0,0))=>0');
    });

    it('NewTargetExpression', () => {
      test('function f(){new.target}');
      test2('function f(){new.target}', 'function f() { new . target }');
    });

    it('TemplateExpression', () => {
      test('``');
      test('````');
      test('a``');
      test('a.b``');
      test('a[b]``');
      test('a()``');
      test('(a+b)``');
      test2('(function(){}``)', '(function(){})``');
      test2('(class{}``)', '(class{})``');
      test2('({}``)', '({})``');
      test('`a`');
      test('a`a`');
      test('`a${b}c`');
      test('`${a}`');
      test('`${a}${b}`');
      test('` ${a} ${b} `');
      test2('` ${a} ${b} `', '` ${ a } ${ b } `');
      test('`a\\${b}c`');
      test('``.a');
      test('``()');
      test('new``');
      test2('new``', 'new ``()');
      test2('new``(a)', 'new ``(a)');
    });

    it('Super', () => {
      test('class A extends B{constructor(){super()}}');
      test('({m(){super.m()}})');
    });

    it('YieldExpression', () => {
      test('function*f(){yield}');
      test('function*f(){yield a}');
      test('function*f(){yield 0}');
      test('function*f(){yield{}}');
      test('function*f(){yield a+b}');
      test('function*f(){yield a=b}');
      test('function*f(){yield(a,b)}');
      test('function*f(){f(yield,yield)}');
      test('function*f(){f(yield a,yield b)}');
      test('function*f(){yield yield yield}');
    });

    it('YieldGeneratorExpression', () => {
      test('function*f(){yield*a}');
      test('function*f(){yield*0}');
      test('function*f(){yield*{}}');
      test('function*f(){yield*a+b}');
      test('function*f(){yield*a=b}');
      test('function*f(){yield*(a,b)}');
      test('function*f(){f(yield*a,yield*b)}');
      test('function*f(){yield*yield*(yield)*(yield)}');
    });

    it('ForOfStatement', () => {
      test('for(a of b);');
      test('for(a of(1,2));');
      test('for([a]of[b]);');
      test('for(let[a]of[b]);');
      testScript('for((let)of b);');
      testScript('for((let.a)of b);');
      testScript('for((let[a])of b);');
      test2Script('for((let.a)of b);', 'for((let).a of b);');
      test('for(a of(b,c));');
    });

    it('LiteralNumericExpression', () => {
      test('0');
      test2('0', '0x0');
      test2('0', '0o0');
      test2('0', '0b0');
      test('1');
      test('2');
      test('0x38D7EA4C68001');
      test('0x38D7EA4C68001.valueOf()');
      test2('15e5', '1500000');
      test2('155e3', '155000');
      test('.1');
      test2('.1', '0.1');
      // floats
      test('1.1.valueOf()');
      test('15..valueOf()');
      test('1..valueOf()');
      test2('1e300.valueOf()', '1e+300.valueOf()');
      test2('8e15.valueOf()', '8000000000000000..valueOf()');
      test2('1e20', '100000000000000000001');
      test2('10..valueOf()', '1e1.valueOf()');
      test2('1', '1e0');
      test2('10', '1e1');
      test2('100', '1e2');
      test('1e3');
      test('1e4');
      test2('1e5', '100000');
      test2('1.3754889325393114', '1.3754889325393114');
      test2('1.3754889325393114e24', '0x0123456789abcdefABCDEF');
      test2('4.185580496821357e298', '4.1855804968213567e+298');
      test2('5.562684646268003e-308', '5.5626846462680035e-308');
      test2('5.562684646268003e-309', '5.5626846462680035e-309');
      test2('2147483648', '2147483648.0');
      test('1e-7');
      test('1e-8');
      test('1e-9');
      test2('1e308', '1e+308');
      test('1e308');
      test('1e-308');
    });

    it('LiteralInfinityExpression', () => {
      test2('2e308', '2e308');
      test2('1+2e308', '1+2e308');
      test2('2e308', '3e308');
    });

    it('LiteralStringExpression', () => {
      test('("")');
      test2('("")', '(\'\')');
      test2('("a")', '(\'a\')');
      test2('(\'"\')', '("\\"")');
      test2('("a")', '(\'a\')');
      test2('("\'")', '(\'\\\'\')');
      test('("a")');
      test('(\'"\')');
      test('("\b\\n\\r\t\v\f\\\\\\"\'\\u2028\\u2029日本")');
    });

    it('BlockStatement', () => {
      test('{}');
      test('{{}}');
      test('{a:{}}');
      test2('{a;b}', '{a\nb\n}');
    });

    it('BreakStatement', () => {
      test2('while(1)break', 'while(1)break');
      test2('while(1){break;break}', 'while(1){break;break;}');
      test2('a:while(1){break;break a}', 'a:while(1){break;break a;}');
      test2('switch(1){case 1:break}', 'switch(1){case 1:break;}');
    });

    it('ContinueStatement', () => {
      test2('while(1)continue', 'while(1)continue');
      test2('while(1){continue;continue}', 'while(1){continue;continue;}');
      test2('a:while(1){continue;continue a}', 'a:while(1){continue;continue a;}');
    });

    it('DebuggerStatement', () => {
      test2('debugger', 'debugger');
    });

    it('DoWhileStatement', () => {
      test2('do;while(1)', 'do;while(1)');
      test2('do{}while(1)', 'do{}while(1)');
      test('do debugger;while(1)');
      test('do if(3){}while(1)');
      test2('do 3;while(1)', 'do(3);while(1)');
    });

    it('ExpressionStatement', () => {
      test('a');
      test('({a:3})');
      test('(function(){})');
      test('(class{})');
      testScript('let');
      testScript('(let[a])');
      testScript('(let[a]++)');
      testScript('(let[a]=0)');
      testScript('(let[a].b`c`||e?f:g)');
      test('do({a:3});while(1)');
      test('~{a:3}');
      test('({a:3}+1)');
      test('a:~{a:3}');
      test('~function(){}');
      test('~function(){}()');
      test('function name(){}');
    });

    it('ForInStatement', () => {
      test('for(var a in 1);');
      testScript('for((let)in 1);');
      test('for(a in 1);');
      test('for(a in 1,2);');
      testScript('for((let)in b);');
      testScript('for((let.a)in b);');
      testScript('for((let[a])in b);');
      test2Script('for((let.a)in b);', 'for((let).a in b);');
    });

    it('ForStatement', () => {
      test('for(var i=(1 in[]);;);');
      test('for(var i=(1 in[]),b,c=(1 in[]);;);');
      test('for(var a=(b=>c in 0);;);');
      test('!function*(){for((yield a in 0);;);}');
      test('!function*(){for((yield*a in 0);;);}');
      test('for((1 in[]);;);');
      test('for(1*(1 in[]);;);');
      test('for(1*(1+1 in[]);;);');
      test('for(1*(1+1 in[]);;);');
      test('for(1*(1+(1 in[]));;);');
    });

    it('IfStatement', () => {
      test('if(a);');
      test('if(a)b');
      test('if(a)if(a)b');
      test('if(a){}');
      test('if(a);else;');
      test('if(a);else{}');
      test('if(a){}else{}');
      test('if(a)if(a){}else{}else{}');
      let IDENT = { type: 'IdentifierExpression', name: 'a' };
      let EMPTY = { type: 'EmptyStatement' };

      let MISSING_ELSE = { type: 'IfStatement', test: IDENT, consequent: EMPTY, alternate: null };
      testShiftLoose('if(a){if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: MISSING_ELSE, alternate: EMPTY })
      );
      testShiftLoose('if(a){a:if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: { type: 'LabeledStatement', label: 'a', body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose('if(a){if(a);else if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: { type: 'IfStatement', test: IDENT, consequent: EMPTY, alternate: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose('if(a){while(a)if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: { type: 'WhileStatement', test: IDENT, body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose('if(a){with(a)if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: { type: 'WithStatement', object: IDENT, body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose('if(a){for(;;)if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: { type: 'ForStatement', init: null, test: null, update: null, body: MISSING_ELSE }, alternate: EMPTY })
      );
      testShiftLoose('if(a){for(a in a)if(a);}else;',
        statement({ type: 'IfStatement', test: IDENT, consequent: { type: 'ForInStatement', left: IDENT, right: IDENT, body: MISSING_ELSE }, alternate: EMPTY })
      );
    });

    it('LabeledStatement', () => {
      test('a:;');
      test('a:b:;');
    });

    it('ReturnStatement', () => {
      test('function a(){return}');
      test('function a(){return 0}');
      test('function a(){return function a(){return 0}}');
    });

    it('SwitchStatement', () => {
      test('switch(0){}');
      test('switch(0){default:}');
      test('switch(0){case 0:default:}');
      test('switch(0){case 0:a;default:c:b}');
    });

    it('ThrowStatement', () => {
      test('throw 0');
      test('throw(1<1)+1');
    });

    it('TryStatement', () => {
      test('try{}catch(a){}');
      test('try{}catch(a){}finally{}');
      test('try{}finally{}');
    });

    it('VariableDeclarationStatement', () => {
      test('var a=0');
      test('var a=0,b=0');
      test('var a=(0,0)');
      test('var a=(0,0,0)');
      test('var a');
      test('var a,b');
      test('var a=""in{}');
    });

    it('WhileStatement', () => {
      test('while(0);');
      test('while(0)while(0);');
    });

    it('WithStatement', () => {
      testShift('with(null);',
        statement({ type: 'WithStatement', object: { type: 'LiteralNullExpression' }, body: { type: 'EmptyStatement' } })
      );
    });

    it('Import', () => {
      test('import"m"');
      test('import"m";0');
      test('import a from"m"');
      test('import{a}from"m"');
      test('import{a,b}from"m"');
      test('import a,{b}from"m"');
      test('import a,{b,c}from"m"');
      test('import a,{b,c}from"m";0');
      test2('import"m"', 'import {} from "m"');
      test2('import a from"m"', 'import a,{}from "m"');
    });

    it('ImportNamespace', () => {
      test('import*as a from"m"');
      test('import*as a from"m";0');
      test('import a,*as b from"m"');
    });

    it('ImportSpecifier', () => {
      test('import{a}from"m"');
      test('import{a}from"m";0');
      test('import{a as b}from"m"');
      test('import{a,b}from"m"');
      test('import{a,b as c}from"m"');
      test('import{a as b,c}from"m"');
      test('import{a as b,c as d}from"m"');
    });

    it('ExportAllFrom', () => {
      test('export*from"m"');
      test('export*from"m";0');
    });

    it('ExportFrom', () => {
      test('export{}from"m"');
      test('export{}from"m";0');
      test('export{a}from"m"');
      test('export{a as b}from"m"');
      test('export{a,b}from"m"');
    });

    it('ExportLocals', () => {
      test('export{}');
      test('export{};0');
      test('let a;export{a}');
      test('let a;export{a as b}');
      test('let a,b;export{a,b}');
    });

    it('Export', () => {
      test('export var a');
      test('export var a;0');
      test('export var a=0');
      test('export var a,b');
      test('export var a=0,b=0');
      test('export const a=0');
      test('export let a');
      test('export function f(){}');
      test('export function f(){}0');
      test('export class A{}');
      test('export class A{}0');
    });

    it('ExportDefault', () => {
      test('export default function(){}');
      test('export default function(){}0');
      test('export default 0');
      test('export default 0;0');
      test('export default function f(){}');
      test('export default function*f(){}');
      test('export default class{}');
      test('export default class A{}');
      test('export default(class{})');
      test('export default(function(){})');
      test('export default{}');
      test('export default(0,0)');
    });

    it('ExportSpecifier', () => {
      test('let a;export{a}');
      test('let a,b;export{a as b}');
      test('let a,b;export{a,b}');
      test('let a,b,c;export{a,b as c}');
      test('let a,b,c;export{a as b,c}');
      test('let a,b,c,d;export{a as b,c as d}');
    });

    it('Module', () => {
      test('');
      test('a;a');
    });

    it('ComputedMemberAssignmentTarget', () => {
      test('(a.b++)[0]=1');
    });

    it('ComputedPropertyName', () => {
      test('({[(0,0)]:0})');
    });
  });
});

describe('Pretty code generator', () => {
  function testPretty(source, scriptMode) {
    let parseTest = scriptMode ? parseScript : parse;
    expect(codeGen(parseTest(source), new FormattedCodeGen)).be(source);
    expect(parseTest(codeGen(parseTest(source), new FormattedCodeGen))).eql(parseTest(source));
  }

  function testLoose(to, tree) {
    if (arguments.length !== 2) {
      throw new Error('Not supported');
    }
    expect(codeGen(tree, new FormattedCodeGen)).eql(to);
  }

  it('should output a newline after brace', () => {
    testPretty('export default function () {\n  null;\n}\n');
  });

  it('should output a newline after semiOp', () => {
    testPretty('export const FOO = 123;\n');
  });

  it('should output no newline after semi', () => {
    testPretty('(function () {\n  for (var x = 0;;) {}\n});\n');
  });

  it('should indent', () => {
    testPretty('function f() {\n  function g() {\n    null;\n    l: for (;;) {\n      break l;\n    }\n  }\n}\n');
  });

  it('should insert spaces in expressions', () => {
    testPretty('let [x, , y] = (0 + 1, {a: 2, b: 3}, (c, d) => (4, 5));\n');
  });

  it('should insert spaces in statements', () => {
    testPretty('with ({}) {}\n', true);
  });

  it('should put else and while inline', () => {
    testPretty('if (0) {} else {}\n');
    testPretty('do {} while (true);\n');
  });

  it('should not output linebreaks after function expressions', () => {
    testPretty('(function () {});\n');
  });

  it('should indent appropriately within expressions', () => {
    testPretty('[function () {\n  [function () {\n    let x = a in b;\n  }];\n}];\n');
  });

  it('should add spaces to the appropriate unary operations', () => {
    testPretty('++x;\n--x;\n+[];\n-[];\n+[];\n![];\n~[];\nvoid [];\ntypeof [];\ndelete [];\n');
  });

  it('should pretty-print switch statements', () => {
    testPretty('switch (0) {\n  case 0:\n  case 1:\n    0;\n  default:\n    0;\n    0;\n  case 3:\n    0;\n    0;\n  case 4:\n}\n');
  });

  it('should handle literal string expressions and directives properly', () => {
    testPretty('\'"\';\n("expression");\n');
  });

  it('should continue handling missing-else condition appropriately', () => {
    function statement(stmt) {
      return { type: 'Script', directives: [], statements: [stmt] };
    }

    let IDENT = { type: 'IdentifierExpression', name: 'a' };
    let EMPTY = { type: 'EmptyStatement' };

    let MISSING_ELSE = { type: 'IfStatement', test: IDENT, consequent: EMPTY, alternate: null };
    testLoose('if (a) {\n  if (a) ;\n} else ;\n',
      statement({ type: 'IfStatement', test: IDENT, consequent: MISSING_ELSE, alternate: EMPTY })
    );
  });

  it('should print the empty script as the empty script', () => {
    testPretty('', true);
  });

  it('should print directives with linebreaks', () => {
    testPretty('"use strict";\n!function () {\n  "use strict";\n};\n', true);
  });

  it('should pretty-print exports', () => {
    testPretty('export {a} from "b";\n');
    testPretty('let a;\nexport {a};\n');
  });
});

describe('CodeRep', () => {
  it('should call forEach the appropriate number of times', () => {
    let tree = reduce(new MinimalCodeGen, parse('f(0,1,(2,3))'));
    let count = 0;
    tree.forEach(() => {
      ++count;
    });
    expect(count).eql(14);
  });
});
