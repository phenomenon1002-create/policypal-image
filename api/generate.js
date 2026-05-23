const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateSVG(data) {
  const { name, age, daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  function tag(v, s, unit) {
    const ok = Number(v) >= s;
    const color = ok ? '#15803d' : '#dc2626';
    const bg = ok ? '#dcfce7' : '#fee2e2';
    const icon = ok ? '✓' : '!';
    return `<rect x="BGRX" y="BGRY" width="82" height="17" rx="8" fill="${bg}"/>
    <text x="TXTX" y="TXTY" font-size="9.5" fill="${color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${icon} ${Number(v).toLocaleString()} ${unit}</text>`;
  }
  function tagB(has) {
    const color = has ? '#15803d' : '#dc2626';
    const bg = has ? '#dcfce7' : '#fee2e2';
    const txt = has ? '✓ 已投保' : '! 未投保';
    return `<rect x="BGRX" y="BGRY" width="82" height="17" rx="8" fill="${bg}"/>
    <text x="TXTX" y="TXTY" font-size="9.5" fill="${color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${txt}</text>`;
  }

  // Each quadrant is 250x200, center gap 80 for life circle
  // Layout: 580x580 total
  // Top-left: 0,0 to 250,250
  // Top-right: 330,0 to 580,250
  // Bottom-left: 0,330 to 250,580
  // Bottom-right: 330,330 to 580,580
  // Center: 250,250 to 330,330 (life circle)

  function makeTag(t, bx, by) {
    return t.replace('BGRX', bx).replace('BGRY', by)
            .replace('TXTX', bx+41).replace('TXTY', by+12);
  }

  function qRow(label, tagStr, qx, y) {
    const tagX = qx + 130;
    const t = makeTag(tagStr, tagX, y-13);
    return `<text x="${qx+8}" y="${y}" font-size="10.5" fill="#475569" font-family="Arial,sans-serif">${label}</text>${t}`;
  }
  function qRowB(label, tagStr, qx, y) {
    return qRow(label, tagStr, qx, y);
  }

  const lifeOk = Number(life) >= 500;
  const lifeColor = lifeOk ? '#15803d' : '#dc2626';
  const lifeBg = lifeOk ? '#dcfce7' : '#fee2e2';

  // Quadrant positions
  const TL = { x: 10, y: 10 };
  const TR = { x: 320, y: 10 };
  const BL = { x: 10, y: 320 };
  const BR = { x: 320, y: 320 };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#db2877"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="600" fill="#f5f0ff"/>

  <!-- Cross lines -->
  <line x1="300" y1="10" x2="300" y2="590" stroke="#e2d9f3" stroke-width="2"/>
  <line x1="10" y1="300" x2="590" y2="300" stroke="#e2d9f3" stroke-width="2"/>

  <!-- TL: 小疾病 -->
  <rect x="${TL.x}" y="${TL.y}" width="275" height="275" rx="16" fill="white" opacity="0.95"/>
  <text x="${TL.x+14}" y="${TL.y+28}" font-size="13" fill="#0369a1" font-weight="bold" font-family="Arial,sans-serif">🏥 小疾病</text>
  <line x1="${TL.x+8}" y1="${TL.y+36}" x2="${TL.x+267}" y2="${TL.y+36}" stroke="#e0f2fe" stroke-width="1.5"/>
  ${qRow('住院日額', tag(daily, 3000, '元/天'), TL.x, TL.y+65)}
  ${qRow('定額手術', tag(surgeryFixed, 50000, '元'), TL.x, TL.y+95)}
  ${qRow('實支雜費', tag(inpatient, 100000, '元'), TL.x, TL.y+125)}
  ${qRow('實支手術', tag(inpatient, 50000, '元'), TL.x, TL.y+155)}

  <!-- TR: 小意外 -->
  <rect x="${TR.x}" y="${TR.y}" width="275" height="275" rx="16" fill="white" opacity="0.95"/>
  <text x="${TR.x+14}" y="${TR.y+28}" font-size="13" fill="#9d174d" font-weight="bold" font-family="Arial,sans-serif">🩹 小意外</text>
  <line x1="${TR.x+8}" y1="${TR.y+36}" x2="${TR.x+267}" y2="${TR.y+36}" stroke="#fce7f3" stroke-width="1.5"/>
  ${qRow('骨折未住院', tag(fracture, 30000, '元'), TR.x, TR.y+65)}
  ${qRow('意外門診', tag(accident, 10000, '元'), TR.x, TR.y+95)}
  ${qRowB('意外住院日額', tagB(Number(daily)>0), TR.x, TR.y+125)}

  <!-- BL: 大疾病 -->
  <rect x="${BL.x}" y="${BL.y}" width="275" height="275" rx="16" fill="white" opacity="0.95"/>
  <text x="${BL.x+14}" y="${BL.y+28}" font-size="13" fill="#7c3aed" font-weight="bold" font-family="Arial,sans-serif">🎗️ 大疾病</text>
  <line x1="${BL.x+8}" y1="${BL.y+36}" x2="${BL.x+267}" y2="${BL.y+36}" stroke="#ede9fe" stroke-width="1.5"/>
  ${qRow('重大疾病/傷病', tag(critical, 100, '萬'), BL.x, BL.y+65)}
  ${qRow('癌症一次金', tag(cancer, 100, '萬'), BL.x, BL.y+95)}
  ${qRow('長照月給付', tag(ltc, 30000, '元/月'), BL.x, BL.y+125)}

  <!-- BR: 大意外 -->
  <rect x="${BR.x}" y="${BR.y}" width="275" height="275" rx="16" fill="white" opacity="0.95"/>
  <text x="${BR.x+14}" y="${BR.y+28}" font-size="13" fill="#b45309" font-weight="bold" font-family="Arial,sans-serif">⚡ 大意外</text>
  <line x1="${BR.x+8}" y1="${BR.y+36}" x2="${BR.x+267}" y2="${BR.y+36}" stroke="#fef3c7" stroke-width="1.5"/>
  ${qRow('意外身故', tag(accDeath, 500, '萬'), BR.x, BR.y+65)}
  ${qRow('殘廢/全殘', tag(disability, 500, '萬'), BR.x, BR.y+95)}
  ${qRowB('失能扶助金', tagB(Number(disability)>0), BR.x, BR.y+125)}

  <!-- Center: 壽險 -->
  <circle cx="300" cy="300" r="68" fill="url(#rg)" opacity="0.95"/>
  <circle cx="300" cy="300" r="56" fill="white"/>
  <text x="300" y="285" font-size="10" fill="#7c3aed" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold">💜 壽險</text>
  <text x="300" y="305" font-size="${Number(life)>999?'14':'18'}" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${life||'⚠️'}</text>
  <text x="300" y="320" font-size="10" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">${life?'萬':'未投保'}</text>

  <!-- Labels: 四角方向 -->
  <text x="148" y="5" font-size="11" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">疾病</text>
  <text x="452" y="5" font-size="11" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">意外</text>
  <text x="5" y="155" font-size="11" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif" transform="rotate(-90,5,155)">小</text>
  <text x="5" y="455" font-size="11" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif" transform="rotate(-90,5,455)">大</text>

  <!-- Client name -->
  <text x="300" y="592" font-size="10" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">${name} · 保寶險保障分析</text>
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
