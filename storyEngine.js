import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_KEY = process.env.GROQ_KEY || '';
const MODEL = process.env.MODEL || 'hybrid';

async function callOpenAI(prompt){
  if(!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
  const payload = { model: "gpt-4o-mini", messages:[{role:'user',content:prompt}], max_tokens:1200, temperature:0.9 };
  const r = await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${OPENAI_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok){ const t=await r.text(); throw new Error('OpenAI error: '+t); }
  const j=await r.json(); return j?.choices?.[0]?.message?.content||j?.choices?.[0]?.text||'';
}

async function callGroq(prompt){
  if(!GROQ_KEY) throw new Error('GROQ_KEY not configured');
  const payload = { model: "llama-3.1-8b-instant", messages:[{role:'user',content:prompt}], max_tokens:1200, temperature:0.9 };
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${GROQ_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(!r.ok){ const t=await r.text(); throw new Error('Groq error: '+t); }
  const j=await r.json(); return j?.choices?.[0]?.message?.content||j?.choices?.[0]?.text||'';
}

export async function hybrid(prompt){
  try{
    if(GROQ_KEY) return await callGroq(prompt);
    if(OPENAI_KEY) return await callOpenAI(prompt);
    throw new Error('No API keys configured');
  }catch(err){
    if(OPENAI_KEY && err.message.includes('Groq')) return await callOpenAI(prompt);
    throw err;
  }
}
