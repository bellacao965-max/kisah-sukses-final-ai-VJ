/* Core frontend logic: chat, streaming, yt player, games, ig caption, quotes, history, tts playback */
async function fetchJSON(url, opts){ const r=await fetch(url, opts); return r.json(); }

/* Quotes */
const quotes = [
  "Jangan menyerah — keberhasilan datang pada yang konsisten.",
  "Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras.",
  "Mulai kecil, pikirkan besar.",
  "Langkah konsisten sehari 1% akan mengubah hidupmu.",
  "Syukuri proses, nikmati proses."
];
document.getElementById('quoteBox').innerText = quotes[0];
document.getElementById('refreshQuote').addEventListener('click', ()=>{ const i=Math.floor(Math.random()*quotes.length); document.getElementById('quoteBox').innerText=quotes[i]; });

/* Chat */
function addMessageDom(side, text){
  const el = document.createElement('div'); el.className = side; el.style.margin='8px 0'; el.innerText = text;
  document.getElementById('aiMessages').appendChild(el); document.getElementById('aiMessages').scrollTop = document.getElementById('aiMessages').scrollHeight;
}
document.getElementById('sendBtn').addEventListener('click', async ()=>{
  const txt = document.getElementById('prompt').value.trim(); if(!txt) return;
  addMessageDom('user', txt); document.getElementById('prompt').value=''; addMessageDom('bot','...memproses');
  try{
    const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:txt})});
    const j = await res.json();
    const bots = document.querySelectorAll('#aiMessages .bot'); bots[bots.length-1].innerText = j.reply || j.error || 'No reply';
  }catch(e){
    const bots = document.querySelectorAll('#aiMessages .bot'); bots[bots.length-1].innerText = 'Gagal: '+e.message;
  }
});

/* quick panel chat */
function addConv(who, text){ const c=document.getElementById('conversation'); const d=document.createElement('div'); d.className = who==='user'?'u':'b'; d.innerText=text; c.appendChild(d); c.scrollTop=c.scrollHeight;}
async function sendChat(e){ e.preventDefault(); const txt=document.getElementById('chatMsg').value.trim(); if(!txt) return false; addConv('user',txt); document.getElementById('chatMsg').value=''; addConv('bot','...memproses'); const mode=document.getElementById('modeSel').value;
  if(mode==='local'){ setTimeout(()=>{ const bots=document.querySelectorAll('.conv .b'); bots[bots.length-1].innerText='Balasan demo lokal.'; },600); } else {
    try{ const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:txt})}); const j=await r.json(); const bots=document.querySelectorAll('.conv .b'); bots[bots.length-1].innerText=j.reply||j.error||'No reply'; }catch(err){ const bots=document.querySelectorAll('.conv .b'); bots[bots.length-1].innerText='Gagal: '+err.message; }
  } return false;
}
document.getElementById('chatForm').addEventListener('submit', sendChat);

/* Mini player */
function extractYouTubeID(url){ try{ const u=new URL(url); if(u.hostname.includes('youtu.be')) return u.pathname.slice(1); if(u.hostname.includes('youtube.com')) return new URLSearchParams(u.search).get('v'); }catch(e){} if(/^[A-Za-z0-9_-]{11}$/.test(url)) return url; return null; }
document.getElementById('playVidBtn').addEventListener('click', ()=>{ const v=document.getElementById('videoInput').value.trim(); const wrap=document.getElementById('playerWrap'); wrap.innerHTML=''; const id=extractYouTubeID(v); if(id){ const iframe=document.createElement('iframe'); iframe.src='https://www.youtube.com/embed/'+id+'?rel=0&playsinline=1'; iframe.style.position='absolute'; iframe.style.top=0; iframe.style.left=0; iframe.style.width='100%'; iframe.style.height='100%'; iframe.frameBorder=0; wrap.appendChild(iframe); return; } if(v.endsWith('.mp4')){ const vid=document.createElement('video'); vid.src=v; vid.controls=true; vid.style.position='absolute'; vid.style.top=0; vid.style.left=0; vid.style.width='100%'; vid.style.height='100%'; wrap.appendChild(vid); return; } window.open(v,'_blank'); });

