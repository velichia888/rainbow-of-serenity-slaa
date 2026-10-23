'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,collection,writeBatch,serverTimestamp,setDoc,getDoc,getDocs,updateDoc,deleteDoc,query,where}=require('firebase/firestore');
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-rainbow-ios-qualify',firestore:{host:'127.0.0.1',port:8097,rules:fs.readFileSync(path.resolve(__dirname,'../../firestore.rules'),'utf8')}});
 const checks=[];
 async function yes(name,p){await assertSucceeds(p);checks.push('PASS '+name)}
 async function no(name,p){await assertFails(p);checks.push('PASS denied: '+name)}
 try {
  const anon=env.authenticatedContext('memberone');
  const other=env.authenticatedContext('membertwo');
  const mod=env.authenticatedContext('trustedmod',{email:'goodmanona@gmail.com',email_verified:true});
  const a=anon.firestore(), b=other.firestore(), m=mod.firestore();
  const draft=doc(collection(a,'pendingFeed'));
  let write=writeBatch(a);
  write.set(draft,{name:'Member',text:'Some encouragement',uid:'memberone',createdAt:serverTimestamp()});
  write.set(doc(a,'rate','memberone'),{last:serverTimestamp()});
  await yes('anonymous submits private draft and rate atomically',write.commit());
  await no('member cannot read another pending post',getDoc(doc(b,'pendingFeed',draft.id)));
  await no('member cannot list pending posts',getDocs(collection(a,'pendingFeed')));
  await yes('moderator can view pending posts',getDoc(doc(m,'pendingFeed',draft.id)));
  await no('anonymous cannot publish directly',setDoc(doc(a,'feed','directPublicCreate'),{name:'Member',text:'Bypass moderation',uid:'memberone',createdAt:serverTimestamp()}));
  await no('another member cannot approve/delete draft',deleteDoc(doc(b,'pendingFeed',draft.id)));
  const published=doc(collection(m,'feed'));
  write=writeBatch(m);
  write.set(published,{name:'Member',text:'Some encouragement',uid:'memberone',createdAt:serverTimestamp()});
  write.delete(doc(m,'pendingFeed',draft.id));
  await yes('moderator publishes and consumes draft',write.commit());
  await yes('public post readable',getDoc(doc(b,'feed',published.id)));
  const reportId='membertwo_'+published.id;
  const report=doc(b,'reports',reportId);
  await no('report UID spoof rejected',setDoc(report,{postId:published.id,reporterUid:'memberone',reason:'Spam',status:'open',createdAt:serverTimestamp()}));
  await yes('member reports another post privately',setDoc(report,{postId:published.id,reporterUid:'membertwo',reason:'Spam',status:'open',createdAt:serverTimestamp()}));
  await no('other member cannot read report',getDoc(doc(a,'reports',reportId)));
  await no('reporter cannot list all reports',getDocs(collection(b,'reports')));
  await yes('moderator can view report',getDoc(doc(m,'reports',reportId)));
  await no('member cannot resolve report',updateDoc(report,{status:'dismissed',reviewedAt:serverTimestamp()}));
  await yes('moderator can resolve report',updateDoc(doc(m,'reports',reportId),{status:'dismissed',reviewedAt:serverTimestamp()}));
  await no('member cannot delete public post',deleteDoc(doc(b,'feed',published.id)));
  await yes('moderator can delete public post',deleteDoc(doc(m,'feed',published.id)));
  console.log(checks.join('\n'));console.log('RESULT '+checks.length+' / '+checks.length+' authorization cases PASS');
 } finally {await env.cleanup();}
})().catch(e=>{console.error('RULES TEST FAILURE:',e.message||e);process.exitCode=1});