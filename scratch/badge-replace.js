const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const files = process.argv.slice(3);
const re =
  /<span className="px-2\.5 py-0\.5 rounded-full text-\[10\.5px\] font-bold bg-(\w+)-50 text-\1-800 border border-\1-200">([^<]*)<\/span>/g;
for (const rel of files) {
  const f = path.join(root, rel);
  let s = fs.readFileSync(f, "utf8");
  let n = 0;
  s = s.replace(re, (_, tone, inner) => {
    n++;
    return `<Badge tone="${tone}" size="md">${inner}</Badge>`;
  });
  if (!n) {
    console.log("no match", rel);
    continue;
  }
  const m = s.match(/import \{([^}]*)\} from "@\/components\/ui";/);
  if (m) {
    if (!/\bBadge\b/.test(m[1]))
      s = s.replace(
        m[0],
        `import {${m[1].replace(/\s*$/, "")}${m[1].includes("\n") ? "\n  Badge,\n" : ", Badge "}} from "@/components/ui";`,
      );
  } else {
    s = s.replace(
      /^(import [^\n]*\n)/m,
      `$1import { Badge } from "@/components/ui";\n`,
    );
  }
  fs.writeFileSync(f, s);
  console.log("ok", rel, n);
}
