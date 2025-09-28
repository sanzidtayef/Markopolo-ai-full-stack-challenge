const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

app.post('/api/connect', (req, res) => {
  const { sources = [], channels = [] } = req.body || {};
  const connections = sources.map((s, i) => ({
    source: s,
    status: 'connected',
    connectionId: `conn_${s.replace(/\s+/g,'_')}_${i}`,
    meta: { sampleDataCount: Math.floor(Math.random()*500 + 20) }
  }));
  const linkedChannels = channels.map((c, i) => ({
    channel: c,
    status: 'ready',
    channelId: `ch_${c.replace(/\s+/g,'_')}_${i}`
  }));
  res.json({ ok: true, connections, linkedChannels, message: 'Mock connections established' });
});

app.get('/api/stream', (req, res) => {
  const audience = req.query.audience || 'anonymous_segment';
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  function sendEvent(obj, done=false) {
    const payload = JSON.stringify(obj);
    res.write(`data: ${payload}\n\n`);
    if (done) {
      res.write('event: done\n');
      res.write('data: {}\n\n');
      res.end();
    }
  }

  const plan = {
    audience,
    generatedAt: new Date().toISOString(),
    score: Math.round(Math.random()*20 + 80),
    insights: [
      { id: 'insight_1', text: 'High purchase intent detected based on browsing + cart adds' },
      { id: 'insight_2', text: 'Late-evening open rates historically higher for this segment' }
    ],
    recommendations: []
  };

  sendEvent({ stage: 'metadata', plan: { audience: plan.audience, generatedAt: plan.generatedAt, score: plan.score }});
  setTimeout(() => {
    sendEvent({ stage: 'insights', insights: plan.insights });
  }, 600);

  const channels = ['Email','SMS','Push','WhatsApp'];
  const messages = {
    Email: {
      subject: 'Exclusive Offer — 20% off your favorite items',
      body: 'Hi {{firstName}}, we noticed items in your cart. Use code SAVE20 — valid 48 hours.'
    },
    SMS: {
      body: 'Hurry! 20% off your cart with SAVE20. Expires in 48h. Reply STOP to opt-out.'
    },
    Push: {
      title: 'Cart reminder — 20% off',
      body: 'Your picks are waiting. Tap to checkout and save 20%.'
    },
    WhatsApp: {
      body: 'Hey {{firstName}}! Special 20% offer for you. Tap here to view: {{link}}'
    }
  };

  let i = 0;
  const interval = setInterval(() => {
    if (i >= channels.length) {
      const finalPayload = {
        stage: 'final_plan',
        plan: {
          audience: plan.audience,
          generatedAt: plan.generatedAt,
          score: plan.score,
          channels: channels.map(ch => ({
            channel: ch,
            channelStrategy: {
              right_time: ch === 'Email' ? '2025-10-01T20:00:00+06:00' : '2025-10-01T19:00:00+06:00',
              frequency: ch === 'Push' ? '1' : 'up to 2',
              message: messages[ch],
              targeting: {
                segments: [plan.audience],
                minCartValue: 25
              },
              execHints: {
                templateVars: ['firstName','link','coupon'],
                deliverWindow: 'next_48h'
              }
            }
          }))
        },
        metadata: {
          generatedBy: 'mock-ai-v1',
          confidence: plan.score
        }
      };
      sendEvent(finalPayload, true);
      clearInterval(interval);
      return;
    }
    const ch = channels[i];
    const chunk = {
      stage: 'channel_recommendation',
      channel: ch,
      recommendation: {
        right_time: ch === 'Email' ? '2025-10-01T20:00:00+06:00' : '2025-10-01T19:00:00+06:00',
        message: messages[ch],
        audience: plan.audience,
        rationale: `Selected ${ch} because of high engagement for this segment.`,
        qualityScore: Math.round(Math.random()*10 + 85)
      }
    };
    sendEvent(chunk);
    i++;
  }, 800);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`Server listening on http://localhost:${PORT}`));
