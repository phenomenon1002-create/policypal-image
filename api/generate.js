import json, base64, hashlib, time, urllib.request, io
from PIL import Image, ImageDraw, ImageFont

FONT_REG  = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
FONT_MED  = '/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc'
FONT_BOLD = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'

WHITE        = (255, 255, 255)
BG           = (248, 249, 250)
DARK         = (33,  37,  41)
GRAY         = (108, 117, 125)
PURPLE_GRAD  = (82,  51,  168)
PURPLE_END   = (122, 79,  240)
PURPLE       = (106, 44,  255)
PURPLE_LIGHT = (243, 230, 255)
PURPLE_MID   = (187, 153, 255)
BLUE         = (26,  92,  255)
BLUE_LIGHT   = (240, 244, 255)
BLUE_BORDER  = (143, 175, 255)
RED          = (227, 38,  38)
RED_LIGHT    = (255, 235, 235)
RED_BORDER   = (255, 143, 143)
ORANGE       = (230, 115,   0)
ORANGE_LIGHT = (255, 244, 230)
ORANGE_BORDER= (255, 184, 102)
GREEN        = (22,  140,  60)
GREEN_BG     = (225, 245, 230)
DARK_RED     = (185,  28,  28)
RED_BG       = (254, 226, 226)

def load_fonts():
    sizes = {'xs':22,'sm':26,'md':30,'lg':36,'xxl':52,'title':48}
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

