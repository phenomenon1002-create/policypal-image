
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const https = require('https');

const CLOUD_NAME = 'dsicpafgz';
const API_KEY = '989282614168298';
const API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw';

function generateHTML(data) {
  const { name, age, daily, surgeryFixed, inpatient, fracture, accident, accDeath, disability, critical, cancer, ltc, life } = data;

  function tag(v, s, unit) {
    const ok = v >= s;
    return `<span style="background:${ok?'#dcfce7':'#fee2e2'};color:${ok?'#15803d':'#dc2626'};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${ok?'✓':'!'} ${Number(v).toLocaleString()} ${unit}</span>`;
  }
  function tagB(has) {
    return `<span style="background:${has?'#dcfce7':'#fee2e2'};color:${has?'#15803d':'#dc2626'};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${has?'✓ 已投保':'! 未投保'}</span>`;
  }
  function row(label, v, s, unit) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f8fafc"><span style="font-size:11px;color:#64748b">${label}</span>${tag(v,s,unit)}</div>`;
  }
  function rowB(label, has) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f8fafc"><span style="font-size:11px;color:#64748b">${label}</span>${tagB(has)}</div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Noto Sans TC',sans-serif;background:#f5f0ff;padding:20px;width:620px}</style>
</head><body>
<div style="background:linear-gradient(135deg,#3b0764,#7c3aed,#db2777);border-radius:20px;padding:20px;text-align:center;margin-bottom:14px">
  <div style="font-size:20px;font-weight:900;color:white">🐾 醫療雙十字保障分析</div>
  <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px">保寶險 AI 夥伴</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;text-align:left">
      <div style="font-size:10px;color:rgba(255,255,255,0.6)">客戶姓名</div>
      <div style="font-size:15px;color:white;font-weight:800">${name}</div>
    </div>
    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;text-align:left">
      <div style="font-size:10px;color:rgba(255,255,255,0.6)">年齡</div>
      <div style="font-size:15px;color:white;font-weight:800">${age}</div>
    </div>
  </div>
</div>

<div style="background:white;border-radius:16px;padding:16px;text-align:center;margin-bottom:12px;box-shadow:0 2px 12px rgba(124,58,237,0.1)">
  <div style="font-size:13px;font-weight:700;color:#7c3aed;margin-bottom:10px">💜 壽險保額（核心保障）</div>
  <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#db2777);display:flex;align-items:center;justify-content:center;margin:0 auto 10px">
    <div style="width:72px;height:72px;border-radius:50%;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center">
      <div style="font-size:16px;font-weight:900;color:#7c3aed">${life||'⚠️'}</div>
      <div style="font-size:10px;color:#94a3b8">${life?'萬':'未投保'}</div>
    </div>
  </div>
  <div style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${life>=500?'#dcfce7':'#fee2e2'};color:${life>=500?'#15803d':'#dc2626'}">
    ${life>=500?'✓ 保額充足':'⚠️ 建議500萬以上'}
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
  <div style="background:white;border-radius:14px;padding:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
    <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#0369a1;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #f1f5f9">🏥 小疾病</div>
    ${row('住院日額',daily,3000,'元/天')}
    ${row('定額手術',surgeryFixed,50000,'元')}
    ${row('實支雜費',inpatient,100000,'元')}
  </div>
  <div style="background:white;border-radius:14px;padding:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
    <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#9d174d;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #f1f5f9">🩹 小意外</div>
    ${row('骨折未住院',fracture,30000,'元')}
    ${row('意外門診',accident,10000,'元')}
    ${rowB('意外住院日額',daily>0)}
  </div>
  <div style="background:white;border-radius:14px;padding:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
    <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#7c3aed;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #f1f5f9">🎗️ 大疾病</div>
    ${row('重大疾病/傷病',critical,100,'萬')}
    ${row('癌症一次金',cancer,100,'萬')}
    ${row('長照月給付',ltc,30000,'元/月')}
  </div>
  <div style="background:white;border-radius:14px;padding:12px;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
    <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#b45309;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #f1f5f9">⚡ 大意外</div>
    ${row('意外身故',accDeath,500,'萬')}
    ${row('殘廢/全殘',disability,500,'萬')}
  </div>
</div>

<div style="text-align:center;font-size:10px;color:#94a3b8;margin-top:12px">保寶險 AI 夥伴・保障更聰明 | 本報告僅供參考，實際保障依保單條款為準</div>
</body></html>`;
}

async function uploadToCloudinary(b64) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = crypto.createHash('sha1').update(`timestamp=${timestamp}${API_SECRET}`).digest('hex');
    const boundary = 'Boundary' + Date.now();
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\ndata:image/png;base64,${b64}`,
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
      res.on('end', () => { try { resolve(JSON.parse(d).secure_url); } catch(e) { reject(new Error(d)); } });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    const html = generateHTML(data);

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 620, height: 800 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForTimeout(500);

    const element = await page.$('body');
    const screenshot = await element.screenshot({ type: 'png' });
    await browser.close();

    const b64 = screenshot.toString('base64');
    const url = await uploadToCloudinary(b64);

    res.json({ url });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
