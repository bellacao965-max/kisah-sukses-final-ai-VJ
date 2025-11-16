AI Ajaib Final - Deploy Ready
=============================
This package includes:
- server.js (Node ESM) with hybrid Groq + OpenAI support, SSE streaming, ig caption, history
- ai/storyEngine.js
- public/ (frontend) with chat UI, mini player, streaming demo, IG caption, game center (tic tac toe)
- .env.example (place your OPENAI_API_KEY and GROQ_KEY)
- history.json

To run locally:
1. npm install
2. copy .env.example -> .env and set keys
3. npm start
4. open http://localhost:10000

Security:
- Do NOT commit .env with keys to public repos.


PWA features added: manifest.json, sw.js, icons, more games, Google search box, social embeds.
