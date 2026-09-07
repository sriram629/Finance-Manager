const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
Object.assign(process.env, { NODE_ENV:'test', CLIENT_URL:'http://localhost:8080', SERVER_URL:'http://localhost:5050', GOOGLE_CLIENT_ID:'test', GOOGLE_CLIENT_SECRET:'test', GITHUB_CLIENT_ID:'test', GITHUB_CLIENT_SECRET:'test', JWT_SECRET:'test-only-secret-never-used-in-production', JWT_EXPIRY:'1h' });
const AuthTicket = require('../models/AuthTicket');
const tickets = require('../utils/authTickets');
const StateStore = require('../utils/oauthState');
const { origin } = require('../utils/origins');
const records = new Map();
AuthTicket.create = async row => { records.set(row.digest, row); return row; };
AuthTicket.findOneAndDelete = async q => {
 const row = records.get(q.digest);
 if (!row || row.purpose !== q.purpose || row.expiresAt <= q.expiresAt.$gt || (q.challenge && row.challenge !== q.challenge)) return null;
 records.delete(q.digest); return row;
};
const User = require('../models/User');
const Expense = require('../models/Expense');
const userId = '507f1f77bcf86cd799439011';
const express = require('express');
const app = express(); app.use(express.json());
require('../middleware/authMiddleware').protect = (req,res,next) => {
 if (!req.headers['x-test-user']) return res.sendStatus(401);
 req.user = { id:req.headers['x-test-user'] }; next();
};
app.use('/auth', require('../routes/auth'));
app.use('/schedules', require('../routes/schedules'));
app.use('/expenses', require('../routes/expenses'));
app.use('/user', require('../routes/user'));
app.use((err,req,res,next) => res.status(500).json({error:err.message}));
let server, base;
before(async () => { server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r)); base=`http://127.0.0.1:${server.address().port}`; });
after(() => new Promise(r=>server.close(r)));
const post=(path,body,user)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...(user?{'x-test-user':user}:{})},body:JSON.stringify(body)});
test('hashed tickets allow exactly one concurrent redemption',async()=>{
 const code=await tickets.issue('login',userId); assert.equal(records.has(code),false);
 const results=await Promise.all([tickets.consume(code,'login'),tickets.consume(code,'login')]); assert.equal(results.filter(Boolean).length,1);
});
test('expired, wrong-purpose and malformed tickets fail closed',async()=>{
 const expired=await tickets.issue('login',userId,-1); assert.equal(await tickets.consume(expired,'login'),null);
 const code=await tickets.issue('state:google'); assert.equal(await tickets.consume(code,'login'),null); assert.ok(await tickets.consume(code,'state:google'));
 assert.equal(await tickets.consume({$ne:null},'login'),null);
});
test('OAuth state must match the browser cookie and cannot be replayed',async()=>{
 const store=new StateStore('google'); let cookie,options;
 const req={query:{challenge:'a'.repeat(64)},headers:{},res:{cookie:(n,v,o)=>{cookie=`${n}=${v}`;options=o;},clearCookie:()=>{}}};
 const state=await new Promise((r,j)=>store.store(req,(e,v)=>e?j(e):r(v)));
 assert.equal(options.httpOnly,true); assert.equal(options.sameSite,'lax');
 const verify=v=>new Promise((r,j)=>store.verify(req,v,(e,ok)=>e?j(e):r(ok)));
 assert.equal(await verify(state),false); req.headers.cookie=cookie;
 assert.equal(await verify('b'.repeat(64)),false); assert.equal(await verify(state),true);
 assert.equal(req.oauthChallenge,'a'.repeat(64)); assert.equal(await verify(state),false);
});
test('exchange requires the browser verifier and rejects replay',async()=>{
 const verifier='c'.repeat(64), code=await tickets.issue('login',userId,60000,tickets.digest(verifier));
 User.findById=async()=>({_id:userId,isVerified:true,email:'test@example.com'});
 assert.equal((await post('/auth/exchange',{code,verifier:'d'.repeat(64)})).status,401);
 const res=await post('/auth/exchange',{code,verifier}); assert.equal(res.status,200); assert.equal(res.headers.get('cache-control'),'no-store'); assert.ok((await res.json()).token);
 assert.equal((await post('/auth/exchange',{code,verifier})).status,401);
});
test('receipt downloads require authentication and owner-scoped lookup',async()=>{
 assert.equal((await fetch(base+`/expenses/${userId}/receipt`)).status,401);
 Expense.findOne=q=>({select:async()=>{assert.equal(q.user,userId);assert.equal(q._id,userId);return null;}});
 assert.equal((await fetch(base+`/expenses/${userId}/receipt`,{headers:{'x-test-user':userId}})).status,404);
});
test('production origin validation rejects insecure or ambiguous URLs',()=>{
 assert.equal(origin('https://example.com/','URL'),'https://example.com');
 for(const v of ['https://example.com/path','https://user@example.com','https://example.com?token=a','javascript:alert(1)','http://example.com']) assert.throws(()=>origin(v,'URL'));
 process.env.NODE_ENV='production'; assert.throws(()=>origin('http://localhost:8080','URL')); assert.equal(new StateStore('github').options().secure,true);process.env.NODE_ENV='test';
});
test('email verification enforces expiry and attempt bounds',async()=>{
 User.findOneAndUpdate=async q=>{assert.equal(q.emailChangeAttempts.$lt,5);assert.ok(q.emailChangeExpiresAt.$gt instanceof Date);return null;};
 assert.equal((await post('/user/verify-email-change',{otp:'123456'},userId)).status,400);
 assert.equal((await post('/user/verify-email-change',{otp:{$ne:null}},userId)).status,400);
});
test('verified email change clears one-time verification data',async()=>{
 let calls=0; User.findOneAndUpdate=async(q,u)=>{if(++calls===1)return{_id:userId,pendingEmail:'new@example.com',emailChangeHash:tickets.digest('123456')};assert.equal(q.pendingEmail,'new@example.com');assert.equal(u.$set.email,'new@example.com');assert.equal(u.$unset.emailChangeHash,1);return{_id:userId,email:'new@example.com'};};
 const res=await post('/user/verify-email-change',{otp:'123456'},userId);assert.equal(res.status,200);assert.equal((await res.json()).user.email,'new@example.com');
});
test('updated spreadsheet parser round-trips schedule data',()=>{
 const x=require('xlsx'),b=x.utils.book_new();x.utils.book_append_sheet(b,x.utils.aoa_to_sheet([['Date','Hours'],['2026-09-06',8]]),'Schedule');const loaded=x.read(x.write(b,{type:'buffer',bookType:'xlsx'}),{type:'buffer'});assert.deepEqual(x.utils.sheet_to_json(loaded.Sheets.Schedule),[{Date:'2026-09-06',Hours:8}]);
});
test('upload confirmation rejects another owner and simultaneous duplicate imports',async()=>{
 const form=new FormData();form.append('file',new Blob(['date,hours,hourly_rate\n2026-09-06,8,20'],{type:'text/csv'}),'schedule.csv');
 const preview=await fetch(base+'/schedules/upload',{method:'POST',headers:{'x-test-user':userId},body:form});
 assert.equal(preview.status,200);const data=await preview.json();assert.equal(data.valid,1);
 const body={tempFileId:data.tempFileId,rowsToImport:[2]};
 assert.equal((await post('/schedules/confirm-upload',body,'507f1f77bcf86cd799439012')).status,404);
 let inserts=0;require('../models/Schedule').insertMany=async rows=>{inserts++;assert.equal(rows[0].user,userId);return rows;};
 const responses=await Promise.all([post('/schedules/confirm-upload',body,userId),post('/schedules/confirm-upload',body,userId)]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,404]);assert.equal(inserts,1);
});
test('database-backed receipt is private and returned as an attachment',async()=>{
 Expense.findOne=()=>({select:async()=>({receiptUrl:'/uploads/test.pdf',receiptMime:'application/pdf',receiptData:Buffer.from('%PDF-test')})});
 const res=await fetch(base+`/expenses/${userId}/receipt`,{headers:{'x-test-user':userId}});
 assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'private, no-store');assert.match(res.headers.get('content-disposition'),/^attachment;/);assert.equal(await res.text(),'%PDF-test');
 const doc=new Expense({user:userId,date:new Date(),place:'test',amount:1,receiptData:Buffer.from('private')});assert.equal(doc.toJSON().receiptData,undefined);
});
test('registration codes cannot be used for password resets',async()=>{
 User.findOneAndUpdate=async q=>{assert.equal(q.otpPurpose,'reset');return {_id:userId,otpPurpose:'verify',otpCode:tickets.digest('123456'),otpExpiresAt:new Date(Date.now()+60000)};};
 const res=await post('/auth/reset-password',{email:'test@example.com',otp:'123456',newPassword:'Newpass123!'});assert.equal(res.status,400);
});
test('OAuth strategies retain verified email metadata and reject unverified linking',async()=>{
 const passport=require('../config/passport');assert.equal(passport._strategy('github')._allRawEmails,true);
 let lookups=0;User.findOne=async()=>{lookups++;return null;};
 const result=await new Promise((resolve,reject)=>passport._strategy('github')._verify('access','refresh',{id:'test-id',emails:[{value:'victim@example.com',verified:false}]},(err,user)=>err?reject(err):resolve(user)));
 assert.equal(result,false);assert.equal(lookups,1);
});
