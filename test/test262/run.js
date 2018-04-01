'use strict';

const parseScriptWithLocation = require('shift-parser').parseScriptWithLocation;
const parseModuleWithLocation = require('shift-parser').parseModuleWithLocation;
const codegen = require('../..');
const fs = require('fs');
const path = require('path');
const expect = require('expect.js');

const testExpectations = require('./expectations');

const treesDir = 'node_modules/shift-parser-expectations/expectations';


function assertLocationsEqual(expectedNode, actualNode, expectedLocations, actualLocations) {
  if (expectedLocations.has(expectedNode) && actualLocations.has(actualNode)) {
    expect(actualLocations.get(actualNode)).to.eql(expectedLocations.get(expectedNode));
  } else if (expectedLocations.has(expectedNode)) {
    throw new Error('unexpectedly missing ' + expectedNode.type);
  } else if (actualLocations.has(actualNode)) {
    throw new Error('unexpectedly has ' + actualNode.type);
  }

  for (let key of Object.keys(expectedNode)) {
    let child = expectedNode[key];
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; ++i) {
        if (typeof child[i] !== 'object' || child[i] == null) {
          continue;
        }
        assertLocationsEqual(child[i], actualNode[key][i], expectedLocations, actualLocations);
      }
    } else if (typeof child === 'object' && child != null) {
      assertLocationsEqual(child, actualNode[key], expectedLocations, actualLocations);
    }
  }
}

function assertSuccessfulCodegen(expectedTree, parse) {
  const codegened = codegen.codeGenWithLocation(expectedTree);
  const parsed = parse(codegened.source);
  expect(expectedTree).to.eql(parsed.tree);

  assertLocationsEqual(parsed.tree, expectedTree, parsed.locations, codegened.locations);


  const formattedRendered = codegen.default(expectedTree, new codegen.FormattedCodeGen);
  const formattedActualTree = parse(formattedRendered).tree;
  expect(expectedTree).to.eql(formattedActualTree);
}

suite('test262', () => {
  const achievedFailures = [];
  for (const f of fs.readdirSync(treesDir).filter(name => /tree.json$/.test(name))) {
    const json = fs.readFileSync(path.join(treesDir, f), 'utf8');
    const tree = JSON.parse(json, (k, v) => k === 'loc' ? void 0 : v);

    test(`round-trips through x => parse(codegen(x)) [${f}]`, () => {
      try {
        assertSuccessfulCodegen(tree, /module.js/.test(f) ? parseModuleWithLocation : parseScriptWithLocation);
      } catch (e) {
        if (testExpectations.xfail.indexOf(f) !== -1) {
          achievedFailures.push(f);
          return;
        }
        throw e;
      }
    });
  }

  test('xfails', () => {
    const unexpectedlyPassed = testExpectations.xfail.filter(f => achievedFailures.indexOf(f) === -1);
    if (unexpectedlyPassed.length > 0) {
      throw new Error('Marked as xfailed, but didn\'t fail: ' + JSON.stringify(unexpectedlyPassed, null, '  '));
    }
  });
});
