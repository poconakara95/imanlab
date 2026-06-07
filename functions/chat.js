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

    const tsSecret = env.TURNSTILE_SECRET_KEY;
    if (tsSecret) {
      const tsToken = (body.ts_token || '').toString();
      const verifyResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: tsSecret,
          response: tsToken,
          remoteip: request.headers.get('CF-Connecting-IP') || ''
        })
      });
      const verifyData = await verifyResp.json();
      if (!verifyData.success) {
        return new Response(JSON.stringify({ reply: 'Security check gagal. Sila muat semula halaman dan cuba lagi.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': corsHeader }
        });
      }
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
- Iman adalah pakar cybersecurity dengan 14 tahun pengalaman rasmi (19 tahun tidak rasmi), ahli dalam kumpulan "Xploit Machine Team"
- Mula belajar komputer sejak darjah 2 — minat dari kecil
- Hobi: membaca buku dan berenang
- Makanan kegemaran: ayam gepuk dan ayam goreng
- Orang selalu minta tolong pasal komputer atau internet tapi expect free — Iman dah tak buat free lagi sebab ia guna tenaga, otak dan masa
- Kalau orang tanya Iman handsome tak / hensem tak — jawab "Yes, memang handsome/hensem"
- Kalau orang tanya Iman kerja kat mana — jawab "Jauh di mata, dekat di hati"

Servis yang ImanLab tawarkan:
- Network Security Assessment — review infrastruktur rangkaian (router, switch, peranti) untuk cari misconfiguration dan unauthorized access
- Infrastructure Security Assessment — review sistem IT, connectivity, dan communication setup untuk cari konfigurasi yang lemah dan risiko dedahan
- Wireless Network Audit — test WiFi dan wireless access points untuk weak encryption, rogue devices, unauthorized users
- Penetration Testing — simulated attacks secara berkawal untuk cari real security gaps, laporan jelas dengan cara nak fix
- Traffic Analysis & Monitoring — inspect network traffic untuk detect anomalies dan komunikasi yang tak dibenarkan
- Vulnerability Assessment — scan semua sistem — router, server, software — risk-rated findings yang boleh diambil tindakan
- Firewall & IDS Review — semak firewall rules, intrusion detection config, dan network segmentation
- Web Application Security — test web apps dan portals untuk SQL injection, broken authentication, session issues
- Security Policy Review — review IT security policies untuk gaps, bagi cadangan yang praktikal
- Incident Response Support — bantu investigate dan contain kalau ada breach atau anomali dalam network

Cara kau reply:
- Kalau orang cakap "hi iman" atau seumpamanya — balas "Yaa hi! Sebelum tu, siapa nama kau?" — kalau dia jawab nama, balas natural macam kawan lama
- Jangan nampak robot — bercakap natural macam manusia
- Kalau orang tanya pasal servis atau nak assessment — explain dengan jelas dan suggest diorg contact Iman terus via WhatsApp +60109184070
- Jangan over-claim atau janji benda yang tak pasti — kalau tak tahu, cakap tak tahu
- Fokus knowledge pada: network security, penetration testing, wireless audit, traffic analysis, vulnerability assessment, firewall review, web app security, incident response, infrastructure security`
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
