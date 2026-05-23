const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateSVG(data) {
  const { name='', age='', daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  function pill(v, s, unit) {
    const ok = Number(v) >= s;
    const bg = ok ? '#d1fae5' : '#fee2e2';
    const color = ok ? '#065f46' : '#dc2626';
    const icon = ok ? '✓' : '!';
    return { bg, color, text: `${icon} ${Number(v).toLocaleString()} ${unit}` };
  }
  function pillB(has) {
    return { bg: has?'#d1fae5':'#fee2e2', color: has?'#065f46':'#dc2626', text: has?'✓ 已投保':'! 未投保' };
  }

  function row(x, y, emoji, label, p) {
    return `
    <text x="${x}" y="${y+4}" font-size="15" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${emoji}</text>
    <text x="${x+24}" y="${y+4}" font-size="12" fill="#374151" font-family="Arial,sans-serif">${label}</text>
    <rect x="${x+185}" y="${y-13}" width="90" height="19" rx="9" fill="${p.bg}"/>
    <text x="${x+230}" y="${y+2}" font-size="10" fill="${p.color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${p.text}</text>`;
  }

  const lifeOk = Number(life) >= 500;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="960" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0f0ff"/>
      <stop offset="100%" stop-color="#fdf2f8"/>
    </linearGradient>
    <linearGradient id="ring1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#00000015"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="900" height="960" fill="url(#bg)"/>

  <!-- TL: 小疾病 (blue) -->
  <rect x="20" y="20" width="390" height="340" rx="20" fill="white" filter="url(#shadow)"/>
  <rect x="20" y="20" width="390" height="60" rx="20" fill="#eff6ff"/>
  <rect x="20" y="60" width="390" height="20" fill="#eff6ff"/>
  <text x="75" y="58" font-size="22" font-weight="bold" fill="#1d4ed8" font-family="Arial,sans-serif">小疾病</text>
  <text x="75" y="75" font-size="11" fill="#93c5fd" font-family="Arial,sans-serif">住院相關保障</text>
  <text x="38" y="62" font-size="26" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🏥</text>
  ${row(35, 115, '🛏️', '住院日額（實支+定額）', pill(daily, 3000, '元/天'))}
  ${row(35, 150, '✂️', '手術（實支實付）', pill(surgeryFixed, 50000, '元'))}
  ${row(35, 185, '🔪', '手術（定額手術）', pill(surgeryFixed, 50000, '元'))}
  ${row(35, 220, '💊', '雜費', pill(inpatient, 100000, '元'))}

  <!-- TR: 小意外 (pink) -->
  <rect x="490" y="20" width="390" height="340" rx="20" fill="white" filter="url(#shadow)"/>
  <rect x="490" y="20" width="390" height="60" rx="20" fill="#fff1f2"/>
  <rect x="490" y="60" width="390" height="20" fill="#fff1f2"/>
  <text x="545" y="58" font-size="22" font-weight="bold" fill="#e11d48" font-family="Arial,sans-serif">小意外</text>
  <text x="545" y="75" font-size="11" fill="#fda4af" font-family="Arial,sans-serif">意外相關保障</text>
  <text x="508" y="62" font-size="26" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🩹</text>
  ${row(505, 115, '🏥', '意外門診', pill(accident, 10000, '元'))}
  ${row(505, 150, '🦴', '骨折未住院', pill(fracture, 30000, '元'))}
  ${row(505, 185, '🛏️', '意外住院日額', pillB(Number(daily)>0))}

  <!-- BL: 大疾病 (purple) -->
  <rect x="20" y="600" width="390" height="340" rx="20" fill="white" filter="url(#shadow)"/>
  <rect x="20" y="600" width="390" height="60" rx="20" fill="#f5f3ff"/>
  <rect x="20" y="640" width="390" height="20" fill="#f5f3ff"/>
  <text x="75" y="638" font-size="22" font-weight="bold" fill="#7c3aed" font-family="Arial,sans-serif">大疾病</text>
  <text x="75" y="655" font-size="11" fill="#c4b5fd" font-family="Arial,sans-serif">重大疾病保障</text>
  <text x="38" y="642" font-size="26" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🎗️</text>
  ${row(35, 695, '💓', '重大傷病', pill(critical, 100, '萬'))}
  ${row(35, 730, '🛡️', '重大疾病', pill(critical, 100, '萬'))}
  ${row(35, 765, '🎗️', '癌症一次金', pill(cancer, 100, '萬'))}
  ${row(35, 800, '💉', '化療', pill(0, 50, '萬'))}
  ${row(35, 835, '☢️', '放療', pill(0, 50, '萬'))}
  ${row(35, 870, '🏥', '癌症住院', pill(0, 3000, '元/日'))}
  ${row(35, 905, '👴', '長照月給付', pill(ltc, 30000, '元/月'))}

  <!-- BR: 大意外 (orange) -->
  <rect x="490" y="600" width="390" height="340" rx="20" fill="white" filter="url(#shadow)"/>
  <rect x="490" y="600" width="390" height="60" rx="20" fill="#fff7ed"/>
  <rect x="490" y="640" width="390" height="20" fill="#fff7ed"/>
  <text x="545" y="638" font-size="22" font-weight="bold" fill="#c2410c" font-family="Arial,sans-serif">大意外</text>
  <text x="545" y="655" font-size="11" fill="#fdba74" font-family="Arial,sans-serif">意外相關保障</text>
  <text x="508" y="642" font-size="26" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">⚡</text>
  ${row(505, 695, '🏃', '意外身故', pill(accDeath, 500, '萬'))}
  ${row(505, 730, '♿', '殘廢', pill(disability, 500, '萬'))}
  ${row(505, 765, '🤝', '全殘', pill(disability, 500, '萬'))}

  <!-- Center circle: 壽險 -->
  <circle cx="450" cy="480" r="115" fill="white" filter="url(#shadow)"/>
  <circle cx="450" cy="480" r="108" fill="white"/>
  <circle cx="450" cy="480" r="108" fill="none" stroke="url(#ring1)" stroke-width="6"/>
  <!-- Shield icon -->
  <text x="450" y="448" font-size="40" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🛡️</text>
  <text x="450" y="480" font-size="22" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">壽險</text>
  <text x="450" y="502" font-size="${Number(life)>999?'16':'20'}" fill="#1e293b" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${life ? life+'萬' : '⚠️ 未投保'}</text>
  ${!lifeOk ? `<text x="450" y="522" font-size="11" fill="#dc2626" text-anchor="middle" font-family="Arial,sans-serif">建議500萬以上</text>` : `<text x="450" y="522" font-size="11" fill="#065f46" text-anchor="middle" font-family="Arial,sans-serif">✓ 保額充足</text>`}

  <!-- Cross dividers -->
  <line x1="450" y1="20" x2="450" y2="360" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="6,4"/>
  <line x1="450" y1="600" x2="450" y2="940" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="6,4"/>
  <line x1="20" y1="480" x2="360" y2="480" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="6,4"/>
  <line x1="540" y1="480" x2="880" y2="480" stroke="#e5e7eb" stroke-width="2" stroke-dasharray="6,4"/>

  <!-- Footer -->
  <circle cx="420" cy="945" r="12" fill="#7c3aed" opacity="0.15"/>
  <text x="435" y="949" font-size="12" fill="#7c3aed" font-weight="bold" font-family="Arial,sans-serif">安心守護・全面保障</text>
  <text x="450" y="965" font-size="10" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">${name}・保障險保險分析</text>
</svg>`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    const svg = generateSVG(data);
    const svgB64 = Buffer.from(svg).toString('base64');
    const boundary = 'B' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = crypto.createHash('sha1').update(`format=png&timestamp=${timestamp}${API_SECRET}`).digest('hex');

    const uploadBody = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata:image/svg+xml;base64,${svgB64}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\npng`,
      `--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${API_KEY}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${sig}`,
      `--${boundary}--`
    ].join('\r\n');

    const url = await new Promise((resolve, reject) => {
      const r = https.request({
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${CLOUD_NAME}/image/upload`,
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(uploadBody) }
      }, res2 => {
        let d = ''; res2.on('data', c => d += c);
        res2.on('end', () => {
          try {
            const result = JSON.parse(d);
            if (result.secure_url) resolve(result.secure_url.replace(/\.[^.]+$/, '.png'));
            else reject(new Error(d));
          } catch(e) { reject(new Error(d)); }
        });
      });
      r.on('error', reject);
      r.write(uploadBody); r.end();
    });

    res.json({ url });
  } catch(e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
