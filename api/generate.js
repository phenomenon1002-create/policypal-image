const https = require('https');
const http = require('http');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

async function uploadToCloudinary(b64, resourceType='image', format='png') {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramStr = `format=${format}&timestamp=${timestamp}`;
    const sig = crypto.createHash('sha1').update(paramStr + API_SECRET).digest('hex');
    const boundary = 'Boundary' + Date.now();
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata:image/png;base64,${b64}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\n${format}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${API_KEY}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${sig}`,
      `--${boundary}--`
    ];
    const body = parts.join('\r\n');
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const result = JSON.parse(d);
          console.log('Cloudinary result:', JSON.stringify(result).slice(0,200));
          if (result.secure_url) resolve(result.secure_url);
          else reject(new Error(JSON.stringify(result)));
        } catch(e) { reject(new Error(d)); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

function generateSVG(data) {
  const { name, age, daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  function tag(v, s, unit) {
    const ok = Number(v) >= s;
    const color = ok ? '#15803d' : '#dc2626';
    const bg = ok ? '#dcfce7' : '#fee2e2';
    const icon = ok ? '✓' : '!';
    return { color, bg, text: `${icon} ${Number(v).toLocaleString()} ${unit}` };
  }
  function tagB(has) {
    return { color: has?'#15803d':'#dc2626', bg: has?'#dcfce7':'#fee2e2', text: has?'✓ 已投保':'! 未投保' };
  }

  function rowSVG(x, y, label, t) {
    return `<text x="${x+8}" y="${y}" font-size="10.5" fill="#64748b" font-family="Arial">${label}</text>
    <rect x="${x+108}" y="${y-12}" width="78" height="16" rx="8" fill="${t.bg}"/>
    <text x="${x+147}" y="${y}" font-size="9.5" fill="${t.color}" text-anchor="middle" font-weight="bold" font-family="Arial">${t.text}</text>`;
  }

  const lifeOk = Number(life) >= 500;
  const q = [
    { title: '🏥 小疾病', color: '#0369a1', x: 10, y: 250, rows: [
      rowSVG(10, 300, '住院日額', tag(daily, 3000, '元/天')),
      rowSVG(10, 320, '定額手術', tag(surgeryFixed, 50000, '元')),
      rowSVG(10, 340, '實支雜費', tag(inpatient, 100000, '元')),
      rowSVG(10, 360, '實支手術', tag(inpatient, 50000, '元')),
    ]},
    { title: '🩹 小意外', color: '#9d174d', x: 315, y: 250, rows: [
      rowSVG(315, 300, '骨折未住院', tag(fracture, 30000, '元')),
      rowSVG(315, 320, '意外門診', tag(accident, 10000, '元')),
      rowSVG(315, 340, '意外住院日額', tagB(Number(daily) > 0)),
    ]},
    { title: '🎗️ 大疾病', color: '#7c3aed', x: 10, y: 385, rows: [
      rowSVG(10, 435, '重大疾病/傷病', tag(critical, 100, '萬')),
      rowSVG(10, 455, '癌症一次金', tag(cancer, 100, '萬')),
      rowSVG(10, 475, '長照月給付', tag(ltc, 30000, '元/月')),
    ]},
    { title: '⚡ 大意外', color: '#b45309', x: 315, y: 385, rows: [
      rowSVG(315, 435, '意外身故', tag(accDeath, 500, '萬')),
      rowSVG(315, 455, '殘廢/全殘', tag(disability, 500, '萬')),
      rowSVG(315, 475, '失能扶助金', tagB(Number(disability) > 0)),
    ]},
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="620" height="530" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b0764"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#db2777"/>
    </linearGradient>
    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#db2877"/>
    </linearGradient>
  </defs>
  <rect width="620" height="530" fill="#f5f0ff"/>

  <!-- Header -->
  <rect x="10" y="8" width="600" height="105" rx="16" fill="url(#hg)"/>
  <text x="310" y="38" font-size="17" fill="white" text-anchor="middle" font-weight="bold" font-family="Arial">醫療雙十字保障分析</text>
  <text x="310" y="57" font-size="11" fill="rgba(255,255,255,0.75)" text-anchor="middle" font-family="Arial">保寶險 AI 夥伴・保障更聰明</text>
  <rect x="20" y="68" width="180" height="36" rx="8" fill="rgba(255,255,255,0.18)"/>
  <text x="30" y="82" font-size="9.5" fill="rgba(255,255,255,0.65)" font-family="Arial">客戶姓名</text>
  <text x="30" y="97" font-size="13" fill="white" font-weight="bold" font-family="Arial">${name}</text>
  <rect x="215" y="68" width="180" height="36" rx="8" fill="rgba(255,255,255,0.18)"/>
  <text x="225" y="82" font-size="9.5" fill="rgba(255,255,255,0.65)" font-family="Arial">年齡</text>
  <text x="225" y="97" font-size="13" fill="white" font-weight="bold" font-family="Arial">${age}</text>

  <!-- Life Insurance -->
  <rect x="10" y="122" width="600" height="118" rx="16" fill="white"/>
  <text x="310" y="145" font-size="12" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial">💜 壽險保額（核心保障）</text>
  <circle cx="310" cy="200" r="40" fill="url(#rg)"/>
  <circle cx="310" cy="200" r="32" fill="white"/>
  <text x="310" y="196" font-size="${Number(life)>999?'13':'17'}" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial">${life||'⚠️'}</text>
  <text x="310" y="210" font-size="9.5" fill="#94a3b8" text-anchor="middle" font-family="Arial">${life?'萬':'未投保'}</text>
  <rect x="250" y="225" width="120" height="22" rx="11" fill="${lifeOk?'#dcfce7':'#fee2e2'}"/>
  <text x="310" y="240" font-size="10.5" fill="${lifeOk?'#15803d':'#dc2626'}" text-anchor="middle" font-weight="bold" font-family="Arial">${lifeOk?'✓ 保額充足':'⚠️ 建議500萬以上'}</text>

  <!-- 4 Quadrants -->
  ${q.map(card => `
  <rect x="${card.x}" y="${card.y}" width="295" height="130" rx="14" fill="white"/>
  <text x="${card.x+14}" y="${card.y+25}" font-size="12.5" fill="${card.color}" font-weight="bold" font-family="Arial">${card.title}</text>
  <line x1="${card.x+6}" y1="${card.y+32}" x2="${card.x+289}" y2="${card.y+32}" stroke="#f1f5f9" stroke-width="1.5"/>
  ${card.rows.join('\n')}
  `).join('')}

  <!-- Footer -->
  <text x="310" y="525" font-size="9" fill="#94a3b8" text-anchor="middle" font-family="Arial">本報告僅供參考，實際保障依保單條款為準</text>
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
    console.log('Generating for:', data.name);
    const svg = generateSVG(data);
    
    // Convert SVG to PNG using Cloudinary's built-in conversion
    const svgB64 = Buffer.from(svg).toString('base64');
    const boundary = 'Boundary' + Date.now();
    const timestamp = Math.floor(Date.now() / 1000);
    const paramStr = `format=png&timestamp=${timestamp}`;
    const sig = crypto.createHash('sha1').update(paramStr + API_SECRET).digest('hex');
    
    const uploadBody = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata:image/svg+xml;base64,${svgB64}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\npng`,
      `--${boundary}\r\nContent-Disposition: form-data; name="api_key"\r\n\r\n${API_KEY}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="timestamp"\r\n\r\n${timestamp}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="signature"\r\n\r\n${sig}`,
      `--${boundary}--`
    ].join('\r\n');

    const url = await new Promise((resolve, reject) => {
      const req2 = https.request({
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${CLOUD_NAME}/image/upload`,
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': Buffer.byteLength(uploadBody) }
      }, r => {
        let d = ''; r.on('data', c => d += c);
        r.on('end', () => {
          try {
            const result = JSON.parse(d);
            console.log('Upload result:', d.slice(0,300));
            if (result.secure_url) {
              // Force PNG format in URL
              const pngUrl = result.secure_url.replace(/\.[^.]+$/, '.png');
              resolve(pngUrl);
            } else reject(new Error(d));
          } catch(e) { reject(new Error(d)); }
        });
      });
      req2.on('error', reject);
      req2.write(uploadBody); req2.end();
    });

    console.log('Generated URL:', url);
    res.json({ url });
  } catch(e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
