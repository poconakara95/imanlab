const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message } = JSON.parse(event.body);
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Kau adalah Iman AI, virtual assistant untuk ImanLab - platform kelas offensive security di Malaysia. Jawab ringkas dan mesra.\n\nUser: ${message}`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 500 }
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, cuba lagi.';
          resolve({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply }) });
        } catch(e) {
          resolve({ statusCode: 200, body: JSON.stringify({ reply: 'Maaf, ada masalah teknikal.' }) });
        }
      });
    });
    req.on('error', () => resolve({ statusCode: 500, body: JSON.stringify({ reply: 'Maaf, ada masalah teknikal.' }) }));
    req.write(postData);
    req.end();
  });
};
