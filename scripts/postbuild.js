const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const copies = [
  ["public", "manifest.json"],
  ["scripts", "inject-payload.js"],
  ["scripts", "inject-post-message.js"],
  ["scripts", "background.js"],
];

for (const [dir, file] of copies) {
  const src = path.join(__dirname, "..", dir, file);
  const dest = path.join(dist, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
}
