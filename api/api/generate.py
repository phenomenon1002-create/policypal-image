from PIL import Image, ImageDraw, ImageFont
import json
import base64
import hashlib
import time
import urllib.request
import io

CLOUD_NAME = 'dsicpafgz'
API_KEY = '989282614168298'
API_SECRET = 'hyP7yp3zKmfkj-g--cdQLTZr9iw'

FONT_REG  = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_MED  = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'

WHITE        = (255, 255, 255)
BG           = (244, 244, 244)
DARK         = (31,  41,  55)
GRAY         = (150, 150, 150)
PURPLE_GRAD  = (120,  60, 255)
PURPLE_END   = (160, 100, 255)
PURPLE       = (122,  44, 255)
PURPLE_LIGHT = (242, 232, 255)
PURPLE_MID   = (180, 140, 255)
BLUE         = (36,  99, 255)
BLUE_LIGHT   = (237, 240, 255)
BLUE_BORDER  = (76,  125, 255)
RED          = (255,  60,  60)
RED_LIGHT    = (255, 232, 232)
RED_BORDER   = (255, 123, 123)
ORANGE       = (255, 138,   0)
ORANGE_LIGHT = (255, 241, 223)
ORANGE_BORDER= (255, 179,  71)
GREEN        = (22,  163,  74)
GREEN_BG     = (220, 252, 231)
DARK_RED     = (185,  28,  28)
RED_BG       = (254, 226, 226)


