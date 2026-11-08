import assert from 'node:assert/strict';
import {generateReply} from './lib/ai.mjs';
import {initialSettings} from './lib/store.mjs';
const result=await generateReply(initialSettings.business,[{direction:'in',text:'Hi, how much is the desk lamp? Can you post it to me?'}]);
assert.equal(result.needsOwner,true);
assert.equal(result.category,'interested');
assert.ok(result.reply.length>0);
console.log(JSON.stringify(result,null,2));
