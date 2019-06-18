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

'use strict';

let fs = require('fs');
let expect = require('expect.js');
let codeGen = require('../').default;
let MinimalCodeGen = require('../').MinimalCodeGen;
let FormattedCodeGen = require('../').FormattedCodeGen;
let ExtensibleCodeGen = require('../').ExtensibleCodeGen;
let parseModule = require('shift-parser').parseModule;
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
    expect(parseModule(codeGen(parseModule(source)))).eql(parseModule(source));

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

    function testModule(source) {
      if (arguments.length !== 1) {
        throw new Error('Not supported');
      }
      expect(codeGen(parseModule(source))).be(source);
      expect(codeGen(parseModule(source), new ExtensibleCodeGen)).be(source);
      expect(parseModule(codeGen(parseModule(source)))).eql(parseModule(source));
      expect(parseModule(codeGen(parseModule(source), new FormattedCodeGen))).eql(parseModule(source));
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
      expect(codeGen(parseModule(source))).be(expected);
      expect(codeGen(parseModule(source), new ExtensibleCodeGen)).be(expected);
      expect(codeGen(parseModule(expected))).be(expected);
      expect(codeGen(parseModule(expected), new ExtensibleCodeGen)).be(expected);
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
      testModule('"use strict"');
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
      testModule('"\\\n\'"');
    });

    it('ArrayExpression', () => {
      testModule('[]');
      testModule('[a]');
      test2('[a]', '[a,]');
      test2('[a,b,c]', '[a,b,c,]');
      testModule('[a,,]');
      testModule('[a,,,]');
      testModule('[[a]]');
      testModule('[(a,a)]');
    });

    it('SpreadElement', () => {
      testModule('[...a]');
      testModule('[...a,...b]');
      testModule('[...a,b,...c]');
      testModule('[...a=b]');
      testModule('[...(a,b)]');
      testModule('f(...a)');
    });

    it('ObjectExpression', () => {
      testModule('({})');
      test2('({a:1})', '({a:1,})');
      testModule('({}.a--)');
      test2('({1:1})', '({1.0:1})');
      testModule('({a:b})');
      test2('({255:0})', '({0xFF:0})');
      test2('({63:0})', '({0o77:0})');
      test2('({3:0})', '({0b11:0})');
      test2('({0:0})', '({0.:0})');
      test2('({0:0})', '({.0:0})');
      test2('({.1:0})', '({0.1:0})');
      testModule('({.1:0})');
      testModule('({"+0":b})');
      testModule('({"+1":b})');
      testModule('({"-0":b})');
      testModule('({"-1":b})');
      testModule('({".1":b})');
      testModule('({"01":b})');
      testModule('({"0x1":b})');
      testModule('({" 0":b})');
      testModule('({"  0":b})');
      testModule('({"\t0":b})');
      test2('({"\t0":b})', '({"\\t0":b})');
      testModule('({"\\n0":b})');
      testModule('({[a]:b})');
      test2('({a:b})', '({"a":b})');
      testModule('({" ":b})');
      testModule('({get a(){;}})');
      testModule('({set a(param){;}})');
      testModule('({get a(){;},set a(param){;},b:1})');
      testModule('({a:(a,b)})');
      testModule('({a})');
      testModule('({async a(){}})');
      testModule('({...{}})');
      testModule('({...a.b}=0)');
      testModule('({a,b:0,c})');
      testModule('({...a=[]})');
    });

    it('AwaitExpression', () => {
      testModule('async function f(){await 0}');
      testModule('async function f(){await(a+b)}');
    });

    it('ForAwaitExpression', () => {
      testModule('(async function(){for await(a of b);}())');
    });

    it('ArrayAssignmentTarget', () => {
      testModule('[]=0');
      testModule('[...a]=0');
      testModule('[a,...a]=0');
      testModule('[a,a=0,...a]=0');
      testModule('[,,]=0');
      testModule('[,...a]=0');
      testModule('[a=(0,0)]=0');
    });

    it('ObjectAssignmentTarget', () => {
      testModule('({a=(0,0)}=0)');
      testModule('({a,...b}={})');
      testModule('({}=0)');
      testModule('({...a}={})');
    });

    it('AssignmentTargetPropertyIdentifier', () => {
      testModule('({a=0}=0)');
    });

    it('AssignmentTargetPropertyProperty', () => {
      testModule('({a:b}=0)');
    });

    it('AssignmentTargetWithDefault', () => {
      testModule('[a=0]=0');
      testModule('({a:b=0}=0)');
    });

    it('ArrayBinding', () => {
      testModule('let[]=0');
      testModule('let[...a]=0');
      testModule('let[a,...b]=0');
      testModule('let[a,b=0,...c]=0');
      testModule('let[,,]=0');
      testModule('let[,...a]=0');
      testModule('let[a=(0,0)]=0');
    });

    it('ObjectBinding', () => {
      testModule('let{a=(0,0)}=0');
      testModule('let{a,...b}={}');
      testModule('let{}=0');
      testModule('let{...a}={}');
    });

    it('BindingPropertyIdentifier', () => {
      testModule('let{a=0}=0');
    });

    it('BindingPropertyProperty', () => {
      testModule('let{a:b}=0');
    });

    it('BindingWithDefault', () => {
      testModule('let[a=0]=0');
      testModule('let{a:b=0}=0');
    });

    it('ClassDeclaration', () => {
      testModule('class A{}');
      testModule('class A extends B{}');
      testModule('class A extends(B,C){}');
      testModule('class A extends(+B){}');
      testModule('class A extends(()=>0){}');
      testModule('class A extends[]{}');
      testModule('class A extends{}{}');
      testModule('class A extends B(){}');
      testModule('class A extends new B{}');
      testModule('class A extends B.C{}');
    });

    it('ClassExpression', () => {
      testModule('(class{})');
      testModule('(class A{})');
      testModule('(class A extends B{})');
      testModule('(class extends B{})');
      testModule('(class A extends(B,C){})');
      testModule('(class A extends(+B){})');
      testModule('(class A extends(()=>0){})');
      testModule('(class A extends[]{})');
      testModule('(class A extends{}{})');
      testModule('(class A extends B(){})');
      testModule('(class A extends new B{})');
      testModule('(class A extends B.C{})');
    });

    it('ClassElement', () => {
      testModule('(class{a(){}})');
      testModule('(class{*a(){}})');
      testModule('(class{static a(){}})');
      testModule('(class{static*a(){}})');
      testModule('(class{constructor(){}})');
    });

    it('Sequence', () => {
      testModule('a,b,c,d');
    });

    it('Assignment', () => {
      testModule('a=b');
      testModule('a+=b');
      testModule('a*=b');
      testModule('a%=b');
      testModule('a**=b');
      testModule('a<<=b');
      testModule('a>>=b');
      testModule('a>>>=b');
      testModule('a/=b');
      testModule('a|=b');
      testModule('a^=b');
      testModule('a,b=c');
      testModule('a=b,c');
      testModule('a=(b,c)');
      testModule('a,b^=c');
      testModule('a^=b,c');
      testModule('a^=(b,c)');

      testModule('a.b=0');
      testModule('a[b]=0');
    });

    it('Conditional', () => {
      testModule('a?b:c');
      testModule('a?b?c:d:e');
      testModule('a?b:c?d:e');
      testModule('a?b?c:d:e?f:g');
      testModule('(a?b:c)?d:e');
      testModule('(a,b)?(c,d):(e,f)');
      testModule('a?b=c:d');
      testModule('a?b=c:d=e');
      testModule('a||b?c=d:e=f');
      testModule('(a=b)?c:d');
      testModule('a||(b?c:d)');
      testModule('a?b||c:d');
      testModule('a?b:c||d');
    });

    it('LogicalOr', () => {
      testModule('a||b');
    });

    it('LogicalAnd', () => {
      testModule('a||b');
    });

    it('BitwiseOr', () => {
      testModule('a|b');
    });

    it('BitwiseAnd', () => {
      testModule('a&b');
    });

    it('BitwiseXor', () => {
      testModule('a^b');
      testModule('a^b&b');
      testModule('(a^b)&b');
    });

    it('Equality', () => {
      testModule('a==b');
      testModule('a!=b');
      testModule('a==b');
      testModule('a!=b');
      testModule('a==b==c');
      testModule('a==(b==c)');
    });

    it('Relational', () => {
      testModule('a<b');
      testModule('a<=b');
      testModule('a>b');
      testModule('a>=b');
      testModule('a instanceof b');
      testModule('a in b');
      testModule('a==b<b');
      testModule('(a==b)<b');
      testModule('for((b in b);;);');
      testModule('for((b in b);b in b;b in b);');
      testModule('for(var a=(b in b);b in b;b in b);');
      testModule('for(var a=(b in b),c=(b in b);b in b;b in b);');
      testModule('for(b in c in d);');
    });

    it('Shift', () => {
      testModule('a<<b');
      testModule('a>>b');
      testModule('a>>>b');
      testModule('a<<b<<c');
      testModule('a<<(b<<c)');
      testModule('a<<b<c');
      testModule('a<<b<c');
      testModule('a<<(b<c)');
    });

    it('Additive', () => {
      testModule('a+b');
      testModule('a-b');
      testModule('a+(b+b)');
      testModule('a+(b<<b)');
      testModule('a+b<<b');
      testModule('(a<<b)+(c>>d)');
      test2('a*b+c/d', '(a*b)+(c/d)');
    });

    it('Multiplicative', () => {
      testModule('a*b');
      testModule('a/b');
      testModule('a%b');
      testModule('a%b%c');
      testModule('a%(b%c)');
      testModule('a+b%c');
      testModule('(a+b)%c');
      testModule('!a*b');
      testModule('a*(b+c)');

      testModule('a/i');
    });

    it('Exponential', () => {
      testModule('a**b');
      testModule('(a**b)**c');
      testModule('a**b**c');
      testModule('a*b**c');
      testModule('(a*b)**c');
      testModule('a**b*c');
      testModule('a**(b*c)');
      testModule('(-a)**b');
      testModule('-(a**b)');
      testModule('(void a)**b');
      testModule('void(a**b)');
    });

    it('PrefixExpression', () => {
      testModule('+a');
      testModule('-a');
      testModule('!a');
      testModule('~a');
      testModule('typeof a');
      testModule('void a');
      testModule('delete a.b');
      testModule('++a');
      testModule('--a');
      testModule('+ ++a');
      testModule('- --a');
      testModule('a+ +a');
      testModule('a-a');
      testModule('typeof-a');
      testModule('!a++');
      testModule('!!a');
      testModule('!!(a+a)');
    });

    it('PostfixExpression', () => {
      testModule('a++');
      testModule('a--');
    });

    it('NewCallMember', () => {
      testModule('new a');
      testModule('new a(a)');
      testModule('new a(a,b)');
      testModule('new this.a');
      testModule('a()');
      testModule('a(a)');
      testModule('a(a,b)');
      testModule('a((a,b))');
      testModule('new a((a,b))');
      testModule('a.a');
      testModule('a[a]');
      test2('new a', 'new a()');
      testModule('new a(a)');
      test2('(new a).a', 'new a().a');
      testModule('new a(a).v');
      testModule('new(a(a).v)');
      testModule('(new a)()');
      test2('(new new a(a).a.a).a', '(new (new a(a).a).a).a');
      test2('new((new a)().a)', 'new((new a)()).a');
      testModule('new a.a');
      testModule('new(a().a)');
    });

    it('LiteralRegExpExpression', () => {
      testModule('a/ /b/');
      testModule('/a/');
      testModule('/a/i');
      testModule('/a/gi');
      testModule('/a\\s/gi');
      testModule('/a\\r/gi');
      testModule('/a\\r/ instanceof 3');
      testModule('/a\\r/g instanceof 3');
      testModule('/a/ in 0');
      testModule('/a/;i');
    });

    it('LiteralBooleanExpression', () => {
      testModule('true');
      testModule('false');
    });

    it('LiteralNullExpression', () => {
      testModule('null');
    });

    it('FunctionDeclaration', () => {
      testModule('function f(){}');
      testModule('function*f(){}');
      testModule('function f(a){}');
      testModule('function f(a,b){}');
      testModule('function f(a,b,...rest){}');
      testModule('async function f(){}');
    });

    it('FunctionExpression', () => {
      testModule('(function(){})');
      testModule('(function f(){})');
      testModule('(function*(){})');
      testModule('(function*f(){})');
      testModule('(async function(){})');
    });

    it('ArrowExpression', () => {
      testModule('a=>a');
      testModule('()=>a');
      test2('a=>a', '(a)=>a');
      testModule('(...a)=>a');
      testModule('(...[])=>0');
      testModule('(a,...b)=>a');
      testModule('(a=0)=>a');
      testModule('(a,b)=>a');
      testModule('({a})=>a');
      testModule('({a=0})=>a');
      testModule('([a])=>a');
      testModule('a=>({})');
      testModule('a=>{}');
      testModule('a=>{({})}');
      testModule('a=>{0;return}');
      testModule('()=>function(){}');
      testModule('()=>class{}');
      testModule('()=>(1,2)');
      testModule('(()=>0)()');
      testModule('(a=(0,0))=>0');
      testModule('async()=>0');
      testModule('async a=>0');
      testModule('async(...a)=>0');
    });

    it('NewTargetExpression', () => {
      testModule('function f(){new.target}');
      test2('function f(){new.target}', 'function f() { new . target }');
    });

    it('TemplateExpression', () => {
      testModule('``');
      testModule('````');
      testModule('a``');
      testModule('a.b``');
      testModule('a[b]``');
      testModule('a()``');
      testModule('(a+b)``');
      test2('(function(){}``)', '(function(){})``');
      test2('(class{}``)', '(class{})``');
      test2('({}``)', '({})``');
      testModule('`a`');
      testModule('a`a`');
      testModule('`a${b}c`');
      testModule('`${a}`');
      testModule('`${a}${b}`');
      testModule('` ${a} ${b} `');
      test2('` ${a} ${b} `', '` ${ a } ${ b } `');
      testModule('`a\\${b}c`');
      testModule('``.a');
      testModule('``()');
      testModule('new``');
      test2('new``', 'new ``()');
      test2('new``(a)', 'new ``(a)');
    });

    it('Super', () => {
      testModule('class A extends B{constructor(){super()}}');
      testModule('({m(){super.m()}})');
    });

    it('YieldExpression', () => {
      testModule('function*f(){yield}');
      testModule('function*f(){yield a}');
      testModule('function*f(){yield 0}');
      testModule('function*f(){yield{}}');
      testModule('function*f(){yield a+b}');
      testModule('function*f(){yield a=b}');
      testModule('function*f(){yield(a,b)}');
      testModule('function*f(){f(yield,yield)}');
      testModule('function*f(){f(yield a,yield b)}');
      testModule('function*f(){yield yield yield}');
    });

    it('YieldGeneratorExpression', () => {
      testModule('function*f(){yield*a}');
      testModule('function*f(){yield*0}');
      testModule('function*f(){yield*{}}');
      testModule('function*f(){yield*a+b}');
      testModule('function*f(){yield*a=b}');
      testModule('function*f(){yield*(a,b)}');
      testModule('function*f(){f(yield*a,yield*b)}');
      testModule('function*f(){yield*yield*(yield)*(yield)}');
    });

    it('ForOfStatement', () => {
      testModule('for(a of b);');
      testModule('for(a of(1,2));');
      testModule('for([a]of[b]);');
      testModule('for(let[a]of[b]);');
      testScript('for((let)of b);');
      testScript('for((let.a)of b);');
      testScript('for((let[a])of b);');
      test2Script('for((let.a)of b);', 'for((let).a of b);');
      testModule('for(a of(b,c));');
    });

    it('LiteralNumericExpression', () => {
      testModule('0');
      test2('0', '0x0');
      test2('0', '0o0');
      test2('0', '0b0');
      testModule('1');
      testModule('2');
      testModule('0x38D7EA4C68001');
      testModule('0x38D7EA4C68001.valueOf()');
      test2('15e5', '1500000');
      test2('155e3', '155000');
      testModule('.1');
      test2('.1', '0.1');
      // floats
      testModule('1.1.valueOf()');
      testModule('15..valueOf()');
      testModule('1..valueOf()');
      test2('1e300.valueOf()', '1e+300.valueOf()');
      test2('8e15.valueOf()', '8000000000000000..valueOf()');
      test2('1e20', '100000000000000000001');
      test2('10..valueOf()', '1e1.valueOf()');
      test2('1', '1e0');
      test2('10', '1e1');
      test2('100', '1e2');
      testModule('1e3');
      testModule('1e4');
      test2('1e5', '100000');
      test2('1.3754889325393114', '1.3754889325393114');
      test2('1.3754889325393114e24', '0x0123456789abcdefABCDEF');
      test2('4.185580496821357e298', '4.1855804968213567e+298');
      test2('5.562684646268003e-308', '5.5626846462680035e-308');
      test2('5.562684646268003e-309', '5.5626846462680035e-309');
      test2('2147483648', '2147483648.0');
      testModule('1e-7');
      testModule('1e-8');
      testModule('1e-9');
      test2('1e308', '1e+308');
      testModule('1e308');
      testModule('1e-308');
    });

    it('LiteralInfinityExpression', () => {
      test2('2e308', '2e308');
      test2('1+2e308', '1+2e308');
      test2('2e308', '3e308');
    });

    it('LiteralStringExpression', () => {
      testModule('("")');
      test2('("")', '(\'\')');
      test2('("a")', '(\'a\')');
      test2('(\'"\')', '("\\"")');
      test2('("a")', '(\'a\')');
      test2('("\'")', '(\'\\\'\')');
      testModule('("a")');
      testModule('(\'"\')');
      testModule('("\b\\n\\r\t\v\f\\\\\\"\'\\u2028\\u2029日本")');
    });

    it('BlockStatement', () => {
      testModule('{}');
      testModule('{{}}');
      testModule('{a:{}}');
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
      testModule('do debugger;while(1)');
      testModule('do if(3){}while(1)');
      test2('do 3;while(1)', 'do(3);while(1)');
    });

    it('ExpressionStatement', () => {
      testModule('a');
      testModule('({a:3})');
      testModule('(function(){})');
      testModule('(class{})');
      testScript('let');
      testScript('(let[a])');
      testScript('(let[a]++)');
      testScript('(let[a]=0)');
      testScript('(let[a].b`c`||e?f:g)');
      testModule('do({a:3});while(1)');
      testModule('~{a:3}');
      testModule('({a:3}+1)');
      testModule('a:~{a:3}');
      testModule('~function(){}');
      testModule('~function(){}()');
      testModule('function name(){}');
    });

    it('ForInStatement', () => {
      testModule('for(var a in 1);');
      testScript('for((let)in 1);');
      testModule('for(a in 1);');
      testModule('for(a in 1,2);');
      testScript('for((let)in b);');
      testScript('for((let.a)in b);');
      testScript('for((let[a])in b);');
      test2Script('for((let.a)in b);', 'for((let).a in b);');
      testScript('for(var a=0 in 1);');
    });

    it('ForStatement', () => {
      testModule('for(var i=(1 in[]);;);');
      testModule('for(var i=(1 in[]),b,c=(1 in[]);;);');
      testModule('for(var a=(b=>c in 0);;);');
      testModule('!function*(){for((yield a in 0);;);}');
      testModule('!function*(){for((yield*a in 0);;);}');
      testModule('for((1 in[]);;);');
      testModule('for(1*(1 in[]);;);');
      testModule('for(1*(1+1 in[]);;);');
      testModule('for(1*(1+1 in[]);;);');
      testModule('for(1*(1+(1 in[]));;);');
    });

    it('IfStatement', () => {
      testModule('if(a);');
      testModule('if(a)b');
      testModule('if(a)if(a)b');
      testModule('if(a){}');
      testModule('if(a);else;');
      testModule('if(a);else{}');
      testModule('if(a){}else{}');
      testModule('if(a)if(a){}else{}else{}');
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
      testModule('a:;');
      testModule('a:b:;');
    });

    it('ReturnStatement', () => {
      testModule('function a(){return}');
      testModule('function a(){return 0}');
      testModule('function a(){return function a(){return 0}}');
    });

    it('SwitchStatement', () => {
      testModule('switch(0){}');
      testModule('switch(0){default:}');
      testModule('switch(0){case 0:default:}');
      testModule('switch(0){case 0:a;default:c:b}');
    });

    it('ThrowStatement', () => {
      testModule('throw 0');
      testModule('throw(1<1)+1');
    });

    it('TryStatement', () => {
      testModule('try{}catch(a){}');
      testModule('try{}catch(a){}finally{}');
      testModule('try{}finally{}');
    });

    it('VariableDeclarationStatement', () => {
      testModule('var a=0');
      testModule('var a=0,b=0');
      testModule('var a=(0,0)');
      testModule('var a=(0,0,0)');
      testModule('var a');
      testModule('var a,b');
      testModule('var a=""in{}');
    });

    it('WhileStatement', () => {
      testModule('while(0);');
      testModule('while(0)while(0);');
    });

    it('WithStatement', () => {
      testShift('with(null);',
        statement({ type: 'WithStatement', object: { type: 'LiteralNullExpression' }, body: { type: 'EmptyStatement' } })
      );
    });

    it('Import', () => {
      testModule('import"m"');
      testModule('import"m";0');
      testModule('import a from"m"');
      testModule('import{a}from"m"');
      testModule('import{a,b}from"m"');
      testModule('import a,{b}from"m"');
      testModule('import a,{b,c}from"m"');
      testModule('import a,{b,c}from"m";0');
      test2('import"m"', 'import {} from "m"');
      test2('import a from"m"', 'import a,{}from "m"');
    });

    it('ImportNamespace', () => {
      testModule('import*as a from"m"');
      testModule('import*as a from"m";0');
      testModule('import a,*as b from"m"');
    });

    it('ImportSpecifier', () => {
      testModule('import{a}from"m"');
      testModule('import{a}from"m";0');
      testModule('import{a as b}from"m"');
      testModule('import{a,b}from"m"');
      testModule('import{a,b as c}from"m"');
      testModule('import{a as b,c}from"m"');
      testModule('import{a as b,c as d}from"m"');
    });

    it('ExportAllFrom', () => {
      testModule('export*from"m"');
      testModule('export*from"m";0');
    });

    it('ExportFrom', () => {
      testModule('export{}from"m"');
      testModule('export{}from"m";0');
      testModule('export{a}from"m"');
      testModule('export{a as b}from"m"');
      testModule('export{a,b}from"m"');
    });

    it('ExportLocals', () => {
      testModule('export{}');
      testModule('export{};0');
      testModule('let a;export{a}');
      testModule('let a;export{a as b}');
      testModule('let a,b;export{a,b}');
    });

    it('Export', () => {
      testModule('export var a');
      testModule('export var a;0');
      testModule('export var a=0');
      testModule('export var a,b');
      testModule('export var a=0,b=0');
      testModule('export const a=0');
      testModule('export let a');
      testModule('export function f(){}');
      testModule('export function f(){}0');
      testModule('export class A{}');
      testModule('export class A{}0');
    });

    it('ExportDefault', () => {
      testModule('export default function(){}');
      testModule('export default function(){}0');
      testModule('export default 0');
      testModule('export default 0;0');
      testModule('export default function f(){}');
      testModule('export default function*f(){}');
      testModule('export default class{}');
      testModule('export default class A{}');
      testModule('export default(class{})');
      testModule('export default(function(){})');
      testModule('export default{}');
      testModule('export default(0,0)');
    });

    it('ExportSpecifier', () => {
      testModule('let a;export{a}');
      testModule('let a,b;export{a as b}');
      testModule('let a,b;export{a,b}');
      testModule('let a,b,c;export{a,b as c}');
      testModule('let a,b,c;export{a as b,c}');
      testModule('let a,b,c,d;export{a as b,c as d}');
    });

    it('Module', () => {
      testModule('');
      testModule('a;a');
    });

    it('ComputedMemberAssignmentTarget', () => {
      testModule('(a.b++)[0]=1');
    });

    it('ComputedPropertyName', () => {
      testModule('({[(0,0)]:0})');
    });

    it('HTML comments', () => {
      testScript('a<! --b');
    });
  });
});

describe('Pretty code generator', () => {
  function testPretty(source, scriptMode) {
    let parseTest = scriptMode ? parseScript : parseModule;
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
    let tree = reduce(new MinimalCodeGen, parseModule('f(0,1,(2,3))'));
    let count = 0;
    tree.forEach(() => {
      ++count;
    });
    expect(count).eql(14);
  });
});