def upload_to_cloudinary(img_bytes):
    timestamp = str(int(time.time()))
    sig_str = f"format=png&timestamp={timestamp}{API_SECRET}"
    signature = hashlib.sha1(sig_str.encode()).hexdigest()
    b64 = base64.b64encode(img_bytes).decode()
    data_uri = f"data:image/png;base64,{b64}"
    boundary = f"Boundary{int(time.time())}"
    parts = []
    def add_field(name, value):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}')
    add_field('file', data_uri); add_field('format', 'png')
    add_field('api_key', API_KEY); add_field('timestamp', timestamp)
    add_field('signature', signature); parts.append(f'--{boundary}--')
    body = '\r\n'.join(parts).encode('utf-8')
    req = urllib.request.Request(
        f'https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload', data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        url = result.get('secure_url', '')
        if url and not url.endswith('.png'):
            url = url.rsplit('.', 1)[0] + '.png'
        return url


def load_fonts():
    sizes = {'xs':22,'sm':26,'md':30,'lg':36,'xl':44,'xxl':56,'title':48}
    fonts = {}
    for name, sz in sizes.items():
        try:
            fonts[name]      = ImageFont.truetype(FONT_REG,  sz)
            fonts[name+'_m'] = ImageFont.truetype(FONT_MED,  sz)
            fonts[name+'_b'] = ImageFont.truetype(FONT_BOLD, sz)
        except Exception:
            fb = ImageFont.load_default()
            fonts[name] = fonts[name+'_m'] = fonts[name+'_b'] = fb
    return fonts


def rr(draw, xy, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)


def gradient_rect(img, x1, y1, x2, y2, c1, c2):
    draw = ImageDraw.Draw(img)
    steps = x2 - x1
    for i in range(steps):
        t = i / max(steps-1, 1)
        col = tuple(int(c1[k]+(c2[k]-c1[k])*t) for k in range(3))
        draw.line([(x1+i, y1),(x1+i, y2)], fill=col)


def score_pct(v, s):
    if s == 0: return 100
    return min(100, int(float(v)/float(s)*100))


def pill_tag(draw, fonts, cx, cy, val, std, unit, w=190, h=36):
    ok = float(val) >= float(std)
    bg = GREEN_BG if ok else RED_BG
    color = GREEN if ok else DARK_RED
    icon = '✓' if ok else '!'
    num = f"{int(float(val)):,}" if float(val)>0 else '0'
    text = f"{icon} {num} {unit}"
    x1, y1 = cx-w//2, cy-h//2
    rr(draw, [x1,y1,x1+w,y1+h], h//2, fill=bg)
    draw.text((cx, cy), text, font=fonts['xs_m'], fill=color, anchor='mm')


def pill_bool(draw, fonts, cx, cy, has, w=150, h=36):
    bg = GREEN_BG if has else RED_BG
    color = GREEN if has else DARK_RED
    text = '✓ 已投保' if has else '! 未投保'
    x1, y1 = cx-w//2, cy-h//2
    rr(draw, [x1,y1,x1+w,y1+h], h//2, fill=bg)
    draw.text((cx, cy), text, font=fonts['xs_m'], fill=color, anchor='mm')


def progress_bar(draw, x, y, w, pct, color, h=18):
    rr(draw, [x,y,x+w,y+h], h//2, fill=(225,225,230))
    bar_w = max(h, int(w*pct/100))
    rr(draw, [x,y,x+bar_w,y+h], h//2, fill=color)


def draw_card(img, fonts, x, y, w, h,
              title, subtitle,
              border_color, header_bg, title_color, sub_color, bar_color,
              rows, pct, pct_label):
    draw = ImageDraw.Draw(img)
    RADIUS, PAD, HEADER_H = 22, 22, 84
    # shadow
    rr(draw, [x+3,y+3,x+w+3,y+h+3], RADIUS, fill=(200,200,210))
    # card bg
    rr(draw, [x,y,x+w,y+h], RADIUS, fill=WHITE, outline=border_color, width=2)
    # header
    rr(draw, [x,y,x+w,y+HEADER_H], RADIUS, fill=header_bg)
    draw.rectangle([x,y+HEADER_H-RADIUS,x+w,y+HEADER_H], fill=header_bg)
    draw.text((x+PAD, y+HEADER_H//2-12), title,    font=fonts['lg_b'], fill=title_color, anchor='lm')
    draw.text((x+PAD, y+HEADER_H//2+22), subtitle, font=fonts['xs'],   fill=sub_color,   anchor='lm')
    draw.line([x+PAD, y+HEADER_H, x+w-PAD, y+HEADER_H], fill=(220,220,230), width=1)
    # rows
    ROW_H  = 50
    row_y0 = y+HEADER_H+26
    pill_cx = x+w-110
    for i, (label, pill_fn) in enumerate(rows):
        ry = row_y0 + i*ROW_H + ROW_H//2
        draw.text((x+PAD, ry), label, font=fonts['sm'], fill=DARK, anchor='lm')
        pill_fn(draw, fonts, pill_cx, ry)
    # progress
    bar_y = y+h-56
    draw.text((x+PAD, bar_y-4), f'{pct_label}　{pct}%',
              font=fonts['sm_m'], fill=bar_color, anchor='lm')
    progress_bar(draw, x+PAD, bar_y+22, w-PAD*2, pct, bar_color)


def draw_center_circle(img, fonts, cx, cy, R, life):
    # glow rings
    for i in range(5, 0, -1):
        al = Image.new('RGBA', img.size, (0,0,0,0))
        ad = ImageDraw.Draw(al)
        ad.ellipse([cx-R-i*7, cy-R-i*7, cx+R+i*7, cy+R+i*7], fill=(180,140,255,14))
        img = Image.alpha_composite(img.convert('RGBA'), al).convert('RGB')
    draw = ImageDraw.Draw(img)
    draw.ellipse([cx-R, cy-R, cx+R, cy+R], fill=WHITE, outline=PURPLE_MID, width=7)
    draw.text((cx, cy-52), '壽險保額',  font=fonts['md_m'], fill=PURPLE, anchor='mm')
    life_val = float(life)
    life_text  = f"{int(life_val)}萬" if life_val>0 else '未投保'
    life_color = GREEN if life_val>=500 else DARK_RED
    draw.text((cx, cy+4),  life_text,   font=fonts['xxl_b'], fill=life_color, anchor='mm')
    status = '✓ 保額充足' if life_val>=500 else '建議500萬以上'
    status_color = GREEN if life_val>=500 else DARK_RED
    draw.text((cx, cy+62), status, font=fonts['xs_m'], fill=status_color, anchor='mm')
    return img


def generate_image(data):
    name      = data.get('name', '')
    date_str  = data.get('date', '')
    daily     = float(data.get('daily',       0))
    surgery   = float(data.get('surgeryFixed',0))
    inpatient = float(data.get('inpatient',   0))
    fracture  = float(data.get('fracture',    0))
    accident  = float(data.get('accident',    0))
    acc_death = float(data.get('accDeath',    0))
    disability= float(data.get('disability',  0))
    critical  = float(data.get('critical',    0))
    cancer    = float(data.get('cancer',      0))
    ltc       = float(data.get('ltc',         0))
    chemo     = float(data.get('chemo',       0))
    cancer_hosp=float(data.get('cancerHosp', 0))
    life      = float(data.get('life',        0))

    fonts = load_fonts()

    W, H = 1080, 1640
    img = Image.new('RGB', (W, H), BG)
    gradient_rect(img, 0, 0, W, 120, PURPLE_GRAD, PURPLE_END)
    draw = ImageDraw.Draw(img)
    draw.text((W//2, 60), '保單健診分析報告', font=fonts['title_b'], fill=WHITE, anchor='mm')

    PAD        = 20
    GAP        = 18
    R_CIRCLE   = 90           # center circle radius
    INNER_GAP  = R_CIRCLE + 10  # horizontal clearance either side of centre
    CW         = W//2 - PAD - INNER_GAP  # card width
    GRID_Y     = 120 + PAD
    TOP_CARD_H = 420
    BOT_CARD_H = 520
    LX = PAD
    RX = W - PAD - CW
    BOT_Y = GRID_Y + TOP_CARD_H + GAP

    # scores
    sc = score_pct
    tl_pct = int(sc(daily,3000)*0.4   + sc(surgery,50000)*0.3  + sc(inpatient,100000)*0.3)
    tr_pct = int(sc(accident,10000)*0.4+ sc(fracture,30000)*0.3 + (100 if daily>0 else 0)*0.3)
    bl_pct = int(sc(critical,100)*0.2  + sc(cancer,100)*0.2    + sc(ltc,30000)*0.2
                 + sc(chemo,1)*0.15    + sc(cancer_hosp,3000)*0.15 + 10)
    br_pct = int(sc(acc_death,500)*0.4 + sc(disability,500)*0.4+ (100 if disability>0 else 0)*0.2)

    # draw 4 cards
    draw_card(img, fonts, LX, GRID_Y, CW, TOP_CARD_H,
        '小疾病保障','住院相關保障',
        BLUE_BORDER,BLUE_LIGHT,BLUE,(147,197,253),BLUE,
        [('住院日額', lambda d,f,cx,cy: pill_tag(d,f,cx,cy,daily,   3000,'元/天')),
         ('手術（實支實付）',       lambda d,f,cx,cy: pill_tag(d,f,cx,cy,surgery, 50000,'元'  )),
         ('手術（定額）',       lambda d,f,cx,cy: pill_tag(d,f,cx,cy,surgery, 50000,'元'  )),
         ('雜費',                   lambda d,f,cx,cy: pill_tag(d,f,cx,cy,inpatient,100000,'元'))],
        tl_pct,'保障充足度')

    draw_card(img, fonts, RX, GRID_Y, CW, TOP_CARD_H,
        '小意外保障','意外相關保障',
        RED_BORDER,RED_LIGHT,RED,(255,164,164),RED,
        [('意外門診',     lambda d,f,cx,cy: pill_tag(d,f,cx,cy,accident,10000,'元')),
         ('骨折未住院',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy,fracture,30000,'元')),
         ('意外住院日額', lambda d,f,cx,cy: pill_bool(d,f,cx,cy,daily>0))],
        tr_pct,'保障充足度')

    draw_card(img, fonts, LX, BOT_Y, CW, BOT_CARD_H,
        '大疾病保障','重大疾病保障',
        PURPLE_MID,PURPLE_LIGHT,PURPLE,PURPLE_MID,PURPLE,
        [('重大傷病',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy,critical,   100,'萬'   )),
         ('重大疾病',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy,critical,   100,'萬'   )),
         ('癌症一次金', lambda d,f,cx,cy: pill_tag(d,f,cx,cy,cancer,     100,'萬'   )),
         ('化療/放療',  lambda d,f,cx,cy: pill_tag(d,f,cx,cy,chemo,        1,'萬'   )),
         ('癌症住院',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy,cancer_hosp,3000,'元/日')),
         ('長照月給付', lambda d,f,cx,cy: pill_tag(d,f,cx,cy,ltc,      30000,'元/月'))],
        bl_pct,'保障充足度')

    draw_card(img, fonts, RX, BOT_Y, CW, BOT_CARD_H,
        '大意外保障','意外相關保障',
        ORANGE_BORDER,ORANGE_LIGHT,ORANGE,(255,186,100),ORANGE,
        [('意外身故',       lambda d,f,cx,cy: pill_tag(d,f,cx,cy,acc_death, 500,'萬')),
         ('殘廢（1-11級）', lambda d,f,cx,cy: pill_tag(d,f,cx,cy,disability,500,'萬')),
         ('全殘',           lambda d,f,cx,cy: pill_tag(d,f,cx,cy,disability,500,'萬'))],
        br_pct,'保障充足度')

    # center circle — drawn LAST so it's on top of cards
    CX_C = W // 2
    CY_C = GRID_Y + TOP_CARD_H + GAP // 2   # sits in the gap between rows
    img = draw_center_circle(img, fonts, CX_C, CY_C, R_CIRCLE, life)

    # suggestions
    draw = ImageDraw.Draw(img)
    SUG_Y = BOT_Y + BOT_CARD_H + GAP
    SUG_H = 200
    rr(draw, [PAD, SUG_Y, W-PAD, SUG_Y+SUG_H], 22,
       fill=WHITE, outline=PURPLE_MID, width=2)
    draw.text((PAD+20, SUG_Y+28), '醫療保障建議', font=fonts['lg_b'], fill=PURPLE, anchor='lm')

    issues = []
    if daily    < 3000:  issues.append(('🛡','住院日額不足','建議加強實支或定額保障'))
    if critical < 100:   issues.append(('＋','重大疾病保額','建議提升至100萬以上'))
    if ltc      < 30000: issues.append(('✓','長照保障缺口','建議規劃月給付3萬以上'))
    if not issues:       issues = [('✓','整體保障良好','建議每年定期複檢')]

    N = min(3, len(issues))
    col_w = (W - PAD*2 - GAP*(N-1)) // N
    for i, (icon, title_s, body_s) in enumerate(issues[:3]):
        sx = PAD + i*(col_w+GAP)
        sy = SUG_Y + 68
        sh = SUG_H - 80
        rr(draw, [sx, sy, sx+col_w, sy+sh], 14, fill=PURPLE_LIGHT)
        draw.text((sx+16, sy+sh//2-14), icon,    font=fonts['md'],   fill=PURPLE, anchor='lm')
        draw.text((sx+58, sy+sh//2-14), title_s, font=fonts['sm_b'], fill=PURPLE, anchor='lm')
        draw.text((sx+58, sy+sh//2+16), body_s,  font=fonts['xs'],   fill=DARK,   anchor='lm')

    # footer
    FT_Y = SUG_Y + SUG_H + GAP
    draw.line([PAD, FT_Y, W-PAD, FT_Y], fill=(220,220,230), width=1)
    ft_text_y = FT_Y + 28
    draw.text((PAD+4,  ft_text_y), f'受檢人：{name}　　檢測日期：{date_str}',
              font=fonts['sm'], fill=DARK, anchor='lm')
    draw.text((W-PAD-4, ft_text_y), 'PolicyPal 保單夥伴',
              font=fonts['sm_m'], fill=PURPLE, anchor='rm')
    draw.text((W//2, ft_text_y+36), '本分析僅供參考・實際保障內容以保單條款為準',
              font=fonts['xs'], fill=GRAY, anchor='mm')

    buf = io.BytesIO()
    img.save(buf, format='PNG', dpi=(144,144))
    return buf.getvalue()


def handler(request):
    if request.method == 'OPTIONS':
        return {'statusCode':200,'headers':{'Access-Control-Allow-Origin':'*',
            'Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'},'body':''}
    if request.method != 'POST':
        return {'statusCode':405,'body':json.dumps({'error':'Method not allowed'})}
    try:
        data = json.loads(request.body)
        img_bytes = generate_image(data)
        url = upload_to_cloudinary(img_bytes)
        return {'statusCode':200,'headers':{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
                'body':json.dumps({'url':url})}
    except Exception as e:
        import traceback
        return {'statusCode':500,'headers':{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},
                'body':json.dumps({'error':str(e),'trace':traceback.format_exc()})}


if __name__ == '__main__':
    test_data = {
        'name':'王小明','date':'2025-05-25',
        'daily':2000,'surgeryFixed':30000,'inpatient':80000,
        'fracture':20000,'accident':8000,'accDeath':300,'disability':200,
        'critical':80,'cancer':60,'ltc':20000,'chemo':0,'cancerHosp':0,'life':400,
    }
    img_bytes = generate_image(test_data)
    with open('/mnt/user-data/outputs/preview.png','wb') as f:
        f.write(img_bytes)
    print('saved')
