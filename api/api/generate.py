from PIL import Image, ImageDraw, ImageFont
import json
import base64
import hashlib
import hmac
import time
import urllib.request
import urllib.parse
import io
import os

CLOUD_NAME = 'dsicpafgz'
API_KEY = '989282614168298'
API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw'

def upload_to_cloudinary(img_bytes):
    timestamp = str(int(time.time()))
    sig_str = f"format=png&timestamp={timestamp}{API_SECRET}"
    signature = hashlib.sha1(sig_str.encode()).hexdigest()
    
    b64 = base64.b64encode(img_bytes).decode()
    data_uri = f"data:image/png;base64,{b64}"
    
    import urllib.request
    import urllib.parse
    
    boundary = f"Boundary{int(time.time())}"
    parts = []
    
    def add_field(name, value):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}')
    
    add_field('file', data_uri)
    add_field('format', 'png')
    add_field('api_key', API_KEY)
    add_field('timestamp', timestamp)
    add_field('signature', signature)
    parts.append(f'--{boundary}--')
    
    body = '\r\n'.join(parts).encode('utf-8')
    
    req = urllib.request.Request(
        f'https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        url = result.get('secure_url', '')
        if url and not url.endswith('.png'):
            url = url.rsplit('.', 1)[0] + '.png'
        return url

def score_pct(v, s):
    v, s = float(v), float(s)
    if s == 0: return 100
    pct = min(100, int(v / s * 100))
    return pct

def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def generate_image(data):
    name = data.get('name', '')
    daily = float(data.get('daily', 0))
    surgery = float(data.get('surgeryFixed', 0))
    inpatient = float(data.get('inpatient', 0))
    fracture = float(data.get('fracture', 0))
    accident = float(data.get('accident', 0))
    acc_death = float(data.get('accDeath', 0))
    disability = float(data.get('disability', 0))
    critical = float(data.get('critical', 0))
    cancer = float(data.get('cancer', 0))
    ltc = float(data.get('ltc', 0))
    life = float(data.get('life', 0))

    # Colors
    BG = (245, 243, 255)
    WHITE = (255, 255, 255)
    BLUE = (29, 78, 216)
    BLUE_LIGHT = (239, 246, 255)
    BLUE_MID = (191, 219, 254)
    RED = (190, 18, 60)
    RED_LIGHT = (255, 241, 242)
    RED_MID = (253, 164, 175)
    PURPLE = (109, 40, 217)
    PURPLE_LIGHT = (245, 243, 255)
    PURPLE_MID = (196, 181, 253)
    ORANGE = (194, 65, 12)
    ORANGE_LIGHT = (255, 247, 237)
    ORANGE_MID = (253, 186, 116)
    GREEN = (20, 83, 45)
    GREEN_BG = (187, 247, 208)
    DARK_RED = (185, 28, 28)
    RED_BG = (254, 202, 202)
    GRAY = (156, 163, 175)
    DARK = (31, 41, 55)
    TITLE_BG = (124, 58, 237)

    W, H = 1600, 1750
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Try to load font
    try:
        font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
        font_bold_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
        f_sm = ImageFont.truetype(font_path, 28)
        f_md = ImageFont.truetype(font_path, 34)
        f_lg = ImageFont.truetype(font_bold_path, 44)
        f_xl = ImageFont.truetype(font_bold_path, 60)
        f_xxl = ImageFont.truetype(font_bold_path, 80)
        f_title = ImageFont.truetype(font_bold_path, 52)
        f_xs = ImageFont.truetype(font_path, 22)
    except:
        f_sm = f_md = f_lg = f_xl = f_xxl = f_title = f_xs = ImageFont.load_default()

    # Header
    draw_rounded_rect(draw, [0, 0, W, 110], 0, fill=TITLE_BG)
    draw.text((W//2, 55), '保單健診分析報告', font=f_title, fill=WHITE, anchor='mm')

    # Layout
    CX, CY = 800, 830
    R = 200
    G = 12
    TLW = CX - R - G
    TRW = W - CX - R - G
    TOP_H = CY - R - G - 110
    BOT_H = H - CY - R - G - 120

    def score_color(pct):
        if pct >= 80: return GREEN, GREEN_BG
        if pct >= 50: return ORANGE, ORANGE_LIGHT
        return DARK_RED, RED_BG

    def pill(draw, cx, cy, val, std, unit, w=220, h=36):
        pct = score_pct(val, std)
        isOk = val >= std
        bg = GREEN_BG if isOk else RED_BG
        color = GREEN if isOk else DARK_RED
        icon = '✓' if isOk else '!'
        text = f"{icon} {int(val):,} {unit}"
        x1, y1 = cx - w//2, cy - h//2
        draw_rounded_rect(draw, [x1, y1, x1+w, y1+h], h//2, fill=bg)
        draw.text((cx, cy), text, font=f_xs, fill=color, anchor='mm')

    def pill_bool(draw, cx, cy, has, w=180, h=36):
        bg = GREEN_BG if has else RED_BG
        color = GREEN if has else DARK_RED
        text = '✓ 已投保' if has else '! 未投保'
        x1, y1 = cx - w//2, cy - h//2
        draw_rounded_rect(draw, [x1, y1, x1+w, y1+h], h//2, fill=bg)
        draw.text((cx, cy), text, font=f_xs, fill=color, anchor='mm')

    def progress_bar(draw, x, y, w, pct, color):
        draw_rounded_rect(draw, [x, y, x+w, y+14], 7, fill=(229, 231, 235))
        bar_w = max(14, int(w * pct / 100))
        draw_rounded_rect(draw, [x, y, x+bar_w, y+14], 7, fill=color)

    def draw_card(x, y, w, h, header_bg, border_color, icon_bg, icon_char, icon_color, title, title_color, subtitle, sub_color, rows, pct, pct_label):
        # Card background
        draw_rounded_rect(draw, [x, y, x+w, y+h], 24, fill=WHITE, outline=border_color, width=2)
        # Header
        draw_rounded_rect(draw, [x, y, x+w, y+100], 24, fill=header_bg)
        draw.rectangle([x, y+76, x+w, y+100], fill=header_bg)
        # Icon
        draw_rounded_rect(draw, [x+16, y+16, x+76, y+76], 14, fill=icon_bg)
        draw.text((x+46, y+46), icon_char, font=f_lg, fill=icon_color, anchor='mm')
        # Title
        draw.text((x+94, y+46), title, font=f_lg, fill=title_color, anchor='lm')
        draw.text((x+94, y+76), subtitle, font=f_xs, fill=sub_color, anchor='lm')
        # Separator
        draw.line([x+16, y+100, x+w-16, y+100], fill=(229,231,235), width=2)
        # Rows
        for i, (label, func) in enumerate(rows):
            ry = y + 140 + i * 54
            draw.text((x+20, ry), label, font=f_sm, fill=DARK, anchor='lm')
            func(x+w-130, ry)
        # Progress
        bar_y = y + h - 52
        bar_color = pct[1]
        draw.text((x+16, bar_y - 2), pct_label, font=f_xs, fill=pct[0], anchor='lm')
        progress_bar(draw, x+16, bar_y+22, w-32, pct[2], bar_color)

    # Scores
    tl_pct = int((score_pct(daily,3000)*0.4 + score_pct(surgery,50000)*0.3 + score_pct(inpatient,100000)*0.3))
    tr_pct = int((score_pct(accident,10000)*0.4 + score_pct(fracture,30000)*0.3 + (100 if daily>0 else 0)*0.3))
    bl_pct = int((score_pct(critical,100)*0.25 + score_pct(cancer,100)*0.25 + score_pct(ltc,30000)*0.25 + 25))
    br_pct = int((score_pct(acc_death,500)*0.4 + score_pct(disability,500)*0.4 + (100 if disability>0 else 0)*0.2))
    total_score = int((tl_pct*0.3 + tr_pct*0.2 + bl_pct*0.3 + br_pct*0.2))

    sc_tl = score_color(tl_pct)
    sc_tr = score_color(tr_pct)
    sc_bl = score_color(bl_pct)
    sc_br = score_color(br_pct)

    pill_cx_tl = TLW - 130
    pill_cx_tr = CX + R + G + TRW - 130

    # TL Card
    draw_card(
        0, 110, TLW, TOP_H,
        BLUE_LIGHT, BLUE_MID, (219,234,254), '＋', BLUE,
        '小疾病保障', BLUE, '住院相關保障', (147,197,253),
        [
            ('住院日額（實支+定額）', lambda cx,cy: pill(draw,cx,cy,daily,3000,'元/天')),
            ('手術（實支實付）', lambda cx,cy: pill(draw,cx,cy,surgery,50000,'元')),
            ('手術（定額手術）', lambda cx,cy: pill(draw,cx,cy,surgery,50000,'元')),
            ('雜費', lambda cx,cy: pill(draw,cx,cy,inpatient,100000,'元')),
        ],
        (sc_tl[0], sc_tl[1], tl_pct),
        f'保障充足度 {tl_pct}%'
    )

    # TR Card
    draw_card(
        CX+R+G, 110, TRW, TOP_H,
        RED_LIGHT, RED_MID, (255,228,230), '＋', RED,
        '小意外保障', RED, '意外相關保障', (253,164,175),
        [
            ('意外門診', lambda cx,cy: pill(draw,cx,cy,accident,10000,'元')),
            ('骨折未住院', lambda cx,cy: pill(draw,cx,cy,fracture,30000,'元')),
            ('意外住院日額', lambda cx,cy: pill_bool(draw,cx,cy,daily>0)),
        ],
        (sc_tr[0], sc_tr[1], tr_pct),
        f'保障充足度 {tr_pct}%'
    )

    # BL Card
    draw_card(
        0, CY+R+G, TLW, BOT_H,
        PURPLE_LIGHT, PURPLE_MID, (237,233,254), '癌', PURPLE,
        '大疾病保障', PURPLE, '重大疾病保障', (196,181,253),
        [
            ('重大傷病', lambda cx,cy: pill(draw,cx,cy,critical,100,'萬')),
            ('重大疾病', lambda cx,cy: pill(draw,cx,cy,critical,100,'萬')),
            ('癌症一次金', lambda cx,cy: pill(draw,cx,cy,cancer,100,'萬')),
            ('化療/放療', lambda cx,cy: pill(draw,cx,cy,0,1,'萬')),
            ('癌症住院', lambda cx,cy: pill(draw,cx,cy,0,3000,'元/日')),
            ('長照月給付', lambda cx,cy: pill(draw,cx,cy,ltc,30000,'元/月')),
        ],
        (sc_bl[0], sc_bl[1], bl_pct),
        f'保障充足度 {bl_pct}%'
    )

    # BR Card
    draw_card(
        CX+R+G, CY+R+G, TRW, BOT_H,
        ORANGE_LIGHT, ORANGE_MID, (255,237,213), '⚡', ORANGE,
        '大意外保障', ORANGE, '意外相關保障', (253,186,116),
        [
            ('意外身故', lambda cx,cy: pill(draw,cx,cy,acc_death,500,'萬')),
            ('殘廢（1-11級）', lambda cx,cy: pill(draw,cx,cy,disability,500,'萬')),
            ('全殘', lambda cx,cy: pill(draw,cx,cy,disability,500,'萬')),
        ],
        (sc_br[0], sc_br[1], br_pct),
        f'保障充足度 {br_pct}%'
    )

    # Center circle
    circle_img = Image.new('RGBA', (W, H), (0,0,0,0))
    circle_draw = ImageDraw.Draw(circle_img)
    circle_draw.ellipse([CX-R-20, CY-R-20, CX+R+20, CY+R+20], fill=(220,200,255,80))
    circle_draw.ellipse([CX-R-8, CY-R-8, CX+R+8, CY+R+8], fill=(255,255,255,255), outline=(139,92,246), width=12)
    img = Image.alpha_composite(img.convert('RGBA'), circle_img).convert('RGB')
    draw = ImageDraw.Draw(img)

    # Center circle - 壽險保額
    draw.text((CX, CY-80), '壽險保額', font=f_lg, fill=PURPLE, anchor='mm')
    life_text = f"{int(life)}萬" if life > 0 else '未投保'
    life_color = GREEN if life >= 500 else DARK_RED
    draw.text((CX, CY), life_text, font=f_xxl, fill=life_color, anchor='mm')
    status = '✓ 保額充足' if life >= 500 else '建議500萬以上'
    status_color = GREEN if life >= 500 else DARK_RED
    draw.text((CX, CY+80), status, font=f_md, fill=status_color, anchor='mm')

    # Suggestions section
    issues = []
    if accident < 10000: issues.append('建議加強小意外\n門診保障額度')
    if critical < 100 and cancer < 100: issues.append('可考慮提升重大\n疾病保障額度')
    if ltc < 30000: issues.append('建議規劃長照\n月給付保障')
    if not issues:
        issues = ['整體保障良好，\n持續定期檢視']

    sug_y = H - 200
    draw_rounded_rect(draw, [16, sug_y, W-16, H-60], 20, fill=WHITE, outline=PURPLE_MID, width=2)
    draw.text((36, sug_y+20), '醫療保障建議', font=f_md, fill=PURPLE, anchor='lm')

    col_w = (W - 32) // max(len(issues), 1)
    icons = ['🛡', '＋', '✓']
    for i, tip in enumerate(issues[:3]):
        sx = 32 + i * col_w + col_w//2
        sy = sug_y + 65
        draw_rounded_rect(draw, [sx-col_w//2+10, sug_y+44, sx+col_w//2-10, H-76], 14, fill=PURPLE_LIGHT)
        draw.text((sx-col_w//2+26, sy+2), icons[i % len(icons)], font=f_md, fill=PURPLE, anchor='lm')
        for j, line in enumerate(tip.split('\n')):
            draw.text((sx, sy+10+j*32), line, font=f_xs, fill=DARK, anchor='mm')

    draw.text((W//2, H-30), f'本分析僅供參考・實際保障內容以保單條款為準', font=f_xs, fill=GRAY, anchor='mm')

    buf = io.BytesIO()
    img.save(buf, format='PNG', dpi=(144,144))
    return buf.getvalue()

def handler(request):
    if request.method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}
    
    if request.method != 'POST':
        return {'statusCode': 405, 'body': json.dumps({'error': 'Method not allowed'})}
    
    try:
        data = json.loads(request.body)
        img_bytes = generate_image(data)
        url = upload_to_cloudinary(img_bytes)
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'url': url})
        }
    except Exception as e:
        import traceback
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e), 'trace': traceback.format_exc()})
        }
