const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const main = fs.readFileSync('dist/index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const feature = fs.readFileSync('dist/recipe-notes.js', 'utf8');
let stored = JSON.stringify({stock:[{name:'保留的面',count:3,grams:160}],plan:[1,0],logs:[{id:0,note:'保留反馈'}],favorites:[0,1,2,3,5]});
function session() {
  const nodes = {};
  const ctx = vm.createContext({
    document:{querySelector:s=>nodes[s] ||= {value:'1',innerHTML:'',addEventListener(){},showModal(){this.open=true},close(){this.open=false},insertAdjacentHTML(_,s){this.innerHTML+=s}}},
    localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},structuredClone,
    setTimeout:()=>1,clearTimeout(){},window:{},console
  });
  vm.runInContext(main,ctx);vm.runInContext(feature,ctx);
  return {ctx,nodes,run:code=>vm.runInContext(code,ctx)};
}
let s=session();
assert.equal(s.run('state.recipeNotes.length'),1);
assert.equal(s.run('state.recipeNotes[0].changes.length'),3);
assert(s.run('recipes[3].steps[0].includes("先检查")'));
assert(s.run('recipes[3].steps.some(x=>x.includes("不压实折边"))'));
assert(s.run('recipes[3].variations[0].seasonings.includes("待称重")'));
assert.equal(s.run('state.stock[0].count'),3);
assert.equal(s.run('state.logs[0].note'),'保留反馈');
const before=s.run('JSON.stringify(recipes[0])');
s.run("applyRecipeNote(0,'今天有点累 <script>alert(1)</script>')");
assert.equal(s.run('JSON.stringify(recipes[0])'),before);
assert(s.run('personalNotesHtml(0).includes("&lt;script&gt;")'));
s.run("applyRecipeNote(0,'盐改成 1g')");
assert.equal(s.run('recipes[0].ingredients.find(x=>x[0]==="盐")[1]'),1);
assert(!s.run('recipes[0].steps.join().includes("2g")'));
s.run("applyRecipeNote(0,'盐改成 0.5克')");
assert.equal(s.run('recipes[0].ingredients.find(x=>x[0]==="盐")[1]'),0.5);
s.run('undoRecipeNote(recipeVersion(0).key)');
assert.equal(s.run('recipes[0].ingredients.find(x=>x[0]==="盐")[1]'),1);
s.run('undoRecipeNote(recipeVersion(0).key)');
assert.equal(s.run('recipes[0].ingredients.find(x=>x[0]==="盐")[1]'),2);
// A repeated import or already-applied observation must not create duplicate steps.
s.run("applyRecipeNote(3,'折痕很厚，炒面加老抽和白糖很好吃')");
assert.equal(s.run('state.recipeNotes[0].changes.length'),0);
assert.equal(s.run("interpretRecipeNote(0,'今天盐放了 3g，有点咸').changes.length"),0);
assert.equal(s.run("interpretRecipeNote(3,'炒面老抽白糖不好吃').changes.length"),0);
s=session();
assert.equal(s.run('state.recipeNotes.filter(n=>n.source==="聊天中记录的经验").length'),1);
s.run('openRecipe(3)');
assert(s.nodes['#modal'].innerHTML.includes('让菜谱记住你的经验'));
assert(s.nodes['#modal'].innerHTML.includes('老抽和白糖'));
assert(s.run('state.stock[0].count===3'));
console.log('PASS: migration, noodle edits, unknown weights, explicit grams, no inferred grams, fallback reminders, escaping, undo chain, reload persistence, recipe UI');

// Exercise the same save handler used by the visible button, including reload and storage errors.
function editInputs(values) {
  s.ctx.document.querySelectorAll = () => values.map(value => ({value:String(value),checkValidity:()=>true,focus(){}}));
}
editInputs([600,270,4]);
s.run('saveIngredientRecipe(3)');
assert.equal(s.run('recipes[3].ingredients[0][1]'),600);
assert.equal(s.nodes['#scale'].value,'1');
assert(s.nodes['#ingredient-save-status'].textContent.includes('已保存'));
s=session();
assert.equal(s.run('recipes[3].ingredients[1][1]'),270);
assert(s.run('recipes[3].steps.some(x=>x.includes("不压实折边"))'));
s.run('openRecipe(3)');
assert(s.nodes['#ingredients'].innerHTML.includes('value="600"'));
editInputs([1200,540,8]);
s.nodes['#scale'].value='2';
s.run('saveIngredientRecipe(3)');
s=session();
assert.equal(s.run('recipes[3].ingredients[0][1]'),1200);
s.run('undoRecipeNote(recipeVersion(3).key)');
assert.equal(s.run('recipes[3].ingredients[0][1]'),600);
editInputs(['',300,4]);
s.run('saveIngredientRecipe(3)');
assert(s.nodes['#ingredient-save-status'].textContent.includes('有效'));
editInputs([-1,300,4]);
s.run('saveIngredientRecipe(3)');
assert.equal(s.run('recipes[3].ingredients[0][1]'),600);
editInputs([700,300,0]);
const normalSet=s.ctx.localStorage.setItem;
s.ctx.localStorage.setItem=()=>{throw new Error('storage blocked')};
s.run('saveIngredientRecipe(3)');
assert(s.nodes['#ingredient-save-status'].textContent.includes('未能保存'));
assert.equal(s.run('recipes[3].ingredients[0][1]'),600);
s.ctx.localStorage.setItem=normalSet;
s.run('saveIngredientRecipe(3)');
assert.equal(s.run('recipes[3].ingredients[2][1]'),0);
s=session();
assert.equal(s.run('recipes[3].ingredients[0][1]'),700);
assert.equal(s.run('state.stock[0].count'),3);
assert.equal(s.run('state.logs[0].note'),'保留反馈');
console.log('PASS: save handler, reopen/reload, scaled amount normalization, undo, blank/negative rejection, zero quantity, failed-storage retry, old records retained');

assert(s.run('stockRows().includes("编辑") && stockRows().includes("删除")'));
assert(s.run('updateStock(0,{name:"手工宽面",count:5,grams:180.5})'));
s=session();
assert.equal(s.run('state.stock[0].grams'),180.5);
assert.equal(s.run('state.stock[0].count'),5);
assert.equal(s.run('state.stock[0].name'),'手工宽面');
assert(!s.run('updateStock(0,{name:"",count:5,grams:180})'));
assert(!s.run('updateStock(0,{name:"宽面",count:1.5,grams:180})'));
assert(!s.run('updateStock(0,{name:"宽面",count:1,grams:0})'));
assert(!s.run('updateStock(0,{name:"宽面",count:1,grams:180.55})'));
s.run('deleteStock(0)');
assert.equal(s.run('state.stock.length'),0);
s=session();
assert.equal(s.run('state.stock.length'),0);
assert(s.run('stockRows().includes("撤销删除")'));
s.run('restoreStock()');
assert.equal(s.run('state.stock[0].grams'),180.5);
assert(s.run('updateStock(0,{name:"吃完的面",count:0,grams:150})'));
s.run('deleteStock(0)');
assert.equal(s.run('state.stock.length'),0);
s.run('restoreStock()');
s.ctx.localStorage.setItem=()=>{throw new Error('full')};
s.run('deleteStock(0)');
assert.equal(s.run('state.stock.length'),1);
assert(!s.run('updateStock(0,{name:"不能保存的修改",count:1,grams:200})'));
assert.equal(s.run('state.stock[0].name'),'吃完的面');
console.log('PASS: stock edit and reload, grams decimals, input validation, delete including zero portions, persistent undo, failed storage preserves data');
