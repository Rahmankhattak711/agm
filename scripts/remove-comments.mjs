import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT_DIR = process.cwd();

const TARGET_DIRS = ["app", "components", "context", "lib", "types"];

const ROOT_FILES = ["middleware.ts", "next.config.ts"];

const EXCLUDED_DIRS = new Set(["node_modules", ".next", ".git", "generated"]);

function shouldExclude(dirName) {
  return EXCLUDED_DIRS.has(dirName);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!shouldExclude(entry.name)) {
        getAllFiles(path.join(dirPath, entry.name), arrayOfFiles);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"].includes(ext)) {
        arrayOfFiles.push(path.join(dirPath, entry.name));
      }
    }
  }

  return arrayOfFiles;
}

function removeCommentsFromCode(code, ext) {
  if (ext === ".css") {
    return code.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  const isJsx = ext === ".tsx" || ext === ".jsx";
  let sf;
  try {
    sf = ts.createSourceFile(
      "file" + ext,
      code,
      ts.ScriptTarget.Latest,
      true,
      isJsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  } catch {
    return code;
  }

  const seen = new Set();
  const ranges = [];

  function addRange(r) {
    const key = `${r.pos}:${r.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      ranges.push(r);
    }
  }

  function visit(node) {
    if (isJsx && ts.isJsxExpression(node) && !node.expression) {
      addRange({ pos: node.getStart(sf), end: node.getEnd() });
    }
    const leading = ts.getLeadingCommentRanges(code, node.getFullStart()) || [];
    for (const c of leading) addRange(c);
    const trailing = ts.getTrailingCommentRanges(code, node.getEnd()) || [];
    for (const c of trailing) addRange(c);

    try {
      const children = node.getChildren(sf);
      for (const child of children) {
        visit(child);
      }
    } catch {
      // Fallback to forEachChild if getChildren fails on some synthetic node
      ts.forEachChild(node, visit);
    }
  }

  visit(sf);

  if (!ranges.length) return code;

  const adjusted = [];
  for (const r of ranges) {
    let start = r.pos;
    let end = r.end;

    // Check line before
    let lineStart = start - 1;
    while (lineStart >= 0 && code[lineStart] !== "\n") {
      lineStart--;
    }
    const beforeText = code.slice(lineStart + 1, start);
    const isOnlyWhitespaceBefore = /^\s*$/.test(beforeText);

    // Check line after
    let lineEnd = end;
    while (lineEnd < code.length && code[lineEnd] !== "\n") {
      lineEnd++;
    }
    const afterText = code.slice(end, lineEnd);
    const isOnlyWhitespaceAfter = /^\s*$/.test(afterText);

    if (isOnlyWhitespaceBefore && isOnlyWhitespaceAfter) {
      start = lineStart + 1;
      end = lineEnd < code.length ? lineEnd + 1 : lineEnd;
    } else if (isOnlyWhitespaceBefore) {
      start = lineStart + 1;
    } else {
      while (
        start > 0 &&
        (code[start - 1] === " " || code[start - 1] === "\t")
      ) {
        start--;
      }
    }

    adjusted.push({ start, end });
  }

  adjusted.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of adjusted) {
    if (!merged.length) {
      merged.push({ start: r.start, end: r.end });
    } else {
      const last = merged[merged.length - 1];
      if (r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
      } else {
        merged.push({ start: r.start, end: r.end });
      }
    }
  }

  let result = "";
  let cur = 0;
  for (const r of merged) {
    result += code.slice(cur, r.start);
    cur = r.end;
  }
  result += code.slice(cur);

  // Normalize excessive blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}

function run() {
  const allFiles = [];

  for (const dir of TARGET_DIRS) {
    getAllFiles(path.join(ROOT_DIR, dir), allFiles);
  }

  for (const file of ROOT_FILES) {
    const fullPath = path.join(ROOT_DIR, file);
    if (fs.existsSync(fullPath)) {
      allFiles.push(fullPath);
    }
  }

  console.log(`Found ${allFiles.length} source files to inspect.`);

  let modifiedCount = 0;

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const original = fs.readFileSync(filePath, "utf-8");
    const cleaned = removeCommentsFromCode(original, ext);

    if (cleaned !== original) {
      fs.writeFileSync(filePath, cleaned, "utf-8");
      modifiedCount++;
      const relativePath = path.relative(ROOT_DIR, filePath);
      console.log(`Cleaned: ${relativePath}`);
    }
  }

  console.log(`\nSuccessfully removed comments from ${modifiedCount} files.`);
}

run();
