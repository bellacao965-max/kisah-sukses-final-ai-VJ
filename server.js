import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const GROQ_KEY = process.env.GROQ_KEY || '';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';

// Simple history persistence
const HISTORY_FILE = path.join(__dirname, "history.json");
let history = [];
try { if (fs.existsSync(HISTORY_FILE)) history = JSON.parse(fs.readFileSync(HISTORY_FILE,'utf8')||'[]'); } catch(e){ history=[]; }

function saveHistory(){ try{ fs.writeFileSync(HISTORY_FILE, JSON.stringify(history,null,2),'utf8'); }catch(e){console.error(e);} }

async function callGroq(prompt){
  if(!GROQ_KEY) throw new Error('GROQ_KEY not configured');
  const payload = { model: "llama-3.1-8b-instant", messages:[{role:'user',content:prompt}], max_tokens:1200, temperature:0.8 };
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:'POST', headers:{'Authorization':`Bearer ${GROQ_KEY}`,'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if(!r.ok){ const t = await r.text(); throw new Error('Groq error: '+t); }
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
}

async function callOpenAI(prompt){
  if(!OPENAI_KEY) throw new Error('OPENAI_API_KEY not configured');
  const payload = { model: "gpt-4o-mini", messages:[{role:'user',content:prompt}], max_tokens:1200, temperature:0.8 };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:'POST', headers:{'Authorization':`Bearer ${OPENAI_KEY}`,'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  if(!r.ok){ const t = await r.text(); throw new Error('OpenAI error: '+t); }
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
}

// Hybrid call: try Groq then OpenAI
async function hybridCall(prompt){
  try {
    if(GROQ_KEY) return await callGroq(prompt);
    if(OPENAI_KEY) return await callOpenAI(prompt);
    throw new Error('No API key configured');
  } catch(err){
    if(OPENAI_KEY && err.message.includes('Groq')) {
      return await callOpenAI(prompt);
    }
    throw err;
  }
}

// Story endpoint (uses hybrid)
app.post('/api/story', async (req,res)=>{
  const data = req.body || {};
  const prompt = `Generate Indonesian story. Title/Hook/Story/Plot Twist/Moral/Hashtags. Input: ${JSON.stringify(data)}`;
  try{
    const reply = await hybridCall(prompt);
    history.push({id:Date.now(), type:'story', input:data, reply, ts:new Date().toISOString()});
    saveHistory();
    res.json({story:reply});
  }catch(err){ res.status(500).json({error:err.message}); }
});

// Simple chat endpoint
app.post('/api/chat', async (req,res)=>{
  const msg = req.body && req.body.message ? String(req.body.message) : '';
  if(!msg) return res.status(400).json({error:'No message'});
  try{
    const reply = await hybridCall(msg);
    history.push({id:Date.now(), type:'chat', input:msg, reply, ts:new Date().toISOString()});
    saveHistory();
    res.json({reply});
  }catch(err){ res.status(500).json({error:err.message}); }
});

// SSE streaming simulated endpoint
app.get('/ai/stream', async (req,res)=>{
  const prompt = req.query.prompt || '';
  if(!prompt) return res.status(400).json({error:'prompt missing'});
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});
  res.flushHeaders();
  try{
    const full = await hybridCall(prompt);
    // stream by chunks
    const CHUNK = 80;
    for(let i=0;i<full.length;i+=CHUNK){
      const chunk = full.slice(i,i+CHUNK).replace(/\n/g,' ');
      res.write(`data: ${chunk}\n\n`);
      await new Promise(r=>setTimeout(r,90));
    }
    res.write('event: done\ndata: [DONE]\n\n');
    res.end();
  }catch(err){
    res.write(`event: error\ndata: ${err.message}\n\n`);
    res.end();
  }
});

// Instagram caption generator
app.post('/ig/caption', async (req,res)=>{
  const text = req.body && req.body.text ? String(req.body.text) : '';
  const tone = req.body && req.body.tone ? String(req.body.tone) : 'inspiratif';
  if(!text) return res.status(400).json({error:'text missing'});
  const prompt = `Buat caption IG pendek dalam bahasa Indonesia dengan tone ${tone} dari teks: ${text}. Sertakan 3 hashtag.`;
  try{
    const reply = await hybridCall(prompt);
    history.push({id:Date.now(), type:'ig', input:text, reply, ts:new Date().toISOString()});
    saveHistory();
    res.json({caption:reply});
  }catch(err){ res.status(500).json({error:err.message}); }
});

// YouTube transcript stub
app.get('/yt/transcript', async (req,res)=>{
  const url = req.query.url || '';
  if(!url) return res.status(400).json({error:'url missing'});
  res.json({error:'Transcript fetching requires external service. Provide transcript or use a third-party API.'});
});

// history endpoints
app.get('/history',(req,res)=> res.json(history.slice().reverse()));
app.post('/history/clear',(req,res)=>{ history=[]; saveHistory(); res.json({ok:true}); });

// serve index
app.get('*',(req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=> console.log('Server listening on port', PORT));
