const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { message } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;
    
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: "Kau adalah Iman AI, assistant untuk ImanLab - platform kelas cybersecurity Malaysia. Jawab ringkas dan mesra.\n\nUser: " + message }] }]
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: '/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => { resolve(data); });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    const parsed = JSON.parse(result);
   const reply = parsed.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(parsed);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: reply })
    };

  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: 'Error: ' + e.message })
    };
  }
};
