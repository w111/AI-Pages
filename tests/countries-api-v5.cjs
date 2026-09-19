// Run with: node --test tests/countries-api-v5.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../countries_duel.html'), 'utf8');
const source = html.slice(html.indexOf('    async function fetchCountries()'), html.indexOf('    function renderApiKeyForm()'));
const country = code => ({names:{common:code,translations:{rus:{common:'Страна'}}}, codes:{alpha_3:code}, population:10000,area:{kilometers:100},capitals:[{name:'Capital'}],flag:{emoji:'X',url_svg:'https://flags.restcountries.com/example.svg'},languages:[{name:'English'}],currencies:[{name:'Dollar'}],cars:{driving_side:'left'}});
function client(responses) {
  const calls=[];
  const context=vm.createContext({URL,AbortSignal,state:{lang:'en'},fetch:async(url,options)=>{
    calls.push({url:new URL(url),options});
    const response=responses.shift();
    if(!response) throw Error('Unexpected request');
    return {ok:response.status===undefined,status:response.status,json:async()=>response};
  }});
  vm.runInContext(source+'\ncountriesApiKey="test-key"; this.load=fetchCountries; this.key=()=>countriesApiKey;',context);
  return {context,calls};
}
test('loads every page and adapts all game fields',async()=>{
 const {context,calls}=client([{data:{objects:[country('AAA'),country('BBB')],meta:{total:4}}},{data:{objects:[country('CCC'),country('DDD')],meta:{total:4}}}]);
 const data=await context.load();assert.equal(data.length,4);assert.equal(calls[1].url.searchParams.get('offset'),'2');assert.equal(calls[0].options.headers.Authorization,'Bearer test-key');assert.equal(calls[0].url.origin,'https://api.restcountries.com');assert.equal(data[0].area,100);assert.equal(data[0].capital[0],'Capital');assert.equal(data[0].translations.rus.common,'Страна');assert.equal(data[0].languages[0],'English');assert.equal(data[0].car.side,'left');assert.equal(data[0].flags.svg,'https://flags.restcountries.com/example.svg');
});
for(const status of [401,403,429,500]) test('handles HTTP '+status,async()=>{const {context}=client([{status}]);await assert.rejects(context.load());if(status===401||status===403)assert.equal(context.key(),'');});
for(const data of [{objects:[]},{objects:[],meta:{total:5}},{objects:[country('AAA'),country('AAA')],meta:{total:2}},{objects:[],meta:{total:0}},{_demo:{},objects:[country('AAA')],meta:{total:1}}]) test('rejects invalid, incomplete, duplicate or demo data',async()=>{const {context}=client([{data}]);await assert.rejects(context.load());});
