const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateSVG(data) {
  const { name='', daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  const W = 1600, H = 1680;
  const CX = 800, CY = 820;
  const R = 155;
  const G = 10;

  const TLW = CX - R - G;
  const TLH = CY - R - G;
  const TRW = W - CX - R - G;
  const BLH = H - CY - R - G - 60;

  function ok(v,s){ return Number(v)>=s; }

  function pill(v,s,unit){
    const isOk=ok(v,s);
    return {bg:isOk?'#bbf7d0':'#fecaca',color:isOk?'#14532d':'#b91c1c',text:`${isOk?'✓':'!'} ${Number(v).toLocaleString()} ${unit}`};
  }
  function pillB(has){
    return {bg:has?'#bbf7d0':'#fecaca',color:has?'#14532d':'#b91c1c',text:has?'✓ 已投保':'! 未投保'};
  }

  // Draw a row with icon square, label, pill
  function row(cx, cy, iconBg, iconColor, iconPath, label, p, cardW) {
    const pillW = 230;
    const pillX = cx + cardW - pillW - 20;
    return `
      <rect x="${cx+16}" y="${cy-22}" width="44" height="44" rx="10" fill="${iconBg}"/>
      <text x="${cx+38}" y="${cy+8}" font-size="26" text-anchor="middle" fill="${iconColor}" font-family="Arial,sans-serif" font-weight="bold">${iconPath}</text>
      <text x="${cx+72}" y="${cy+8}" font-size="30" fill="#1f2937" font-family="Arial,sans-serif">${label}</text>
      <rect x="${pillX}" y="${cy-18}" width="${pillW}" height="36" rx="18" fill="${p.bg}"/>
      <text x="${pillX+pillW/2}" y="${cy+8}" font-size="22" fill="${p.color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${p.text}</text>`;
  }

  const lifeOk = ok(life,500);

  function header(x, y, w, hBg, iconBg, iconColor, iconText, title, titleColor, subtitle, subColor) {
    return `
      <rect x="${x}" y="${y}" width="${w}" height="100" rx="24" fill="${hBg}"/>
      <rect x="${x+16}" y="${y+16}" width="68" height="68" rx="16" fill="${iconBg}"/>
      <text x="${x+50}" y="${y+60}" font-size="38" text-anchor="middle" fill="${iconColor}" font-family="Arial,sans-serif" font-weight="bold">${iconText}</text>
      <text x="${x+100}" y="${y+52}" font-size="44" fill="${titleColor}" font-weight="bold" font-family="Arial,sans-serif">${title}</text>
      <text x="${x+100}" y="${y+80}" font-size="24" fill="${subColor}" font-family="Arial,sans-serif">${subtitle}</text>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#eef2ff"/>
    <stop offset="100%" stop-color="#fdf4ff"/>
  </linearGradient>
  <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#8b5cf6"/>
    <stop offset="100%" stop-color="#ec4899"/>
  </linearGradient>
  <filter id="sh"><feDropShadow dx="0" dy="4" stdDeviation="14" flood-color="#0000001a"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>

<!-- TL 小疾病 -->
<rect x="0" y="0" width="${TLW}" height="${TLH}" rx="28" fill="white" filter="url(#sh)"/>
${header(0,0,TLW,'#eff6ff','#dbeafe','#1d4ed8','＋','小疾病','#1d4ed8','住院相關保障','#93c5fd')}
<line x1="16" y1="104" x2="${TLW-16}" y2="104" stroke="#e0f2fe" stroke-width="1.5"/>
${row(0, 150, '#dbeafe', '#1d4ed8', '床', '住院日額（實支+定額）', pill(daily,3000,'元/天'), TLW)}
${row(0, 202, '#dbeafe', '#1d4ed8', '✂', '手術（實支實付）', pill(surgeryFixed,50000,'元'), TLW)}
${row(0, 254, '#dbeafe', '#1d4ed8', '刀', '手術（定額手術）', pill(surgeryFixed,50000,'元'), TLW)}
${row(0, 306, '#dbeafe', '#1d4ed8', '藥', '雜費', pill(inpatient,100000,'元'), TLW)}

<!-- TR 小意外 -->
<rect x="${CX+R+G}" y="0" width="${TRW}" height="${TLH}" rx="28" fill="white" filter="url(#sh)"/>
${header(CX+R+G,0,TRW,'#fff1f2','#ffe4e6','#be123c','＋','小意外','#be123c','意外相關保障','#fda4af')}
<line x1="${CX+R+G+16}" y1="104" x2="${CX+R+G+TRW-16}" y2="104" stroke="#ffe4e6" stroke-width="1.5"/>
${row(CX+R+G, 150, '#ffe4e6', '#be123c', '急', '意外門診', pill(accident,10000,'元'), TRW)}
${row(CX+R+G, 202, '#ffe4e6', '#be123c', '骨', '骨折未住院', pill(fracture,30000,'元'), TRW)}
${row(CX+R+G, 254, '#ffe4e6', '#be123c', '院', '意外住院日額', pillB(Number(daily)>0), TRW)}

<!-- BL 大疾病 -->
<rect x="0" y="${CY+R+G}" width="${TLW}" height="${BLH}" rx="28" fill="white" filter="url(#sh)"/>
${header(0,CY+R+G,TLW,'#f5f3ff','#ede9fe','#6d28d9','癌','大疾病','#6d28d9','重大疾病保障','#c4b5fd')}
<line x1="16" y1="${CY+R+G+104}" x2="${TLW-16}" y2="${CY+R+G+104}" stroke="#ede9fe" stroke-width="1.5"/>
${row(0, CY+R+G+150, '#ede9fe', '#6d28d9', '心', '重大傷病', pill(critical,100,'萬'), TLW)}
${row(0, CY+R+G+202, '#ede9fe', '#6d28d9', '盾', '重大疾病', pill(critical,100,'萬'), TLW)}
${row(0, CY+R+G+254, '#ede9fe', '#6d28d9', '症', '癌症一次金', pill(cancer,100,'萬'), TLW)}
${row(0, CY+R+G+306, '#ede9fe', '#6d28d9', '療', '化療/放療', pill(0,1,'萬'), TLW)}
${row(0, CY+R+G+358, '#ede9fe', '#6d28d9', '院', '癌症住院', pill(0,3000,'元/日'), TLW)}
${row(0, CY+R+G+410, '#ede9fe', '#6d28d9', '照', '長照月給付', pill(ltc,30000,'元/月'), TLW)}

<!-- BR 大意外 -->
<rect x="${CX+R+G}" y="${CY+R+G}" width="${TRW}" height="${BLH}" rx="28" fill="white" filter="url(#sh)"/>
${header(CX+R+G,CY+R+G,TRW,'#fff7ed','#ffedd5','#c2410c','⚡','大意外','#c2410c','意外相關保障','#fdba74')}
<line x1="${CX+R+G+16}" y1="${CY+R+G+104}" x2="${CX+R+G+TRW-16}" y2="${CY+R+G+104}" stroke="#ffedd5" stroke-width="1.5"/>
${row(CX+R+G, CY+R+G+150, '#ffedd5', '#c2410c', '故', '意外身故', pill(accDeath,500,'萬'), TRW)}
${row(CX+R+G, CY+R+G+202, '#ffedd5', '#c2410c', '殘', '殘廢（1-11級）', pill(disability,500,'萬'), TRW)}
${row(CX+R+G, CY+R+G+254, '#ffedd5', '#c2410c', '全', '全殘', pill(disability,500,'萬'), TRW)}

<!-- Cross lines -->
<line x1="${CX}" y1="${TLH}" x2="${CX}" y2="${CY-R-G}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>
<line x1="${CX}" y1="${CY+R+G}" x2="${CX}" y2="${CY+R+G+BLH}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>
<line x1="${TLW}" y1="${CY}" x2="${CX-R-G}" y2="${CY}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>
<line x1="${CX+R+G}" y1="${CY}" x2="${W}" y2="${CY}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>

<!-- Center -->
<circle cx="${CX}" cy="${CY}" r="${R+12}" fill="white" filter="url(#sh)"/>
<circle cx="${CX}" cy="${CY}" r="${R+4}" fill="white"/>
<circle cx="${CX}" cy="${CY}" r="${R+4}" fill="none" stroke="url(#ring)" stroke-width="10"/>
<!-- Shield path -->
<g transform="translate(${CX-40},${CY-90})">
  <path d="M40 0 L80 15 L80 50 C80 70 60 85 40 90 C20 85 0 70 0 50 L0 15 Z" fill="#8b5cf6" opacity="0.15"/>
  <path d="M40 8 L72 20 L72 50 C72 66 56 78 40 82 C24 78 8 66 8 50 L8 20 Z" fill="none" stroke="#8b5cf6" stroke-width="3"/>
  <path d="M28 45 L36 53 L54 35" fill="none" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round"/>
</g>
<text x="${CX}" y="${CY+16}" font-size="40" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">壽險</text>
<text x="${CX}" y="${CY+58}" font-size="${Number(life)>999?'28':'34'}" fill="${lifeOk?'#14532d':'#b91c1c'}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${life?life+'萬':'未投保'}</text>
${!lifeOk?`<text x="${CX}" y="${CY+84}" font-size="18" fill="#b91c1c" text-anchor="middle" font-family="Arial,sans-serif">建議500萬以上</text>`:`<text x="${CX}" y="${CY+84}" font-size="18" fill="#14532d" text-anchor="middle" font-family="Arial,sans-serif">✓ 保額充足</text>`}

<!-- Footer -->
<text x="${CX}" y="${H-24}" font-size="28" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">安心守護・全面保障</text>
<text x="${CX}" y="${H-2}" font-size="20" fill="#9ca3af" text-anchor="middle" font-family="Arial,sans-serif">${name}・保寶險保障分析報告</text>
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
        let d=''; res2.on('data',c=>d+=c);
        res2.on('end',()=>{ try{ const r=JSON.parse(d); if(r.secure_url) resolve(r.secure_url.replace(/\.[^.]+$/,'.png')); else reject(new Error(d)); }catch(e){reject(new Error(d));} });
      });
      r.on('error',reject); r.write(uploadBody); r.end();
    });
    res.json({ url });
  } catch(e) {
    console.error('Error:', e.message);
    res.status(500).json({ error: e.message });
  }
};
