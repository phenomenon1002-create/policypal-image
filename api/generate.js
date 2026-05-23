const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateSVG(data) {
  const { name='', age='', daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  function pill(v, s, unit) {
    const ok = Number(v) >= s;
    return {
      bg: ok ? '#d1fae5' : '#fee2e2',
      color: ok ? '#065f46' : '#dc2626',
      text: `${ok?'✓':'!'} ${Number(v).toLocaleString()} ${unit}`
    };
  }
  function pillB(has) {
    return { bg: has?'#d1fae5':'#fee2e2', color: has?'#065f46':'#dc2626', text: has?'✓ 已投保':'! 未投保' };
  }

  // Scale 2x for crisp rendering
  const S = 2;
  const W = 900 * S;
  const H = 940 * S;

  function row(x, y, emoji, label, p) {
    const rx = x * S, ry = y * S;
    return `
    <text x="${rx}" y="${ry+5}" font-size="${13*S}" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${emoji}</text>
    <text x="${rx+26*S}" y="${ry+5}" font-size="${11*S}" fill="#374151" font-family="Arial,sans-serif">${label}</text>
    <rect x="${rx+192*S}" y="${ry-13*S}" width="${88*S}" height="${19*S}" rx="${9*S}" fill="${p.bg}"/>
    <text x="${rx+236*S}" y="${ry+2}" font-size="${9.5*S}" fill="${p.color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${p.text}</text>`;
  }

  const lifeOk = Number(life) >= 500;

  // Card positions (in logical coords, will be scaled)
  const TL = {x:18, y:18, w:390, h:320};
  const TR = {x:492, y:18, w:390, h:320};
  const BL = {x:18, y:610, w:390, h:320};
  const BR = {x:492, y:610, w:390, h:320};
  const CY = 470; // center Y

  function card(c, titleEmoji, title, subtitle, titleColor, headerBg, rows) {
    const x=c.x*S, y=c.y*S, w=c.w*S, h=c.h*S, r=18*S;
    return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="white" filter="url(#sh)"/>
    <clipPath id="clip${title}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${58*S}" fill="${headerBg}" clip-path="url(#clip${title})"/>
    <text x="${x+16*S}" y="${y+36*S}" font-size="${22*S}" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${titleEmoji}</text>
    <text x="${x+56*S}" y="${y+37*S}" font-size="${20*S}" fill="${titleColor}" font-weight="bold" font-family="Arial,sans-serif">${title}</text>
    <text x="${x+56*S}" y="${y+52*S}" font-size="${10*S}" fill="${titleColor}" opacity="0.6" font-family="Arial,sans-serif">${subtitle}</text>
    ${rows}`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0f0ff"/>
      <stop offset="100%" stop-color="#fdf2f8"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="sh" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="${2*S}" stdDeviation="${8*S}" flood-color="#00000012"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- TL 小疾病 -->
  ${card(TL,'🏥','小疾病','住院相關保障','#1d4ed8','#eff6ff',`
    ${row(TL.x+18, TL.y+85, '🛏️', '住院日額（實支+定額）', pill(daily,3000,'元/天'))}
    ${row(TL.x+18, TL.y+120, '✂️', '手術（實支實付）', pill(surgeryFixed,50000,'元'))}
    ${row(TL.x+18, TL.y+155, '🔪', '手術（定額手術）', pill(surgeryFixed,50000,'元'))}
    ${row(TL.x+18, TL.y+190, '💊', '雜費', pill(inpatient,100000,'元'))}
  `)}

  <!-- TR 小意外 -->
  ${card(TR,'🩹','小意外','意外相關保障','#be123c','#fff1f2',`
    ${row(TR.x+18, TR.y+85, '🚑', '意外門診', pill(accident,10000,'元'))}
    ${row(TR.x+18, TR.y+120, '🦴', '骨折未住院', pill(fracture,30000,'元'))}
    ${row(TR.x+18, TR.y+155, '🛏️', '意外住院日額', pillB(Number(daily)>0))}
  `)}

  <!-- BL 大疾病 -->
  ${card(BL,'🎗️','大疾病','重大疾病保障','#6d28d9','#f5f3ff',`
    ${row(BL.x+18, BL.y+85, '💓', '重大傷病', pill(critical,100,'萬'))}
    ${row(BL.x+18, BL.y+120, '🛡️', '重大疾病', pill(critical,100,'萬'))}
    ${row(BL.x+18, BL.y+155, '🎗️', '癌症一次金', pill(cancer,100,'萬'))}
    ${row(BL.x+18, BL.y+190, '💉', '化療/放療/癌症住院', pill(0,1,'萬'))}
    ${row(BL.x+18, BL.y+225, '👴', '長照月給付', pill(ltc,30000,'元/月'))}
  `)}

  <!-- BR 大意外 -->
  ${card(BR,'⚡','大意外','意外相關保障','#c2410c','#fff7ed',`
    ${row(BR.x+18, BR.y+85, '🏃', '意外身故', pill(accDeath,500,'萬'))}
    ${row(BR.x+18, BR.y+120, '♿', '殘廢（1-11級）', pill(disability,500,'萬'))}
    ${row(BR.x+18, BR.y+155, '🤝', '全殘', pill(disability,500,'萬'))}
  `)}

  <!-- Cross lines -->
  <line x1="${450*S}" y1="${18*S}" x2="${450*S}" y2="${350*S}" stroke="#d1d5db" stroke-width="${2*S}" stroke-dasharray="${8*S},${5*S}"/>
  <line x1="${450*S}" y1="${590*S}" x2="${450*S}" y2="${930*S}" stroke="#d1d5db" stroke-width="${2*S}" stroke-dasharray="${8*S},${5*S}"/>
  <line x1="${18*S}" y1="${CY*S}" x2="${358*S}" y2="${CY*S}" stroke="#d1d5db" stroke-width="${2*S}" stroke-dasharray="${8*S},${5*S}"/>
  <line x1="${542*S}" y1="${CY*S}" x2="${882*S}" y2="${CY*S}" stroke="#d1d5db" stroke-width="${2*S}" stroke-dasharray="${8*S},${5*S}"/>

  <!-- Center life insurance circle -->
  <circle cx="${450*S}" cy="${CY*S}" r="${118*S}" fill="white" filter="url(#sh)"/>
  <circle cx="${450*S}" cy="${CY*S}" r="${110*S}" fill="white"/>
  <circle cx="${450*S}" cy="${CY*S}" r="${110*S}" fill="none" stroke="url(#ring)" stroke-width="${6*S}"/>
  <text x="${450*S}" y="${(CY-32)*S}" font-size="${38*S}" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🛡️</text>
  <text x="${450*S}" y="${(CY+8)*S}" font-size="${18*S}" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">壽險保額</text>
  <text x="${450*S}" y="${(CY+32)*S}" font-size="${life?22*S:16*S}" fill="${lifeOk?'#065f46':'#dc2626'}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${life ? life+'萬' : '⚠️ 未投保'}</text>
  ${!lifeOk ? `<text x="${450*S}" y="${(CY+52)*S}" font-size="${10*S}" fill="#dc2626" text-anchor="middle" font-family="Arial,sans-serif">建議500萬以上</text>` : `<text x="${450*S}" y="${(CY+52)*S}" font-size="${10*S}" fill="#065f46" text-anchor="middle" font-family="Arial,sans-serif">✓ 保額充足</text>`}

  <!-- Footer -->
  <text x="${450*S}" y="${920*S}" font-size="${13*S}" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">安心守護・全面保障</text>
  <text x="${450*S}" y="${936*S}" font-size="${10*S}" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">${name} · 保寶險保障分析報告</text>
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
