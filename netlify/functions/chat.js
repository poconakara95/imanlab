exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message } = JSON.parse(event.body);
  const apiKey = process.env.GEMINI_API_KEY;

  const systemPrompt = `Kau adalah Iman AI, virtual assistant untuk ImanLab - platform kelas offensive security dan cybersecurity di Malaysia. Jawab soalan pasal kelas, harga, pendaftaran ImanLab, dan soalan general lain. Jawab dalam Bahasa Melayu atau English mengikut bahasa pengguna. Jawab ringkas, mesra dan profesional.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\nUser: ' + message }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        })
      }
    );
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, cuba lagi.';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: 'Maaf, ada masalah teknikal.' })
    };
  }
};