def pill_tag(draw, fonts, cx, cy, val, std, unit, w=185, h=38):
    ok = float(val) >= float(std)
    bg    = GREEN_BG if ok else RED_BG
    color = GREEN    if ok else DARK_RED
    icon  = '✓' if ok else '!'
    num   = f"{int(float(val)):,}" if float(val) > 0 else '0'
    text  = f"{icon} {num} {unit}"
    x1, y1 = cx-w//2, cy-h//2
    rr(draw, [x1,y1,x1+w,y1+h], h//2, fill=bg)
    draw.text((cx, cy), text, font=fonts['xs_m'], fill=color, anchor='mm')

def pill_bool(draw, fonts, cx, cy, has, w=185, h=38):
    bg    = GREEN_BG if has else RED_BG
    color = GREEN    if has else DARK_RED
    text  = '✓ 已投保' if has else '! 未投保'
    x1, y1 = cx-w//2, cy-h//2
    rr(draw, [x1,y1,x1+w,y1+h], h//2, fill=bg)
    draw.text((cx, cy), text, font=fonts['xs_m'], fill=color, anchor='mm')

def progress_bar(draw, x, y, w, pct, color, h=14):
    rr(draw, [x,y,x+w,y+h], h//2, fill=(235,235,240))
    if pct > 0:
        bar_w = max(h, int(w*pct/100))
        rr(draw, [x,y,x+bar_w,y+h], h//2, fill=color)

def draw_card(img, fonts, x, y, w, h,
              title, subtitle,
              border_color, header_bg, title_color, sub_color, bar_color,
              rows, pct, pct_label):
    draw = ImageDraw.Draw(img)
    RADIUS, PAD, HEADER_H = 22, 22, 84
    rr(draw, [x+2,y+3,x+w+2,y+h+3], RADIUS, fill=(218,218,226))
    rr(draw, [x,y,x+w,y+h], RADIUS, fill=WHITE, outline=border_color, width=2)
    rr(draw, [x,y,x+w,y+HEADER_H], RADIUS, fill=header_bg)
    draw.rectangle([x, y+HEADER_H-RADIUS, x+w, y+HEADER_H], fill=header_bg)
    draw.text((x+PAD, y+HEADER_H//2-12), title,    font=fonts['lg_b'], fill=title_color, anchor='lm')
    draw.text((x+PAD, y+HEADER_H//2+22), subtitle, font=fonts['xs'],   fill=sub_color,   anchor='lm')
    draw.line([x+PAD, y+HEADER_H, x+w-PAD, y+HEADER_H], fill=(225,225,235), width=1)
    ROW_H  = 54
    row_y0 = y + HEADER_H + 18
    pill_cx = x + w - 108
    for i, (label, pill_fn) in enumerate(rows):
        ry = row_y0 + i*ROW_H + ROW_H//2
        draw.text((x+PAD, ry), label, font=fonts['sm_m'], fill=DARK, anchor='lm')
        pill_fn(draw, fonts, pill_cx, ry)
    bar_y = y + h - 58
    draw.text((x+PAD, bar_y-6), f'{pct_label} {pct}%', font=fonts['sm_b'], fill=bar_color, anchor='lm')
    progress_bar(draw, x+PAD, bar_y+20, w-PAD*2, pct, bar_color)

def draw_center_circle(img, fonts, cx, cy, R, life):
    overlay = Image.new('RGBA', img.size, (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    for i in range(5, 0, -1):
        od.ellipse([cx-R-i*7, cy-R-i*7, cx+R+i*7, cy+R+i*7], fill=(138,92,246, 12))
    od.ellipse([cx-R, cy-R, cx+R, cy+R], fill=(255,255,255,255), outline=(167,139,250,255), width=7)
    od.text((cx, cy-48), '壽險保額', font=fonts['md_b'], fill=PURPLE, anchor='mm')
    life_val  = float(life)
    life_text = f"{int(life_val)}萬" if life_val > 0 else '未投保'
    life_color= GREEN if life_val >= 500 else DARK_RED
    od.text((cx, cy+8),  life_text, font=fonts['xxl_b'], fill=life_color, anchor='mm')
    status = '✓ 保額充足' if life_val >= 500 else '建議500萬以上'
    s_color= GREEN if life_val >= 500 else ORANGE
    od.text((cx, cy+62), status, font=fonts['xs_m'], fill=s_color, anchor='mm')
    return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')

def generate_image(data):
    name       = data.get('name', '')
    date_str   = data.get('date', '')
    daily      = float(data.get('daily',        0))
    surgery    = float(data.get('surgeryFixed', 0))
    inpatient  = float(data.get('inpatient',    0))
    fracture   = float(data.get('fracture',     0))
    accident   = float(data.get('accident',     0))
    acc_death  = float(data.get('accDeath',     0))
    disability = float(data.get('disability',   0))
    critical   = float(data.get('critical',     0))
    cancer     = float(data.get('cancer',       0))
    ltc        = float(data.get('ltc',          0))
    chemo      = float(data.get('chemo',        0))
    cancer_hosp= float(data.get('cancerHosp',   0))
    life       = float(data.get('life',         0))

    fonts = load_fonts()

    W, H   = 1080, 1780
    PAD    = 30
    GAP    = 18
    R_CIRC = 108          # 圓圈半徑

    # ── 關鍵：卡片寬度必須讓兩張卡之間有足夠空隙容納圓圈 ──
    # 兩張卡左右各留 PAD，中間兩側各退 R_CIRC+16
    CW = (W // 2) - PAD - (R_CIRC + 16)   # = 540 - 30 - 124 = 386

    GRID_Y     = 160
    TOP_CARD_H = 390
    BOT_CARD_H = 510
    LX = PAD
    RX = W - PAD - CW                     # 右卡靠右對齊
    BOT_Y = GRID_Y + TOP_CARD_H + GAP

    img = Image.new('RGB', (W, H), BG)
    gradient_rect(img, 0, 0, W, 140, PURPLE_GRAD, PURPLE_END)
    draw = ImageDraw.Draw(img)
    draw.text((W//2, 70), '保單健診分析報告', font=fonts['title_b'], fill=WHITE, anchor='mm')

    sc = score_pct
    tl_pct = int(sc(daily,3000)*0.4    + sc(surgery,50000)*0.3   + sc(inpatient,100000)*0.3)
    tr_pct = int(sc(accident,10000)*0.4 + sc(fracture,30000)*0.3  + (100 if daily>0 else 0)*0.3)
    bl_pct = int(sc(critical,100)*0.2   + sc(cancer,100)*0.2     + sc(ltc,30000)*0.2
                 + sc(chemo,1)*0.2      + sc(cancer_hosp,3000)*0.2)
    br_pct = int(sc(acc_death,500)*0.4  + sc(disability,500)*0.4  + (100 if disability>0 else 0)*0.2)

    draw_card(img, fonts, LX, GRID_Y, CW, TOP_CARD_H,
        '小疾病保障', '住院相關醫療',
        BLUE_BORDER, BLUE_LIGHT, BLUE, GRAY, BLUE,
        [('住院日額', lambda d,f,cx,cy: pill_tag(d,f,cx,cy, daily,    3000, '元')),
         ('手術實支', lambda d,f,cx,cy: pill_tag(d,f,cx,cy, surgery,  50000,'元')),
         ('醫療雜費', lambda d,f,cx,cy: pill_tag(d,f,cx,cy, inpatient,100000,'元'))],
        tl_pct, '保障充足度')

    draw_card(img, fonts, RX, GRID_Y, CW, TOP_CARD_H,
        '小意外保障', '常規意外傷害',
        RED_BORDER, RED_LIGHT, RED, GRAY, RED,
        [('意外門診',   lambda d,f,cx,cy: pill_tag( d,f,cx,cy, accident,10000,'元')),
         ('骨折未住院', lambda d,f,cx,cy: pill_tag( d,f,cx,cy, fracture,30000,'元')),
         ('意外住院',   lambda d,f,cx,cy: pill_bool(d,f,cx,cy, daily>0))],
        tr_pct, '保障充足度')

    draw_card(img, fonts, LX, BOT_Y, CW, BOT_CARD_H,
        '大疾病保障', '重大惡性疾病',
        PURPLE_MID, PURPLE_LIGHT, PURPLE, GRAY, PURPLE,
        [('重大傷病',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy, critical,    100, '萬')),
         ('重大疾病',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy, critical,    100, '萬')),
         ('癌症一次金', lambda d,f,cx,cy: pill_tag(d,f,cx,cy, cancer,      100, '萬')),
         ('癌症住院',   lambda d,f,cx,cy: pill_tag(d,f,cx,cy, cancer_hosp, 3000,'元')),
         ('長照月給付', lambda d,f,cx,cy: pill_tag(d,f,cx,cy, ltc,         30000,'元'))],
        bl_pct, '保障充足度')

    draw_card(img, fonts, RX, BOT_Y, CW, BOT_CARD_H,
        '大意外保障', '惡性意外失能',
        ORANGE_BORDER, ORANGE_LIGHT, ORANGE, GRAY, ORANGE,
        [('意外身故',      lambda d,f,cx,cy: pill_tag(d,f,cx,cy, acc_death, 500,'萬')),
         ('失能 1-11 級',  lambda d,f,cx,cy: pill_tag(d,f,cx,cy, disability,500,'萬')),
         ('全殘保障',      lambda d,f,cx,cy: pill_tag(d,f,cx,cy, disability,500,'萬'))],
        br_pct, '保障充足度')

    # 圓圈畫在最後，壓在卡片上方（中間空隙內）
    CX_C = W // 2
    CY_C = GRID_Y + TOP_CARD_H + GAP // 2
    img = draw_center_circle(img, fonts, CX_C, CY_C, R_CIRC, life)

    # 建議區（純文字，不用 emoji 避免亂碼）
    draw = ImageDraw.Draw(img)
    SUG_Y = BOT_Y + BOT_CARD_H + 30
    SUG_H = 230
    rr(draw, [PAD, SUG_Y, W-PAD, SUG_Y+SUG_H], 22, fill=WHITE, outline=PURPLE_MID, width=2)
    draw.text((PAD+28, SUG_Y+32), '醫療保障缺口核心建議', font=fonts['md_b'], fill=PURPLE, anchor='lm')
    draw.line([PAD+28, SUG_Y+68, W-PAD-28, SUG_Y+68], fill=(225,225,235), width=1)

    issues = []
    if daily    < 3000:  issues.append('▶ 住院日額防線脆弱｜當前額度難填自費病房差額，建議規劃實支實付醫療險')
    if critical < 100:   issues.append('▶ 重大傷病保障真空｜惡性疾病療程動輒百萬，建議拉高重大傷病一次金')
    if ltc      < 30000: issues.append('▶ 長照月給付不足｜失能照護是家庭隱形黑洞，建議補充月給付3萬以上')
    if not issues:       issues = ['▶ 整體保障防禦完備｜四大帳戶規劃健全，建議每兩年視家庭責任微調']

    for i, text in enumerate(issues[:3]):
        draw.text((PAD+28, SUG_Y + 90 + i*46), text, font=fonts['sm_m'], fill=DARK, anchor='lm')

    # Footer
    FT_Y = SUG_Y + SUG_H + 36
    draw.line([PAD, FT_Y, W-PAD, FT_Y], fill=(220,220,232), width=1)
    draw.text((PAD,   FT_Y+34), f'受檢人：{name}     檢測日期：{date_str}', font=fonts['sm'], fill=DARK, anchor='lm')
    draw.text((W-PAD, FT_Y+34), 'PolicyPal 保單夥伴', font=fonts['sm_b'], fill=PURPLE, anchor='rm')
    draw.text((W//2,  FT_Y+76), '本分析報告僅供參考・實際保險權益及理賠規範悉以各壽產險公司保單條款為準',
              font=fonts['xs'], fill=GRAY, anchor='mm')

    buf = io.BytesIO()
    img.save(buf, format='PNG', dpi=(144,144))
    return buf.getvalue()

if __name__ == '__main__':
    test_data = {
        'name':'王小明','date':'2026-05-25',
        'daily':2000,'surgeryFixed':30000,'inpatient':80000,
        'fracture':20000,'accident':8000,'accDeath':300,'disability':200,
        'critical':80,'cancer':60,'ltc':20000,'chemo':0,'cancerHosp':0,'life':400,
    }
    img_bytes = generate_image(test_data)
    with open('/mnt/user-data/outputs/preview_v3.png','wb') as f:
        f.write(img_bytes)
    print('done')