/* Streaming SSE */
document.getElementById('streamBtn').addEventListener('click', ()=>{
  const p=document.getElementById('streamPrompt').value.trim(); if(!p) return alert('Isi prompt');
  const out=document.getElementById('streamOut'); out.textContent=''; const url='/ai/stream?prompt='+encodeURIComponent(p); const evt=new EventSource(url);
  evt.onmessage=function(e){ out.textContent += e.data; out.scrollTop = out.scrollHeight; };
  evt.addEventListener('done', ()=>evt.close());
  evt.onerror=function(e){ out.textContent += '\n[error]\n'; evt.close(); };
});

/* IG caption */
document.getElementById('igBtn').addEventListener('click', async ()=>{
  const text=document.getElementById('igText').value.trim(); const tone=document.getElementById('igTone').value; if(!text) return alert('Isi deskripsi');
  document.getElementById('igOut').textContent='Memproses...';
  try{ const r=await fetch('/ig/caption',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,tone})}); const j=await r.json(); document.getElementById('igOut').textContent = j.caption || j.error || 'Error'; }catch(e){ document.getElementById('igOut').textContent = 'Gagal: '+e.message; }
});

/* Game center */
document.getElementById('gameBtn').addEventListener('click', ()=>{
  document.getElementById('iframeGame').src = '/games/tictactoe.html';
  document.getElementById('gameModal').style.display='block';
});
document.getElementById('closeGame').addEventListener('click', ()=>{ document.getElementById('gameModal').style.display='none'; document.getElementById('iframeGame').src=''; });

/* Chat history / tts playback placeholders */



/* Google search (opens new tab with google search results and also shows top iframe) */
document.getElementById('gSearchBtn').addEventListener('click', ()=>{
  const q = document.getElementById('gSearch').value.trim();
  if(!q) return alert('Isi kata kunci');
  const url = 'https://www.google.com/search?q='+encodeURIComponent(q);
  window.open(url,'_blank');
  document.getElementById('gResults').innerHTML = '<a href="'+url+'" target="_blank">Buka hasil di Google</a>';
});

/* Social embed */
document.getElementById('embedBtn').addEventListener('click', ()=>{
  const url = document.getElementById('embedUrl').value.trim();
  if(!url) return alert('Masukkan URL');
  const wrap = document.getElementById('embedWrap');
  wrap.innerHTML = '';
  // try tiktok
  if(url.includes('tiktok.com')){
    const ifr = document.createElement('iframe');
    ifr.src = url;
    ifr.style.width='100%'; ifr.style.height='500px'; ifr.frameBorder=0;
    wrap.appendChild(ifr); return;
  }
  // try instagram
  if(url.includes('instagram.com')){
    const ifr = document.createElement('iframe');
    ifr.src = url;
    ifr.style.width='100%'; ifr.style.height='600px'; ifr.frameBorder=0;
    wrap.appendChild(ifr); return;
  }
  // try facebook
  if(url.includes('facebook.com')){
    const ifr = document.createElement('iframe');
    ifr.src = url;
    ifr.style.width='100%'; ifr.style.height='600px'; ifr.frameBorder=0;
    wrap.appendChild(ifr); return;
  }
  // fallback open new tab
  window.open(url,'_blank');
});

/* Game selection buttons */
document.querySelectorAll('.game-select').forEach(b=>{
  b.addEventListener('click', ()=>{ document.getElementById('iframeGame').src = b.dataset.file; document.getElementById('gameModal').style.display='block'; });
});

/* Register service worker for PWA */
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').then(()=>console.log('SW registered')).catch(e=>console.log('SW fail',e));
}
