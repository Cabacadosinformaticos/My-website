// Regression checks for images and Windows-authored carousel blocks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../assets/js/content-engine.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, document: { addEventListener() {} }, console });
vm.runInContext(source, context);
const windowsCarousel = ':::carousel\r\nhttps://example.com/screen.webp | Captura real\r\n:::\r\n';
assert.match(context.processBlocks(windowsCarousel), /class="carousel"/, 'Windows line endings must still produce a carousel');
context.window.marked = {
  Renderer: class {},
  setOptions() {},
  parse(text, { renderer }) {
    return renderer.image({ href: 'https://example.com/screen.webp', text: 'Vista "semanal"', title: null });
  },
};
const rendered = context.renderMarkdown('![Vista "semanal"](https://example.com/screen.webp)');
assert.match(rendered, /src="https:\/\/example.com\/screen.webp"/);
assert.match(rendered, /alt="Vista &quot;semanal&quot;"/);
assert.doesNotMatch(rendered, /\[object Object\]/);
console.log('Content rendering regressions passed.');
