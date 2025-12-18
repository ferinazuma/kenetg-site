const fs = require("fs");
const path = require("path");

const jsTargets = [
  { src: path.join("web", "assets", "js", "geo.js"), dest: path.join("web", "assets", "js", "geo.min.js") },
  { src: path.join("web", "assets", "js", "main.js"), dest: path.join("web", "assets", "js", "main.min.js") }
];

const cssTargets = [
  { src: path.join("web", "assets", "css", "styles.css"), dest: path.join("web", "assets", "css", "styles.min.css") }
];

const htmlTargets = [
  path.join("web", "index.html"),
  path.join("web", "redes", "index.html"),
  path.join("web", "tienda", "index.html"),
  path.join("web", "errors", "403.html"),
  path.join("web", "errors", "404.html"),
  path.join("web", "errors", "500.html")
];

const distBase = path.join("web", "dist");

run();

function run() {
  jsTargets.forEach(({ src, dest }) => writeMinified(src, dest, minifyJs));
  cssTargets.forEach(({ src, dest }) => writeMinified(src, dest, minifyCss));
  htmlTargets.forEach((src) => {
    const dest = path.join(distBase, path.relative("web", src));
    writeMinified(src, dest, minifyHtml);
  });
}

function writeMinified(src, dest, transform) {
  const raw = fs.readFileSync(src, "utf8");
  const minified = transform(raw);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, minified, "utf8");
  console.log(`minified: ${src} -> ${dest}`);
}

function stripJsComments(code) {
  let out = "";
  let inString = false;
  let stringChar = "";
  let escape = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += ch;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      out += ch;
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      out += ch;
      continue;
    }

    out += ch;
  }

  return out;
}

function minifyJs(code) {
  const withoutComments = stripJsComments(code);
  let out = "";
  let inString = false;
  let stringChar = "";
  let escape = false;

  for (let i = 0; i < withoutComments.length; i++) {
    const ch = withoutComments[i];
    const next = withoutComments[i + 1];

    if (inString) {
      out += ch;
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      out += ch;
      continue;
    }

    if (/\s/.test(ch)) {
      const prev = out[out.length - 1];
      const needSpace = /[A-Za-z0-9_$]/.test(prev) && /[A-Za-z0-9_$]/.test(next || "");
      if (needSpace) out += " ";
      continue;
    }

    out += ch;
  }

  return out.trim();
}

function minifyCss(code) {
  const withoutComments = code.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutComments
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;>,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyHtml(code) {
  const replacedAssets = code
    .replace(/\/assets\/css\/styles\.css/g, "/assets/css/styles.min.css")
    .replace(/\/assets\/js\/geo\.js/g, "/assets/js/geo.min.js")
    .replace(/\/assets\/js\/main\.js/g, "/assets/js/main.min.js");

  const withoutComments = replacedAssets.replace(/<!--[\s\S]*?-->/g, "");
  const squashed = withoutComments
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  return squashed;
}
