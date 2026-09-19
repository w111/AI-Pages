// Run: node --test tests/animal-api.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../animal_encyclopedia.html'), 'utf8');
const retrySource = html.slice(html.indexOf('    function renderError('), html.indexOf('    // ====== Животное дня ======'));
test('retry keeps the original closure and does not serialize HTML into onclick',()=>{
 let clicked=0;let listener;const container={innerHTML:'',querySelector:()=>({addEventListener:(event,fn)=>{assert.equal(event,'click');listener=fn;}})};
 const retry=()=>{const content='<div class="skeleton">';clicked+=content.length;};
 vm.runInNewContext(retrySource+'\nrenderError(container, retry)',{container,retry,t:key=>key});
 assert.equal(listener,retry);listener();assert.ok(clicked>0);assert.ok(container.innerHTML.includes('retry'));assert.ok(!container.innerHTML.includes('onclick='));assert.ok(!container.innerHTML.includes('skeleton'));
});
const creditSource = html.slice(html.indexOf('    async function fetchImageCredit('),html.indexOf('    function renderAnimalOfDay('));
test('untrusted image hosts never trigger a metadata fetch',async()=>{
 let requests=0;const c=vm.createContext({URL,URLSearchParams,fetchWithTimeout:()=>{requests++;throw Error('unexpected')}});vm.runInContext(creditSource,c);assert.equal(await c.fetchImageCredit('https://example.com/a.jpg'),null);assert.equal(await c.fetchImageCredit(undefined),null);assert.equal(requests,0);
});
test('metadata failure is optional and does not break the animal card',async()=>{
 const c=vm.createContext({URL,URLSearchParams,fetchWithTimeout:async()=>{throw Error('network')}});vm.runInContext(creditSource,c);assert.equal(await c.fetchImageCredit('https://upload.wikimedia.org/wikipedia/commons/a/ab/Animal.jpg'),null);
});
