const fs = require("fs");
const path = require("path");

const webBase = path.join("edge", "web");
const distBase = path.join(webBase, "dist");
const assetsBase = path.join(distBase, "assets");

const jsTargets = [
  {
    src: path.join(webBase, "assets", "js", "geo.js"),
    dest: path.join(assetsBase, "js", "geo.min.js")
  },
  {
    src: path.join(webBase, "assets", "js", "main.js"),
    dest: path.join(assetsBase, "js", "main.min.js")
  },
  {
    src: path.join(webBase, "assets", "js", "analytics-prueba.js"),
    dest: path.join(assetsBase, "js", "analytics-prueba.min.js")
  }
];

const cssTargets = [
  {
    src: path.join(webBase, "assets", "css", "styles.css"),
    dest: path.join(assetsBase, "css", "styles.min.css")
  },
  {
    src: path.join(webBase, "assets", "css", "analytics-prueba.css"),
    dest: path.join(assetsBase, "css", "analytics-prueba.min.css")
  }
];

const htmlTargets = [
  path.join(webBase, "index.html"),
  path.join(webBase, "redes", "index.html"),
  path.join(webBase, "contacto", "index.html"),
  path.join(webBase, "analytics-prueba", "index.html"),
  path.join(webBase, "disabled", "index.html"),
  path.join(webBase, "errors", "403.html"),
  path.join(webBase, "errors", "404.html"),
  path.join(webBase, "errors", "500.html")
];

const staticTargets = [
  path.join(webBase, "sitemap.xml"),
  path.join(webBase, "robots.txt")
];

run();

function run() {
  cleanDist();
  jsTargets.forEach(({ src, dest }) => writeMinified(src, dest, minifyJs));
  cssTargets.forEach(({ src, dest }) => writeMinified(src, dest, minifyCss));
  htmlTargets.forEach((src) => {
    const dest = path.join(distBase, path.relative(webBase, src));
    const raw = fs.readFileSync(src, "utf8");
    const prepared = prepareHtmlForDist(raw);
    const minified = minifyHtml(prepared);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, minified, "utf8");
    console.log(`minified: ${src} -> ${dest}`);
  });
  copyStatic();
  copyAssets();
}

function cleanDist() {
  fs.rmSync(distBase, { recursive: true, force: true });
}

function writeMinified(src, dest, transform) {
  const raw = fs.readFileSync(src, "utf8");
  const minified = transform(raw);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, minified, "utf8");
  console.log(`minified: ${src} -> ${dest}`);
}

function prepareHtmlForDist(code) {
  let out = code;
  out = out.replace(/\/assets\/css\/styles\.css/g, "/assets/css/styles.min.css");
  out = out.replace(
    /\/assets\/css\/analytics-prueba\.css/g,
    "/assets/css/analytics-prueba.min.css"
  );
  out = out.replace(/\/assets\/js\/geo\.js/g, "/assets/js/geo.min.js");
  out = out.replace(/\/assets\/js\/main\.js/g, "/assets/js/main.min.js");
  out = out.replace(
    /\/assets\/js\/analytics-prueba\.js/g,
    "/assets/js/analytics-prueba.min.js"
  );
  return out;
}

function copyAssets() {
  const sourceAssets = path.join(webBase, "assets");
  const targetAssets = path.join(distBase, "assets");
  fs.cpSync(sourceAssets, targetAssets, { recursive: true });
  console.log(`copied assets -> ${targetAssets}`);
}

function copyStatic() {
  staticTargets.forEach((src) => {
    const dest = path.join(distBase, path.relative(webBase, src));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`copied: ${src} -> ${dest}`);
  });
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
  const withoutComments = code.replace(/<!--[\s\S]*?-->/g, "");
  const squashed = withoutComments
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  return squashed;
}
