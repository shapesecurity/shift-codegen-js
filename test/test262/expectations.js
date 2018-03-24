'use strict';

module.exports = {
  xfail: [
    // unicode surrogate pairs: https://github.com/shapesecurity/shift-codegen-js/issues/69
    '08358cb4732d8ce1.js-tree.json',
    '4d2c7020de650d40.js-tree.json',
    '5c3d125ce5f032aa.js-tree.json',
    'da9e16ac9fd5b61d.js-tree.json',
    'dc6037a43bed9588.js-tree.json',
    'f5b89028dfa29f27.js-tree.json',
    'f7f611e6fdb5b9fc.js-tree.json',

    // html comments: https://github.com/shapesecurity/shift-codegen-js/issues/68
    '4c3a394af4d281d1.js-tree.json',
    'f96c694c5a2f2be9.js-tree.json',
  ],
};
