const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateSVG(data) {
  const { name='', daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  const W = 1800, H = 1800;
  const CX = 900, CY = 900;
  const R = 150; // life circle radius
  const GAP = 8;
  const CARD_W = CX - R - GAP - 20;
  const CARD_H = CY - R - GAP - 20;

  function ok(v, s) { return Number(v) >= s; }

  function pillSVG(x, y, v, s, unit) {
    const isOk = ok(v, s);
    const bg = isOk ? '#d1fae5' : '#fee2e2';
    const color = isOk ? '#065f46' : '#dc2626';
    const icon = isOk ? '✓' : '!';
    const text = `${icon} ${Number(v).toLocaleString()} ${unit}`;
    return `<rect x="${x}" y="${y-22}" width="220" height="34" rx="17" fill="${bg}"/>
    <text x="${x+110}" y="${y+1}" font-size="22" fill="${color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${text}</text>`;
  }

  function pillBoolSVG(x, y, has) {
    const bg = has ? '#d1fae5' : '#fee2e2';
    const color = has ? '#065f46' : '#dc2626';
    const text = has ? '✓ 已投保' : '! 未投保';
    return `<rect x="${x}" y="${y-22}" width="220" height="34" rx="17" fill="${bg}"/>
    <text x="${x+110}" y="${y+1}" font-size="22" fill="${color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${text}</text>`;
  }

  function rowSVG(x, y, label, pillX, pillContent) {
    return `<text x="${x}" y="${y}" font-size="26" fill="#374151" font-family="Arial,sans-serif">${label}</text>
    ${pillContent(pillX, y)}`;
  }

  // Card positions (tight to center circle)
  const TLx = 20, TLy = 20;
  const TRx = CX + R + GAP, TRy = 20;
  const BLx = 20, BLy = CY + R + GAP;
  const BRx = CX + R + GAP, BRy = CY + R + GAP;

  const lifeOk = ok(life, 500);

  function card(x, y, w, h, headerBg, titleColor, iconSvg, title, subtitle, rows) {
    return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="30" fill="white" opacity="0.95"/>
    <rect x="${x}" y="${y}" width="${w}" height="${Math.min(110,h)}" rx="30" fill="${headerBg}"/>
    <rect x="${x}" y="${y+80}" width="${w}" height="30" fill="${headerBg}"/>
    ${iconSvg(x+28, y+32)}
    <text x="${x+130}" y="${y+58}" font-size="42" fill="${titleColor}" font-weight="bold" font-family="Arial,sans-serif">${title}</text>
    <text x="${x+130}" y="${y+82}" font-size="22" fill="${titleColor}" opacity="0.65" font-family="Arial,sans-serif">${subtitle}</text>
    <line x1="${x+20}" y1="${y+112}" x2="${x+w-20}" y2="${y+112}" stroke="#f0f0f0" stroke-width="2"/>
    ${rows(x, y)}`;
  }

  // Icon SVGs (simple flat style)
  const hospitalIcon = (x, y) => `<rect x="${x}" y="${y-20}" width="72" height="72" rx="16" fill="#dbeafe"/>
    <text x="${x+36}" y="${y+36}" font-size="40" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🏥</text>`;
  const bandageIcon = (x, y) => `<rect x="${x}" y="${y-20}" width="72" height="72" rx="16" fill="#ffe4e6"/>
    <text x="${x+36}" y="${y+36}" font-size="40" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🩹</text>`;
  const ribbonIcon = (x, y) => `<rect x="${x}" y="${y-20}" width="72" height="72" rx="16" fill="#ede9fe"/>
    <text x="${x+36}" y="${y+36}" font-size="40" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🎗️</text>`;
  const boltIcon = (x, y) => `<rect x="${x}" y="${y-20}" width="72" height="72" rx="16" fill="#ffedd5"/>
    <text x="${x+36}" y="${y+36}" font-size="40" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">⚡</text>`;

  const pillX_TL = TLx + CARD_W - 240;
  const pillX_TR = TRx + CARD_W - 240;
  const pillX_BL = BLx + CARD_W - 240;
  const pillX_BR = BRx + CARD_W - 240;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef2ff"/>
      <stop offset="100%" stop-color="#fdf2f8"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="sh">
      <feDropShadow dx="0" dy="4" stdDeviation="16" flood-color="#0000001a"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- TL: 小疾病 -->
  ${card(TLx, TLy, CARD_W, CARD_H, '#eff6ff', '#1d4ed8', hospitalIcon, '小疾病', '住院相關保障', (x,y) => `
    ${rowSVG(x+28, y+160, '住院日額（實支+定額）', pillX_TL, (px,py) => pillSVG(px,py,daily,3000,'元/天'))}
    ${rowSVG(x+28, y+210, '手術（實支實付）', pillX_TL, (px,py) => pillSVG(px,py,surgeryFixed,50000,'元'))}
    ${rowSVG(x+28, y+260, '手術（定額手術）', pillX_TL, (px,py) => pillSVG(px,py,surgeryFixed,50000,'元'))}
    ${rowSVG(x+28, y+310, '雜費', pillX_TL, (px,py) => pillSVG(px,py,inpatient,100000,'元'))}
  `)}

  <!-- TR: 小意外 -->
  ${card(TRx, TRy, CARD_W, CARD_H, '#fff1f2', '#be123c', bandageIcon, '小意外', '意外相關保障', (x,y) => `
    ${rowSVG(x+28, y+160, '意外門診', pillX_TR, (px,py) => pillSVG(px,py,accident,10000,'元'))}
    ${rowSVG(x+28, y+210, '骨折未住院', pillX_TR, (px,py) => pillSVG(px,py,fracture,30000,'元'))}
    ${rowSVG(x+28, y+260, '意外住院日額', pillX_TR, (px,py) => pillBoolSVG(px,py,Number(daily)>0))}
  `)}

  <!-- BL: 大疾病 -->
  ${card(BLx, BLy, CARD_W, CARD_H, '#f5f3ff', '#6d28d9', ribbonIcon, '大疾病', '重大疾病保障', (x,y) => `
    ${rowSVG(x+28, y+160, '重大傷病', pillX_BL, (px,py) => pillSVG(px,py,critical,100,'萬'))}
    ${rowSVG(x+28, y+210, '重大疾病', pillX_BL, (px,py) => pillSVG(px,py,critical,100,'萬'))}
    ${rowSVG(x+28, y+260, '癌症一次金', pillX_BL, (px,py) => pillSVG(px,py,cancer,100,'萬'))}
    ${rowSVG(x+28, y+310, '化療/放療', pillX_BL, (px,py) => pillSVG(px,py,0,1,'萬'))}
    ${rowSVG(x+28, y+360, '癌症住院', pillX_BL, (px,py) => pillSVG(px,py,0,3000,'元/日'))}
    ${rowSVG(x+28, y+410, '長照月給付', pillX_BL, (px,py) => pillSVG(px,py,ltc,30000,'元/月'))}
  `)}

  <!-- BR: 大意外 -->
  ${card(BRx, BRy, CARD_W, CARD_H, '#fff7ed', '#c2410c', boltIcon, '大意外', '意外相關保障', (x,y) => `
    ${rowSVG(x+28, y+160, '意外身故', pillX_BR, (px,py) => pillSVG(px,py,accDeath,500,'萬'))}
    ${rowSVG(x+28, y+210, '殘廢（1-11級）', pillX_BR, (px,py) => pillSVG(px,py,disability,500,'萬'))}
    ${rowSVG(x+28, y+260, '全殘', pillX_BR, (px,py) => pillSVG(px,py,disability,500,'萬'))}
  `)}

  <!-- Cross dashed lines -->
  <line x1="${CX}" y1="${20}" x2="${CX}" y2="${CY-R-GAP}" stroke="#d1d5db" stroke-width="3" stroke-dasharray="12,8"/>
  <line x1="${CX}" y1="${CY+R+GAP}" x2="${CX}" y2="${H-20}" stroke="#d1d5db" stroke-width="3" stroke-dasharray="12,8"/>
  <line x1="${20}" y1="${CY}" x2="${CX-R-GAP}" y2="${CY}" stroke="#d1d5db" stroke-width="3" stroke-dasharray="12,8"/>
  <line x1="${CX+R+GAP}" y1="${CY}" x2="${W-20}" y2="${CY}" stroke="#d1d5db" stroke-width="3" stroke-dasharray="12,8"/>

  <!-- Center Life Circle -->
  <circle cx="${CX}" cy="${CY}" r="${R+10}" fill="white" filter="url(#sh)"/>
  <circle cx="${CX}" cy="${CY}" r="${R+4}" fill="white"/>
  <circle cx="${CX}" cy="${CY}" r="${R+4}" fill="none" stroke="url(#ring)" stroke-width="10"/>
  
  <!-- Shield SVG icon in center -->
  <text x="${CX}" y="${CY-40}" font-size="70" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🛡️</text>
  <text x="${CX}" y="${CY+20}" font-size="38" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">壽險</text>
  <text x="${CX}" y="${CY+60}" font-size="${Number(life)>999?'28':'34'}" fill="${lifeOk?'#065f46':'#dc2626'}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${life?life+'萬':'未投保'}</text>
  ${!lifeOk?`<text x="${CX}" y="${CY+90}" font-size="18" fill="#dc2626" text-anchor="middle" font-family="Arial,sans-serif">⚠️ 建議500萬以上</text>`:`<text x="${CX}" y="${CY+90}" font-size="18" fill="#065f46" text-anchor="middle" font-family="Arial,sans-serif">✓ 保額充足</text>`}

  <!-- Footer -->
  <circle cx="${CX-120}" cy="${H-60}" r="22" fill="#ede9fe"/>
  <text x="${CX-120}" y="${H-52}" font-size="22" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🛡️</text>
  <text x="${CX+10}" y="${H-50}" font-size="28" fill="#7c3aed" font-weight="bold" font-family="Arial,sans-serif">安心守護・全面保障</text>
  <text x="${CX}" y="${H-22}" font-size="22" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">${name}・保寶險保障分析報告</text>
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
