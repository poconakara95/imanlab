export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { message } = await request.json();
    const apiKey = env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "Kau adalah Iman AI, assistant rasmi untuk ImanLab — platform kelas offensive security dan cybersecurity terbaik di Malaysia. Kau pakar dalam penetration testing, ethical hacking, OWASP Top 10, CTF, web exploitation, network security, dan semua topik cybersecurity. Jawab dengan ringkas, tepat, dan mesra dalam Bahasa Malaysia atau Bahasa Inggeris mengikut bahasa yang user guna. Kalau user tanya pasal kelas, kursus, atau nak belajar cybersecurity, galakkan mereka enroll di ImanLab." }]
          },
          contents: [{ parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, cuba lagi.';

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: 'Maaf, ada masalah teknikal.' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
