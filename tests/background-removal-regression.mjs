/** Regression checks for worker cancellation, progress and single-channel masks. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(
  new URL('../background-removal.html', import.meta.url),
  'utf8'
);
const source = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const elements = new Map();
const element = id => {
  if (!elements.has(id))
    elements.set(id, {
      textContent: '',
      style: {},
      classList: { add() {}, remove() {} },
    });
  return elements.get(id);
};
const context = vm.createContext({
  window: { addEventListener() {} },
  document: { getElementById: element },
  performance,
  setInterval,
  clearInterval,
  setTimeout,
  clearTimeout,
  DOMException,
  console,
});
vm.runInContext(source + '\nglobalThis.App = BackgroundRemover;', context);
const app = Object.create(context.App.prototype);
Object.assign(app, {
  progressText: element('progress'),
  processingText: element('processing'),
  progressFill: element('fill'),
  worker: {
    postMessage() {},
    terminate() {
      this.terminated = true;
    },
  },
});
let operation = app.runWorker({ type: 'load' }, 10000);
app.worker.onmessage({
  data: { type: 'progress', file: 'model.onnx', loaded: 1048576, total: 0 },
});
assert.match(app.progressText.textContent, /1.0 МБ.*размер неизвестен/);
assert.equal(app.progressFill.style.width, '0%');
app.worker.onmessage({
  data: { type: 'progress', file: 'model.onnx', loaded: 1048576, total: 2097152 },
});
assert.equal(app.progressFill.style.width, '50%');
app.cancelPending();
await assert.rejects(operation, { name: 'AbortError' });
assert.equal(app.worker.terminated, true);
assert.equal(app.busy, false);
operation = app.runWorker({ type: 'process' }, 10000);
app.worker.onmessage({ data: { type: 'error', message: 'GPU failed' } });
await assert.rejects(operation, /GPU failed/);
operation = app.runWorker({ type: 'load' }, 10000);
app.worker.onmessage({ data: { type: 'ready' } });
await operation;
assert.equal(app.busy, false);
await assert.rejects(app.runWorker({ type: 'process' }, 10), /Превышено время/);

// Execute the actual embedded worker code with a synthetic model, no network or private photos.
const messages = [];
let selectedDevice, resized;
const tensor = {
  dims: [1, 1, 2, 2],
  0: {
    mul(n) {
      assert.equal(n, 255);
      return this;
    },
    to(type) {
      assert.equal(type, 'uint8');
      return this;
    },
  },
};
const lib = {
  env: { backends: { onnx: { wasm: {} } } },
  AutoModel: {
    async from_pretrained(id, options) {
      assert.equal(id, 'briaai/RMBG-1.4');
      assert.equal(options.dtype, 'fp32');
      selectedDevice = options.device;
      return async () => ({ output: tensor });
    },
  },
  AutoProcessor: {
    async from_pretrained() {
      return async () => ({ pixel_values: [] });
    },
  },
  RawImage: {
    async fromURL() {
      return { width: 2, height: 2 };
    },
    fromTensor(value) {
      assert.equal(value, tensor[0]);
      return {
        async resize(width, height) {
          resized = [width, height];
          return { data: new Uint8Array([0, 85, 170, 255]) };
        },
      };
    },
  },
};
const self = {
  navigator: {},
  postMessage(value) {
    messages.push(value);
  },
};
const workerSource = source.slice(
  source.indexOf('async function backgroundWorker()'),
  source.indexOf('    /**')
);
const workerContext = vm.createContext({ self, lib });
await vm.runInContext(
  workerSource.replace(/await import\("[^"\n]+"\)/, 'globalThis.lib') +
    '\nbackgroundWorker();',
  workerContext
);
await self.onmessage({ data: { type: 'load' } });
assert.equal(selectedDevice, 'wasm');
assert.equal(messages.at(-1).type, 'ready');
await self.onmessage({ data: { type: 'process', url: 'synthetic' } });
assert.deepEqual(resized, [2, 2]);
assert.deepEqual(Array.from(messages.at(-1).mask), [0, 85, 170, 255]);
tensor.dims = [1, 2, 2];
await self.onmessage({ data: { type: 'process', url: 'synthetic' } });
assert.equal(messages.at(-1).type, 'error');
console.log(
  'PASS: progress, cancel/terminate, error/retry lifecycle, timeout, worker mask and invalid shape'
);
