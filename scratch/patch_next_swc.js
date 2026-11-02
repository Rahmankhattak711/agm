const fs = require('fs');
const filePath = 'node_modules/next/dist/build/swc/index.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = `                if (importPath) {
                    // the import path must be exact when not in node_modules
                    pkgPath = _path.default.join(importPath, pkg, 'wasm.js');
                }`;

const replacement = `                if (importPath) {
                    // the import path must be exact when not in node_modules
                    pkgPath = _path.default.join(importPath, pkg, 'wasm.js');
                } else {
                    pkgPath = require.resolve(pkg);
                }`;

if (!content.includes(target)) {
  console.error('Target not found in', filePath);
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched node_modules/next/dist/build/swc/index.js!');
