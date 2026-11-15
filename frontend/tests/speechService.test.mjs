import test from 'node:test';
import assert from 'node:assert/strict';
import {handleSpeechRequest} from '../server/speechService.ts';

function responseMock() {
  return {
    statusCode:200,
    headers:{},
    body:null,
    setHeader(key,value) {this.headers[key]=value;},
    end(value) {this.body=value;},
  };
}
function input(text, method='POST') {
  return {method,body:{text}};
}

test('Natural narration is optional and a missing key never makes an upstream request',async()=>{
  const response=responseMock();
  await handleSpeechRequest(input('Meet the graph'),response);
  assert.equal(response.statusCode,503);
  assert.match(response.body,/not configured/);
});

test('Natural narration validates input before contacting the provider',async()=>{
  const response=responseMock();
  await handleSpeechRequest(input('a'.repeat(3001)),response,'not-an-actual-key');
  assert.equal(response.statusCode,400);
});

test('Configured private narration returns an audio response without exposing the secret',async()=>{
  const fetchBackup=globalThis.fetch;
  let outgoing;
  globalThis.fetch=async (_url,options)=>{
    outgoing=options;
    return {ok:true,arrayBuffer: async()=>new Uint8Array([73,68,51,3]).buffer};
  };
  try {
    const response=responseMock();
    await handleSpeechRequest(input('What is a vertex?'),response,'private-example-key');
    assert.equal(response.statusCode,200);
    assert.equal(response.headers['Content-Type'],'audio/mpeg');
    assert.deepEqual([...response.body],[73,68,51,3]);
    assert.equal(JSON.parse(outgoing.body).input,'What is a vertex?');
    assert.equal(JSON.parse(outgoing.body).voice,'marin');
    assert.match(outgoing.headers.Authorization,/private-example-key/);
    assert.ok(!String(response.body).includes('private-example-key'));
  } finally {globalThis.fetch=fetchBackup;}
});


test('Natural voice service removes emoji before sending text to the provider',async()=>{
 const previous=globalThis.fetch;
 let sent;
 globalThis.fetch=async (_url,options)=>{sent=JSON.parse(options.body);return {ok:true,arrayBuffer:async()=>new Uint8Array([73,68,51]).buffer};};
 try {
   const response=responseMock();
   await handleSpeechRequest(input('🎉 Great! ⭐ A → B. 🏆'),response,'private-example-key');
   assert.equal(response.statusCode,200);
   assert.equal(sent.input,'Great! A to B.');
   const noText=responseMock();
   await handleSpeechRequest(input('🏆 ⭐'),noText,'private-example-key');
   assert.equal(noText.statusCode,400);
 } finally {globalThis.fetch=previous;}
});
