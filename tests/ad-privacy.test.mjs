import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const source=await readFile(new URL('../lib/ad-privacy.ts',import.meta.url),'utf8');
const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {personalizedAdsAllowed}=await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);

test('personalized ads require app opt-in, eligible UMP state and ATT authorization',()=>{
 assert.equal(personalizedAdsAllowed('OBTAINED','authorized',true),true);
 assert.equal(personalizedAdsAllowed('NOT_REQUIRED','authorized',true),true);
});

test('refusal, revocation, restriction and unresolved consent keep ads non-personalized',()=>{
 assert.equal(personalizedAdsAllowed('REQUIRED','authorized',true),false);
 assert.equal(personalizedAdsAllowed('UNKNOWN','authorized',true),false);
 assert.equal(personalizedAdsAllowed('OBTAINED','denied',true),false);
 assert.equal(personalizedAdsAllowed('OBTAINED','restricted',true),false);
 assert.equal(personalizedAdsAllowed('OBTAINED','notDetermined',true),false);
 assert.equal(personalizedAdsAllowed('OBTAINED','authorized',false),false);
});
