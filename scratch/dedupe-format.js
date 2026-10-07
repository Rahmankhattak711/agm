const fs = require("fs");
const path = require("path");

const root = process.argv[2];
const skipDirs = new Set(["node_modules", ".next", ".git", "scratch"]);
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (skipDirs.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
  }
})(root);

const NUM_BODY =
  '\\{\\s*const num = Number\\(val \\|\\| 0\\);\\s*return num\\.toLocaleString\\((?:undefined|"en-US"), \\{\\s*minimumFractionDigits: 2,\\s*maximumFractionDigits: 2,\\s*\\}\\);\\s*\\}';
const CUR_BODY =
  '\\{\\s*const num = Number\\(val \\|\\| 0\\);\\s*return `AED \\$\\{num\\.toLocaleString\\((?:undefined|"en-US"), \\{\\s*minimumFractionDigits: 2,\\s*maximumFractionDigits: 2,\\s*\\}\\)\\}`;\\s*\\}';
const CUR_BODY2 =
  '\\{\\s*return `AED \\$\\{val\\.toLocaleString\\("en-US", \\{\\s*minimumFractionDigits: 2,\\s*maximumFractionDigits: 2,\\s*\\}\\)\\}`;\\s*\\}';
const SIG = "\\(val: number(?: \\| string \\| undefined)?\\)(?:: string)?";

const patterns = {
  formatNumber: [
    new RegExp(
      "[ \\t]*(?:export )?const formatNumber = " +
        SIG +
        " =>\\s*" +
        NUM_BODY +
        ";?[ \\t]*\\r?\\n(?:\\r?\\n)?",
      "g",
    ),
    new RegExp(
      "[ \\t]*(?:export )?function formatNumber\\(val: number \\| string \\| undefined\\): string\\s*" +
        NUM_BODY +
        "[ \\t]*\\r?\\n(?:\\r?\\n)?",
      "g",
    ),
  ],
  formatCurrency: [
    new RegExp(
      "[ \\t]*(?:export )?const formatCurrency = " +
        SIG +
        " =>\\s*" +
        CUR_BODY +
        ";?[ \\t]*\\r?\\n(?:\\r?\\n)?",
      "g",
    ),
    new RegExp(
      "[ \\t]*(?:export )?const formatCurrency = " +
        SIG +
        " =>\\s*" +
        CUR_BODY2 +
        ";?[ \\t]*\\r?\\n(?:\\r?\\n)?",
      "g",
    ),
  ],
  round2: [
    /[ \t]*const round2 = \(n: number\) => Math\.round\(n \* 100\) \/ 100;[ \t]*\r?\n(?:\r?\n)?/g,
  ],
};

const formatFile = path.join(root, "lib", "utils", "format.ts");
const report = { changed: [], skipped: [] };

for (const f of files) {
  if (f === formatFile || f.endsWith(path.join("lib", "utils", "math.ts")))
    continue;
  let src = fs.readFileSync(f, "utf8");
  const orig = src;
  const needs = { format: new Set(), math: new Set() };
  const isExportedTypesFile = false;

  for (const [name, pats] of Object.entries(patterns)) {
    for (const re of pats) {
      const before = src;
      src = src.replace(re, "");
      if (src !== before) {
        if (name === "round2") needs.math.add(name);
        else needs.format.add(name);
      }
    }
  }
  if (src === orig) continue;

  const exportedLocal =
    /export (const|function) (formatNumber|formatCurrency)/.test(orig) &&
    !new RegExp("export (const|function) (formatNumber|formatCurrency)").test(
      src,
    );

  const addImport = (names, from) => {
    if (!names.size) return;
    const line = `import { ${[...names].join(", ")} } from "${from}";\n`;
    const importRe =
      /^import[\s\S]*?from\s+["'][^"']+["'];?\r?\n|^import\s+["'][^"']+["'];?\r?\n/gm;
    let last = 0,
      m;
    while ((m = importRe.exec(src))) last = m.index + m[0].length;
    src = src.slice(0, last) + line + src.slice(last);
  };

  if (exportedLocal) {
    const names = [...needs.format];
    const line = `export { ${names.join(", ")} } from "@/lib/utils/format";\n`;
    src = line + src;
  } else {
    addImport(needs.format, "@/lib/utils/format");
  }
  addImport(needs.math, "@/lib/utils/math");

  fs.writeFileSync(f, src);
  report.changed.push(
    path.relative(root, f) +
      " -> " +
      [...needs.format, ...needs.math].join(","),
  );
}

console.log(JSON.stringify(report, null, 1));
