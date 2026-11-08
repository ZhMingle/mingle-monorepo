import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomBytes,randomUUID} from 'node:crypto';
export const initialSettings={shopName:"Mingle's Choice",pageId:'1366169483255561',profileUrl:'https://www.facebook.com/profile.php?id=61596427557797',appId:'29500712936179888',graphVersion:'',mode:'preview',webhookVerifiedAt:null,
  business:{products:['手机支架','台灯','感应灯','键盘','鼠标','音响'],priceRange:'$10–150（具体产品价格及币种尚未确认）',fulfilment:'支持自取或邮寄',pickupAddress:'',postage:'',hours:'',details:''}};
export class Store{
  constructor(directory){
    this.directory=resolve(directory);mkdirSync(this.directory,{recursive:true});
    this.secretFile=resolve(this.directory,'secrets.json');
    this.secrets=existsSync(this.secretFile)?JSON.parse(readFileSync(this.secretFile,'utf8')):{verifyToken:randomBytes(24).toString('hex'),pageToken:'',appSecret:''};
    this.saveSecrets({});
    this.db=new DatabaseSync(resolve(this.directory,'inbox.sqlite'));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY, source TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, direction TEXT NOT NULL, timestamp INTEGER NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, state TEXT NOT NULL, created_at INTEGER NOT NULL, payload TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, payload TEXT NOT NULL);`);
    if(!this.db.prepare('SELECT id FROM settings WHERE id=1').get())this.setSettings(structuredClone(initialSettings));
    // Never replay a possibly delivered message after a restart.
    this.db.prepare("UPDATE jobs SET state='delivery_unknown' WHERE state='sending'").run();
    this.db.prepare("UPDATE jobs SET state='pending' WHERE state='analyzing'").run();
  }
  saveSecrets(patch){
    this.secrets={...this.secrets,...patch};const temp=this.secretFile+'.tmp';
    writeFileSync(temp,JSON.stringify(this.secrets),{mode:0o600});renameSync(temp,this.secretFile);
  }
  settings(){return JSON.parse(this.db.prepare('SELECT payload FROM settings WHERE id=1').get().payload);}
  setSettings(value){this.db.prepare('INSERT OR REPLACE INTO settings VALUES(1,?)').run(JSON.stringify(value));return value;}
  conversation(id){const row=this.db.prepare('SELECT payload FROM conversations WHERE id=?').get(id);return row?JSON.parse(row.payload):null;}
  conversations(){return this.db.prepare('SELECT payload FROM conversations').all().map(r=>JSON.parse(r.payload)).sort((a,b)=>b.updatedAt-a.updatedAt);}
  saveConversation(value){this.db.prepare('INSERT OR REPLACE INTO conversations VALUES(?,?,?)').run(value.id,value.source,JSON.stringify(value));return value;}
  messages(id){return this.db.prepare('SELECT payload FROM messages WHERE customer_id=? ORDER BY timestamp,rowid').all(id).map(r=>JSON.parse(r.payload));}
  receive(message){
    this.db.exec('BEGIN IMMEDIATE');
    try{
      if(this.db.prepare('SELECT id FROM messages WHERE id=?').get(message.id)){this.db.exec('COMMIT');return false;}
      const old=this.conversation(message.customerId);
      const value=old??{id:message.customerId,name:message.source==='messenger'?`客人 ${message.customerId.slice(-4)}`:'测试对话',source:message.source,category:'interested',confirmedPurchase:false,manualCategory:null,paused:false,archived:false,note:'',lastCustomerAt:0,updatedAt:0};
      const newer=message.timestamp>=value.lastCustomerAt;
      value.lastCustomerAt=Math.max(value.lastCustomerAt,message.timestamp);value.updatedAt=Math.max(value.updatedAt,message.timestamp);
      if(newer){value.lastMessage=message.text||'[图片、语音或其他附件]';value.latestMessageId=message.id;value.archived=false;}
      this.saveConversation(value);
      this.db.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').run(message.id,message.customerId,'in',message.timestamp,JSON.stringify({...message,direction:'in'}));
      if(newer)this.db.prepare('INSERT INTO jobs VALUES(?,?,?,?,?)').run(message.id,message.customerId,'pending',Date.now(),JSON.stringify({messageId:message.id,attachment:message.attachment,attempts:0}));
      this.db.exec('COMMIT');return true;
    }catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  job(id){const row=this.db.prepare('SELECT * FROM jobs WHERE id=?').get(id);if(!row)return null;const {payload,...fields}=row;return {...JSON.parse(payload),...fields};}
  nextJob(){const row=this.db.prepare("SELECT id FROM jobs WHERE state='pending' ORDER BY created_at,rowid LIMIT 1").get();return row?this.job(row.id):null;}
  saveJob(id,state,patch={}){const old=this.job(id);if(!old)throw Error('任务不存在');this.db.prepare('UPDATE jobs SET state=?,payload=? WHERE id=?').run(state,JSON.stringify({...old,...patch,state}),id);return this.job(id);}
  jobs(){return this.db.prepare('SELECT id FROM jobs ORDER BY created_at DESC LIMIT 100').all().map(r=>this.job(r.id));}
  sent(customerId,text,metaId){const timestamp=Date.now();this.db.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').run(metaId,customerId,'out',timestamp,JSON.stringify({id:metaId,customerId,direction:'out',text,timestamp}));}
  audit(action,detail){this.db.prepare('INSERT INTO audit VALUES(?,?,?)').run(randomUUID(),Date.now(),JSON.stringify({action,...detail}));}
  close(){this.db.close();}
}
