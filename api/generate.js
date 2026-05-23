const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateSVG(data) {
  const { name='', daily=0, surgeryFixed=0, inpatient=0, fracture=0, accident=0, accDeath=0, disability=0, critical=0, cancer=0, ltc=0, life=0 } = data;

  // Total canvas 1600x1600
  // Center circle radius 140
  // Cards fill all remaining space tightly
  const W = 1600, H = 1640;
  const CX = 800, CY = 800;
  const R = 145;
  const PAD = 6; // gap between card and circle

  // Card dimensions - fill all the way to edges
  const LEFT_W = CX - R - PAD; // ~649
  const RIGHT_W = W - (CX + R + PAD); // ~649
  const TOP_H = CY - R - PAD; // ~649
  const BOT_H = H - (CY + R + PAD) - 40; // ~609

  function ok(v,s){ return Number(v)>=s; }

  function pill(v,s,unit){
    const isOk=ok(v,s);
    return {bg:isOk?'#d1fae5':'#fee2e2',color:isOk?'#065f46':'#dc2626',text:`${isOk?'✓':'!'} ${Number(v).toLocaleString()} ${unit}`};
  }
  function pillB(has){
    return {bg:has?'#d1fae5':'#fee2e2',color:has?'#065f46':'#dc2626',text:has?'✓ 已投保':'! 未投保'};
  }

  function drawRow(x, y, iconEmoji, label, p, pillW=190) {
    const iconX = x+16, textX = x+70, pillX = x+LEFT_W-pillW-16;
    return `
    <text x="${iconX}" y="${y+4}" font-size="28" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${iconEmoji}</text>
    <text x="${textX}" y="${y+6}" font-size="30" fill="#374151" font-family="Arial,sans-serif">${label}</text>
    <rect x="${pillX}" y="${y-17}" width="${pillW}" height="30" rx="15" fill="${p.bg}"/>
    <text x="${pillX+pillW/2}" y="${y+5}" font-size="22" fill="${p.color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${p.text}</text>`;
  }
  function drawRowR(x, y, iconEmoji, label, p, cardW, pillW=190) {
    const iconX = x+16, textX = x+70, pillX = x+cardW-pillW-16;
    return `
    <text x="${iconX}" y="${y+4}" font-size="28" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${iconEmoji}</text>
    <text x="${textX}" y="${y+6}" font-size="30" fill="#374151" font-family="Arial,sans-serif">${label}</text>
    <rect x="${pillX}" y="${y-17}" width="${pillW}" height="30" rx="15" fill="${p.bg}"/>
    <text x="${pillX+pillW/2}" y="${y+5}" font-size="22" fill="${p.color}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${p.text}</text>`;
  }

  const lifeOk = ok(life,500);
  const TLx=0,TLy=0,TRx=CX+R+PAD,TRy=0;
  const BLx=0,BLy=CY+R+PAD,BRx=CX+R+PAD,BRy=CY+R+PAD;
  const HS=90; // header size

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#eef2ff"/><stop offset="100%" stop-color="#fdf4ff"/></linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#ec4899"/></linearGradient>
    <filter id="sh"><feDropShadow dx="0" dy="3" stdDeviation="12" flood-color="#0000001a"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- TL 小疾病 -->
  <rect x="${TLx}" y="${TLy}" width="${LEFT_W}" height="${TOP_H}" rx="28" fill="white" filter="url(#sh)"/>
  <rect x="${TLx}" y="${TLy}" width="${LEFT_W}" height="${HS}" rx="28" fill="#eff6ff"/>
  <rect x="${TLx}" y="${TLy+HS-20}" width="${LEFT_W}" height="20" fill="#eff6ff"/>
  <rect x="${TLx+16}" y="${TLy+14}" width="58" height="58" rx="14" fill="#dbeafe"/>
  <text x="${TLx+45}" y="${TLy+55}" font-size="34" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🏥</text>
  <text x="${TLx+90}" y="${TLy+50}" font-size="42" fill="#1d4ed8" font-weight="bold" font-family="Arial,sans-serif">小疾病</text>
  <text x="${TLx+90}" y="${TLy+74}" font-size="22" fill="#93c5fd" font-family="Arial,sans-serif">住院相關保障</text>
  <line x1="${TLx+16}" y1="${TLy+HS}" x2="${LEFT_W-16}" y2="${TLy+HS}" stroke="#e0e7ff" stroke-width="1.5"/>
  ${drawRow(TLx, TLy+HS+42, '🛏️', '住院日額（實支+定額）', pill(daily,3000,'元/天'))}
  ${drawRow(TLx, TLy+HS+90, '✂️', '手術（實支實付）', pill(surgeryFixed,50000,'元'))}
  ${drawRow(TLx, TLy+HS+138, '🔪', '手術（定額手術）', pill(surgeryFixed,50000,'元'))}
  ${drawRow(TLx, TLy+HS+186, '💊', '雜費', pill(inpatient,100000,'元'))}

  <!-- TR 小意外 -->
  <rect x="${TRx}" y="${TRy}" width="${RIGHT_W}" height="${TOP_H}" rx="28" fill="white" filter="url(#sh)"/>
  <rect x="${TRx}" y="${TRy}" width="${RIGHT_W}" height="${HS}" rx="28" fill="#fff1f2"/>
  <rect x="${TRx}" y="${TRy+HS-20}" width="${RIGHT_W}" height="20" fill="#fff1f2"/>
  <rect x="${TRx+16}" y="${TRy+14}" width="58" height="58" rx="14" fill="#ffe4e6"/>
  <text x="${TRx+45}" y="${TRy+55}" font-size="34" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🩹</text>
  <text x="${TRx+90}" y="${TRy+50}" font-size="42" fill="#be123c" font-weight="bold" font-family="Arial,sans-serif">小意外</text>
  <text x="${TRx+90}" y="${TRy+74}" font-size="22" fill="#fda4af" font-family="Arial,sans-serif">意外相關保障</text>
  <line x1="${TRx+16}" y1="${TRy+HS}" x2="${TRx+RIGHT_W-16}" y2="${TRy+HS}" stroke="#ffe4e6" stroke-width="1.5"/>
  ${drawRowR(TRx, TRy+HS+42, '🚑', '意外門診', pill(accident,10000,'元'), RIGHT_W)}
  ${drawRowR(TRx, TRy+HS+90, '🦴', '骨折未住院', pill(fracture,30000,'元'), RIGHT_W)}
  ${drawRowR(TRx, TRy+HS+138, '🛏️', '意外住院日額', pillB(Number(daily)>0), RIGHT_W)}

  <!-- BL 大疾病 -->
  <rect x="${BLx}" y="${BLy}" width="${LEFT_W}" height="${BOT_H}" rx="28" fill="white" filter="url(#sh)"/>
  <rect x="${BLx}" y="${BLy}" width="${LEFT_W}" height="${HS}" rx="28" fill="#f5f3ff"/>
  <rect x="${BLx}" y="${BLy+HS-20}" width="${LEFT_W}" height="20" fill="#f5f3ff"/>
  <rect x="${BLx+16}" y="${BLy+14}" width="58" height="58" rx="14" fill="#ede9fe"/>
  <text x="${BLx+45}" y="${BLy+55}" font-size="34" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🎗️</text>
  <text x="${BLx+90}" y="${BLy+50}" font-size="42" fill="#6d28d9" font-weight="bold" font-family="Arial,sans-serif">大疾病</text>
  <text x="${BLx+90}" y="${BLy+74}" font-size="22" fill="#c4b5fd" font-family="Arial,sans-serif">重大疾病保障</text>
  <line x1="${BLx+16}" y1="${BLy+HS}" x2="${LEFT_W-16}" y2="${BLy+HS}" stroke="#ede9fe" stroke-width="1.5"/>
  ${drawRow(BLx, BLy+HS+42, '💓', '重大傷病', pill(critical,100,'萬'))}
  ${drawRow(BLx, BLy+HS+88, '🛡️', '重大疾病', pill(critical,100,'萬'))}
  ${drawRow(BLx, BLy+HS+134, '🎗️', '癌症一次金', pill(cancer,100,'萬'))}
  ${drawRow(BLx, BLy+HS+180, '💉', '化療/放療', pill(0,1,'萬'))}
  ${drawRow(BLx, BLy+HS+226, '🏥', '癌症住院', pill(0,3000,'元/日'))}
  ${drawRow(BLx, BLy+HS+272, '👴', '長照月給付', pill(ltc,30000,'元/月'))}

  <!-- BR 大意外 -->
  <rect x="${BRx}" y="${BRy}" width="${RIGHT_W}" height="${BOT_H}" rx="28" fill="white" filter="url(#sh)"/>
  <rect x="${BRx}" y="${BRy}" width="${RIGHT_W}" height="${HS}" rx="28" fill="#fff7ed"/>
  <rect x="${BRx}" y="${BRy+HS-20}" width="${RIGHT_W}" height="20" fill="#fff7ed"/>
  <rect x="${BRx+16}" y="${BRy+14}" width="58" height="58" rx="14" fill="#ffedd5"/>
  <text x="${BRx+45}" y="${BRy+55}" font-size="34" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">⚡</text>
  <text x="${BRx+90}" y="${BRy+50}" font-size="42" fill="#c2410c" font-weight="bold" font-family="Arial,sans-serif">大意外</text>
  <text x="${BRx+90}" y="${BRy+74}" font-size="22" fill="#fdba74" font-family="Arial,sans-serif">意外相關保障</text>
  <line x1="${BRx+16}" y1="${BRy+HS}" x2="${BRx+RIGHT_W-16}" y2="${BRy+HS}" stroke="#ffedd5" stroke-width="1.5"/>
  ${drawRowR(BRx, BRy+HS+42, '🏃', '意外身故', pill(accDeath,500,'萬'), RIGHT_W)}
  ${drawRowR(BRx, BRy+HS+88, '♿', '殘廢（1-11級）', pill(disability,500,'萬'), RIGHT_W)}
  ${drawRowR(BRx, BRy+HS+134, '🤝', '全殘', pill(disability,500,'萬'), RIGHT_W)}

  <!-- Cross lines -->
  <line x1="${CX}" y1="${TOP_H}" x2="${CX}" y2="${CY-R-PAD}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>
  <line x1="${CX}" y1="${CY+R+PAD}" x2="${CX}" y2="${CY+R+PAD+BOT_H}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>
  <line x1="${LEFT_W}" y1="${CY}" x2="${CX-R-PAD}" y2="${CY}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>
  <line x1="${CX+R+PAD}" y1="${CY}" x2="${W}" y2="${CY}" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,7"/>

  <!-- Center circle -->
  <circle cx="${CX}" cy="${CY}" r="${R+8}" fill="white" filter="url(#sh)"/>
  <circle cx="${CX}" cy="${CY}" r="${R+2}" fill="white"/>
  <circle cx="${CX}" cy="${CY}" r="${R+2}" fill="none" stroke="url(#ring)" stroke-width="8"/>
  <text x="${CX}" y="${CY-50}" font-size="60" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🛡️</text>
  <text x="${CX}" y="${CY+12}" font-size="34" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">壽險</text>
  <text x="${CX}" y="${CY+48}" font-size="${Number(life)>999?'24':'30'}" fill="${lifeOk?'#065f46':'#dc2626'}" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">${life?life+'萬':'未投保'}</text>
  ${!lifeOk?`<text x="${CX}" y="${CY+72}" font-size="16" fill="#dc2626" text-anchor="middle" font-family="Arial,sans-serif">⚠️ 建議500萬以上</text>`:`<text x="${CX}" y="${CY+72}" font-size="16" fill="#065f46" text-anchor="middle" font-family="Arial,sans-serif">✓ 保額充足</text>`}

  <!-- Footer -->
  <text x="${CX}" y="${H-12}" font-size="24" fill="#7c3aed" text-anchor="middle" font-weight="bold" font-family="Arial,sans-serif">🛡️ 安心守護・全面保障</text>
  <text x="${CX}" y="${H+10}" font-size="18" fill="#94a3b8" text-anchor="middle" font-family="Arial,sans-serif">${name}・保寶險保障分析報告</text>
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
