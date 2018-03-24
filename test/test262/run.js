'use strict';

const parseScript = require('shift-parser').parseScript;
const parseModule = require('shift-parser').parseModule;
const codegen = require('../..');
const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

const testExpectations = require('./expectations');

const treesDir = 'node_modules/shift-parser-expectations/expectations';


function assertSuccessfulCodegen(expectedTree, parse) {
  const rendered = codegen.default(expectedTree);
  const actualTree = parse(rendered);
  expect(expectedTree).to.eql(actualTree);

  const formattedRendered = codegen.default(expectedTree, new codegen.FormattedCodeGen);
  const formattedActualTree = parse(formattedRendered);
  expect(expectedTree).to.eql(formattedActualTree);
}

describe('test262', () => {
  const achievedFailures = [];
  for (const f of fs.readdirSync(treesDir).filter(name => /tree.json$/.test(name))) {
    const json = fs.readFileSync(path.join(treesDir, f), 'utf8');
    const tree = JSON.parse(json, (k, v) => k === 'loc' ? void 0 : v);

    try {
      assertSuccessfulCodegen(tree, /module.js/.test(f) ? parseModule : parseScript);
    } catch (e) {
      if (testExpectations.xfail.indexOf(f) !== -1) {
        achievedFailures.push(f);
        continue;
      }
      throw e;
    }
  }

  for (const f of testExpectations.xfail) {
    if (achievedFailures.indexOf(f) === -1) {
      throw new Error('Marked as xfailed, but didn\'t fail: ' + f);
    }
  }
});
