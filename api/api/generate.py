From PIL import Image, ImageDraw, ImageFont
WIDTH = 1080
HEIGHT = 1920
img = Image.new("RGB", (WIDTH, HEIGHT), "#f5f5f5")
draw = ImageDraw.Draw(img)
# ===== Header =====
draw.rounded_rectangle(
    [(0,0),(1080,160)],
    radius=0,
    fill="#6C3BFF"
)
title_font = ImageFont.truetype("arial.ttf", 58)
draw.text(
    (540,50),
    "保單健診分析報告",
    fill="white",
    font=title_font,
    anchor="mm"
)
# ===== Cards =====
def draw_card(x,y,w,h,color,title):
    draw.rounded_rectangle(
        [(x,y),(x+w,y+h)],
        radius=30,
        outline=color,
        width=4,
        fill="white"
    )
    font = ImageFont.truetype("arial.ttf", 42)
    draw.text(
        (x+40,y+40),
        title,
        fill=color,
        font=font
    )
# 左上
draw_card(
    30,
    220,
    480,
    620,
    "#2D6BFF",
    "小疾病保障"
)
# 右上
draw_card(
    570,
    220,
    480,
    620,
    "#FF4B4B",
    "小意外保障"
)
# 左下
draw_card(
    30,
    900,
    480,
    620,
    "#8D4DFF",
    "大疾病保障"
)
# 右下
draw_card(
    570,
    900,
    480,
    620,
    "#FF9900",
    "大意外保障"
)
# ===== 中間圓 =====
draw.ellipse(
    [(350,650),(730,1030)],
    fill="white",
    outline="#9B70FF",
    width=8
)
center_font = ImageFont.truetype("arial.ttf", 52)
draw.text(
    (540,800),
    "整體保障評分",
    fill="black",
    font=center_font,
    anchor="mm"
)
# ===== 空白欄位 =====
def blank_box(x,y,color):
    draw.rounded_rectangle(
        [(x,y),(x+140,y+48)],
        radius=30,
        fill=color
    )
# 小疾病
blank_box(330,360,"#EAF1FF")
blank_box(330,450,"#EAF1FF")
blank_box(330,540,"#EAF1FF")
blank_box(330,630,"#FFECEC")
# 小意外
blank_box(870,360,"#FFECEC")
blank_box(870,450,"#FFECEC")
blank_box(870,540,"#EAF8EC")
# 大疾病
blank_box(280,1040,"#F2EAFF")
blank_box(280,1120,"#F2EAFF")
blank_box(280,1200,"#EAF8EC")
blank_box(280,1280,"#FFECEC")
blank_box(280,1360,"#FFECEC")
blank_box(280,1440,"#FFECEC")
# 大意外
blank_box(870,1040,"#FFF1DD")
blank_box(870,1120,"#FFF1DD")
blank_box(870,1200,"#FFF1DD")
# ===== Footer =====
footer_font = ImageFont.truetype("arial.ttf", 32)
draw.text(
    (60,1750),
    "受檢人：",
    fill="#444",
    font=footer_font
)
draw.text(
    (60,1810),
    "檢測日期：",
    fill="#444",
    font=footer_font
)
draw.text(
    (760,1780),
    "PolicyPal 保單夥伴",
    fill="#2D5BFF",
    font=footer_font
)
# ===== Save =====
img.save("policy_report.png")
print("done")
