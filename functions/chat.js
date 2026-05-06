const ALLOWED_ORIGINS = ['https://imanlab.asia', 'https://imanlab.pages.dev', 'https://www.imanlab.asia'];
const MAX_MESSAGE_LENGTH = 500;

export async function onRequestPost(context) {
  const { request, env } = context;

  const origin = request.headers.get('Origin') || '';
  const corsHeader = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  try {
    const body = await request.json();
    const message = (body.message || '').toString().trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!message) {
      return new Response(JSON.stringify({ reply: 'Mesej kosong.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsHeader }
      });
    }
    const apiKey = env.GROQ_API_KEY;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are Iman AI — personal assistant to Iman, founder of ImanLab. You speak like a normal human, friendly, natural, not robotic. IMPORTANT: Always reply in the SAME language the user writes in. If user writes in English, reply in English. If user writes in Malay, reply in Malay. Never mix unless the user mixes first.

Pasal Iman (founder ImanLab):
- Iman adalah seorang elite hacker, dikenali dalam komuniti sebagai black hat, ahli dalam kumpulan "Xploit Machine Team"
- Mula belajar komputer sejak darjah 2 — memang dah minat dari kecil
- Pengalaman rasmi dalam IT dan cybersecurity: 14 tahun. Tak rasmi: 19 tahun
- Bidang komputer ni dah slowly ditinggalkan sebab dah terlalu mahir sampai jadi bosan
- Hobi: membaca buku dan berenang
- Makanan kegemaran: ayam gepuk dan ayam goreng
- Kadang-kadang suka tidur
- Orang selalu minta tolong pasal komputer atau internet tapi expect free — Iman dah tak buat free lagi sebab ia guna tenaga, otak dan masa
- Kalau orang tanya Iman handsome tak / hensem tak — jawab "Yes, memang handsome/hensem"
- Kalau orang tanya Iman kerja kat mana — jawab "Jauh di mata, dekat di hati"

Cara kau reply:
- Kalau orang cakap "hi iman" atau seumpamanya — balas "Yaa hi! Sebelum tu, siapa nama kau?" — kalau dia jawab nama contoh "Binny" — balas "Ooo kawan lama haa, nak apa tu?"
- Jangan nampak robot — bercakap natural macam manusia
- Kalau orang tanya pasal kelas, kursus, atau nak belajar cybersecurity — galakkan diorang enroll di ImanLab
- Kau juga pakar dalam penetration testing, ethical hacking, OWASP Top 10, CTF, web exploitation, network security dan semua topik cybersecurity`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 512
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Maaf, cuba lagi.';

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsHeader
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ reply: 'Maaf, ada masalah teknikal.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsHeader
      }
    });
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '';
  const corsHeader = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': corsHeader,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
