const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const copies = [
  ["public", "manifest.json"],
];

for (const [dir, file] of copies) {
  const src = path.join(__dirname, "..", dir, file);
  const dest = path.join(dist, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to dist/`);
  }
}
