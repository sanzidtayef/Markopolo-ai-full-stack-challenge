const connectForm = document.getElementById('connectForm');
const connectBtn = document.getElementById('connectBtn');
const connectionsDiv = document.getElementById('connections');
const chat = document.getElementById('chat');
const promptForm = document.getElementById('promptForm');
const audienceInput = document.getElementById('audienceInput');

let currentConnections = { sources: ['Website','Shopify','Facebook Page'], channels: ['Email','SMS','Push','WhatsApp'] };

function appendMsg(text, cls='assistant') {
  const el = document.createElement('div');
  el.className = 'msg ' + cls;
  if (typeof text === 'string') el.innerText = text;
  else {
    const pre = document.createElement('pre');
    pre.className = 'pre';
    pre.innerText = JSON.stringify(text, null, 2);
    el.appendChild(pre);
  }
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}

connectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  connectBtn.disabled = true;
  const sources = Array.from(connectForm.querySelectorAll('input[name="sources"]:checked')).map(i=>i.value);
  const channels = Array.from(connectForm.querySelectorAll('input[name="channels"]:checked')).map(i=>i.value);
  currentConnections = { sources, channels };
  appendMsg({ info: 'Connecting to selected data sources...', sources, channels });
  const res = await fetch('/api/connect', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ sources, channels }) });
  const data = await res.json();
  connectionsDiv.innerText = JSON.stringify(data, null, 2);
  appendMsg({ info: 'Connections established', detail: data });
  connectBtn.disabled = false;
});

promptForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const audience = audienceInput.value.trim() || 'abandoned-cart users';
  appendMsg({ user_audience: audience }, 'user');
  appendMsg({ assistant: 'Generating campaign — streaming JSON...' });
  // open SSE
  const evtSource = new EventSource(`/api/stream?audience=${encodeURIComponent(audience)}`);
  let buffer = '';
  evtSource.onmessage = (ev) => {
    try {
      const obj = JSON.parse(ev.data);
      appendMsg(obj);
    } catch(err) {
      console.error('parse error', err);
    }
  };
  evtSource.addEventListener('done', (e) => {
    appendMsg({ assistant: 'Streaming complete. You can copy the final JSON block to transform into channel-specific actions.' });
    evtSource.close();
  });
  audienceInput.value = '';
});