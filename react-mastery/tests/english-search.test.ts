import test from 'node:test';
import assert from 'node:assert/strict';
import {searchEnglishCards,visibleEnglishCard} from '../src/english-search.ts';
import type {EnglishCard} from '../shared/english.ts';

const makeCard=(id:string,term:string,extra:Partial<EnglishCard>={}):EnglishCard=>({id,term,number:1,kind:'word',query:term,context:'',createdAt:'2026-11-26',favorite:false,pronunciation:'',meaning:'示例释义',usage:'',examples:[],pitfall:'',related:[],...extra});
const prior=makeCard('prior','all about',{number:115,kind:'expression',query:'manipulate; all about',chunk:{english:'be all about doing something',chinese:'特别看重做某事'}});
const manifest=makeCard('manifest','manifest',{number:10,chunk:{english:'manifest as physical symptoms',chinese:'表现为身体上的症状'}});
const cards=[prior,manifest];const numbers=new Map([['prior',115],['manifest',10]]);

test('headword matches outrank newer cards that match only historical input or examples',()=>{
  const found=searchEnglishCards(cards,'mani','all',numbers);
  assert.deepEqual(found.map(card=>card.id),['manifest','prior']);
  assert.equal(visibleEnglishCard(found,'')?.id,'manifest');
  const exampleOnly=makeCard('example','other',{examples:[{english:'It can manifest differently.',chinese:'它的表现可能不同。'}]});
  assert.deepEqual(searchEnglishCards([exampleOnly,manifest],'mani','all',numbers).map(card=>card.id),['manifest','example']);
});

test('exact terms and phrases precede prefixes, with stable notebook order for equal matches',()=>{
  const exact=makeCard('exact','manifest'),prefix=makeCard('prefix','manifestation');
  assert.deepEqual(searchEnglishCards([prefix,exact,manifest],'manifest','all',numbers).map(card=>card.id),['exact','manifest','prefix']);
  assert.equal(searchEnglishCards(cards,'  MANI  ','all',numbers)[0].id,'manifest');
  assert.equal(searchEnglishCards(cards,'physical symptoms','all',numbers)[0].id,'manifest');
});

test('category, visible numbering, Chinese meanings and note searches remain available',()=>{
  assert.deepEqual(searchEnglishCards(cards,'mani','expression',numbers).map(card=>card.id),['prior']);
  assert.deepEqual(searchEnglishCards(cards,'10','all',numbers).map(card=>card.id),['manifest']);
  assert.equal(searchEnglishCards(cards,'身体','all',numbers)[0].id,'manifest');
  assert.deepEqual(searchEnglishCards(cards,'','all',numbers),cards);
  assert.deepEqual(searchEnglishCards(cards,'mani','favorite',numbers),[]);
});

test('details can only use a current candidate, and a missing or cleared choice falls back to the first',()=>{
  const found=searchEnglishCards(cards,'physical','all',numbers);
  assert.equal(visibleEnglishCard(found,'prior')?.id,'manifest');
  assert.equal(visibleEnglishCard(cards,'manifest')?.id,'manifest');
  assert.equal(visibleEnglishCard(cards,'')?.id,'prior');
  assert.equal(visibleEnglishCard([],'prior'),undefined);
});
