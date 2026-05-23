const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

async function uploadToCloudinary(b64) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = crypto.createHash('sha1').update(`timestamp=${timestamp}${API_SECRET}`).digest('hex');
    const boundary = 'Boundary' + Date.now();
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata:image/svg+xml;base64,${b64}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="resource_type"\r\n\r\nimage`,
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
  const { name, age, daily, surgeryFixed, inpatient, fracture, accident, accDeath, disability, critical, cancer, ltc, life } = data;

  function statusColor(v, s) { return v >= s ? '#15803d' : '#dc2626'; }
  function statusBg(v, s) { return v >= s ? '#dcfce7' : '#fee2e2'; }
  function statusIcon(v, s) { return v >= s ? '✓' : '!'; }
  function boolColor(h) { return h ? '#15803d' : '#dc2626'; }
  function boolBg(h) { return h ? '#dcfce7' : '#fee2e2'; }

  function row(y, label, v, s, unit) {
    const color = statusColor(v, s);
    const bg = statusBg(v, s);
    const icon = statusIcon(v, s);
    const valText = `${icon} ${Number(v).toLocaleString()} ${unit}`;
    return `
      <text x="15" y="${y}" font-size="11" fill="#64748b">${label}</text>
      <rect x="115" y="${y-12}" width="80" height="16" rx="8" fill="${bg}"/>
      <text x="155" y="${y}" font-size="10" fill="${color}" text-anchor="middle" font-weight="bold">${valText}</text>`;
  }

  function rowB(y, label, has) {
    const color = boolColor(has);
    const bg = boolBg(has);
    const text = has ? '✓ 已投保' : '! 未投保';
    return `
      <text x="15" y="${y}" font-size="11" fill="#64748b">${label}</text>
      <rect x="115" y="${y-12}" width="80" height="16" rx="8" fill="${bg}"/>
      <text x="155" y="${y}" font-size="10" fill="${color}" text-anchor="middle" font-weight="bold">${text}</text>`;
  }

  const lifeOk = life >= 500;
  const lifeColor = lifeOk ? '#15803d' : '#dc2626';
  const lifeBg = lifeOk ? '#dcfce7' : '#fee2e2';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="620" height="720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b0764"/>
      <stop offset="50%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#db2777"/>
    </linearGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#db2877"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="620" height="720" fill="#f5f0ff"/>

  <!-- Header -->
  <rect x="10" y="10" width="600" height="110" rx="16" fill="url(#headerGrad)"/>
  <text x="310" y="45" font-size="18" fill="white" text-anchor="middle" font-weight="bold" font-family="Arial">🐾 醫療雙十字保障分析</text>
  <text x="310" y="65" font-size="12" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="Arial">保寶險 AI 夥伴・保障更聰明</text>

  <!-- Info boxes -->
  <rect x="20" y="75" width="180" height="36" rx="8" fill="rgba(255,255,255,0.15)"/>
  <text x="30" y="90" font-size="10" fill="rgba(255,255,255,0.6)" font-family="Arial">客戶姓名</text>
  <text x="30" y="105" font-size="14" fill="white" font-weight="bold" font-family="Arial">${name}</text>

  <rect x="210" y="75" width="180" height="36" rx="8" fill="rgba(255,255,255,0.15)"/>
  <text x="220" y="90" font-size="10" fill="rgba(255,255,255,0.6)" font-family="Arial">年齡</text>
  <text x="220" y="105" font-size="14" fill="white" font-weight="bold" font-family="Arial">${age}</text>

  <!-- Life Insurance -->
  <rect x="10" y="130" width="600" height="110" rx="16" fill="white"/>
  <text x="310" y="155" font-size="13" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial">💜 壽險保額（核心保障）</text>
  <circle cx="310" cy="205" r="42" fill="url(#ringGrad)"/>
  <circle cx="310" cy="205" r="34" fill="white"/>
  <text x="310" y="201" font-size="${life > 999 ? '14' : '18'}" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial">${life || '⚠️'}</text>
  <text x="310" y="215" font-size="10" fill="#94a3b8" text-anchor="middle" font-family="Arial">${life ? '萬' : '未投保'}</text>

  <!-- Four quadrants -->
  <!-- 小疾病 -->
  <rect x="10" y="250" width="295" height="120" rx="14" fill="white"/>
  <text x="25" y="275" font-size="13" fill="#0369a1" font-weight="bold" font-family="Arial">🏥 小疾病</text>
  <line x1="15" y1="282" x2="300" y2="282" stroke="#f1f5f9" stroke-width="1.5"/>
  ${row(300, '住院日額', daily, 3000, '元/天')}
  ${row(320, '定額手術', surgeryFixed, 50000, '元')}
  ${row(340, '實支雜費', inpatient, 100000, '元')}
  ${row(360, '實支手術', inpatient, 50000, '元')}

  <!-- 小意外 -->
  <rect x="315" y="250" width="295" height="120" rx="14" fill="white"/>
  <text x="330" y="275" font-size="13" fill="#9d174d" font-weight="bold" font-family="Arial">🩹 小意外</text>
  <line x1="320" y1="282" x2="605" y2="282" stroke="#f1f5f9" stroke-width="1.5"/>
  <g transform="translate(305,0)">
  ${row(300, '骨折未住院', fracture, 30000, '元')}
  ${row(320, '意外門診', accident, 10000, '元')}
  ${rowB(340, '意外住院日額', daily > 0)}
  </g>

  <!-- 大疾病 -->
  <rect x="10" y="380" width="295" height="120" rx="14" fill="white"/>
  <text x="25" y="405" font-size="13" fill="#7c3aed" font-weight="bold" font-family="Arial">🎗️ 大疾病</text>
  <line x1="15" y1="412" x2="300" y2="412" stroke="#f1f5f9" stroke-width="1.5"/>
  ${row(430, '重大疾病/傷病', critical, 100, '萬')}
  ${row(450, '癌症一次金', cancer, 100, '萬')}
  ${row(470, '長照月給付', ltc, 30000, '元/月')}
  ${row(490, '癌症住院日額', 0, 3000, '元/天')}

  <!-- 大意外 -->
  <rect x="315" y="380" width="295" height="120" rx="14" fill="white"/>
  <text x="330" y="405" font-size="13" fill="#b45309" font-weight="bold" font-family="Arial">⚡ 大意外</text>
  <line x1="320" y1="412" x2="605" y2="412" stroke="#f1f5f9" stroke-width="1.5"/>
  <g transform="translate(305,0)">
  ${row(430, '意外身故', accDeath, 500, '萬')}
  ${row(450, '殘廢/全殘', disability, 500, '萬')}
  ${rowB(470, '失能扶助金', disability > 0)}
  </g>

  <!-- Footer -->
  <text x="310" y="520" font-size="10" fill="#94a3b8" text-anchor="middle" font-family="Arial">保寶險 AI 夥伴・保障更聰明 | 本報告僅供參考，實際保障依保單條款為準</text>
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
    const b64 = Buffer.from(svg).toString('base64');
    const url = await uploadToCloudinary(b64);
    res.json({ url });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
