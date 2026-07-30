# -*- coding: utf-8 -*-
"""
LIMIAR — Prancha I
An expression of the "Cadastral Lyric" philosophy.
Vector plate, 1000 x 1300 pt.
"""
import math, os
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")

pdfmetrics.registerFont(TTFont("Display", os.path.join(FONTS, "Italiana-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Mono",    os.path.join(FONTS, "GeistMono-Regular.ttf")))
pdfmetrics.registerFont(TTFont("SerifIt", os.path.join(FONTS, "InstrumentSerif-Italic.ttf")))

# ── canvas ────────────────────────────────────────────────────────────────────
W, H = 1000.0, 1300.0
ML = MR = 92.0
MT, MB = 86.0, 98.0
X0, X1 = ML, W - MR
CW = X1 - X0

# ── palette ───────────────────────────────────────────────────────────────────
def hx(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) / 255.0 for i in (0, 2, 4))

PAPER  = hx("E9E3D6")
INK    = hx("1B1A16")
GRAY   = hx("6A6558")
ACCENT = hx("9DAF00")

# ── typography ────────────────────────────────────────────────────────────────
def tw(s, f, sz, cs):
    return pdfmetrics.stringWidth(s, f, sz) + cs * max(len(s) - 1, 0)

def text(c, x, y, s, f="Mono", sz=6.2, cs=1.7, col=INK, a=1.0, align="l"):
    if not s:
        return
    w = tw(s, f, sz, cs)
    if align == "r":
        x -= w
    elif align == "c":
        x -= w / 2.0
    c.saveState()
    c.setFillColorRGB(*col)
    c.setFillAlpha(a)
    t = c.beginText()
    t.setTextOrigin(x, y)
    t.setFont(f, sz)
    t.setCharSpace(cs)
    t.textOut(s)
    c.drawText(t)
    c.restoreState()

# ── marks ─────────────────────────────────────────────────────────────────────
def line(c, x1, y1, x2, y2, w=0.3, col=INK, a=1.0):
    c.saveState()
    c.setLineWidth(w)
    c.setStrokeColorRGB(*col)
    c.setStrokeAlpha(a)
    c.setLineCap(0)
    c.line(x1, y1, x2, y2)
    c.restoreState()

def rect(c, x, y, w, h, lw=0.3, col=INK, a=1.0):
    c.saveState()
    c.setLineWidth(lw)
    c.setStrokeColorRGB(*col)
    c.setStrokeAlpha(a)
    c.setLineJoin(0)
    c.rect(x, y, w, h, stroke=1, fill=0)
    c.restoreState()

def fill(c, x, y, w, h, col=INK, a=1.0):
    c.saveState()
    c.setFillColorRGB(*col)
    c.setFillAlpha(a)
    c.rect(x, y, w, h, stroke=0, fill=1)
    c.restoreState()

def corner_ticks(c, x0, y0, x1, y1, L=6.0, lw=0.45, col=INK, a=0.8):
    for (px, py, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1),
                             (x0, y1, 1, -1), (x1, y1, -1, -1)):
        line(c, px, py, px + L * sx, py, lw, col, a)
        line(c, px, py, px, py + L * sy, lw, col, a)

def dim_line(c, x0, x1, y, tick=3.5, col=GRAY, a=0.9):
    line(c, x0, y, x1, y, 0.32, col, a)
    line(c, x0, y - tick, x0, y + tick, 0.32, col, a)
    line(c, x1, y - tick, x1, y + tick, 0.32, col, a)

# ── paper grain ───────────────────────────────────────────────────────────────
def grain_png(path, w=500, h=650, sigma=30, gain=0.055, seed=7):
    n = Image.effect_noise((w, h), sigma)
    alpha = n.point(lambda v: int(min(255, abs(v - 128) * gain * 3.0)))
    alpha = alpha.resize((w * 2, h * 2), Image.LANCZOS)
    base = Image.new("RGB", alpha.size, tuple(int(v * 255 * 0.55) for v in INK))
    img = Image.new("RGBA", alpha.size)
    img.paste(base, (0, 0))
    img.putalpha(alpha)
    img.save(path)
    return path

# ── geometry ──────────────────────────────────────────────────────────────────
def lerp(a, b, t):
    return a + (b - a) * t

def lerp_rect(r0, r1, t):
    return tuple(lerp(r0[i], r1[i], t) for i in range(4))

def nest(c, inner, outer, n, ease=0.66, lw=0.3, col=INK, a=0.88,
         accent_index=None, acc_lw=0.7):
    """Patient accumulation: n rectangles morphing from the void to the field."""
    drawn = []
    for i in range(n + 1):
        t = (i / float(n)) ** ease
        r = lerp_rect(inner, outer, t)
        drawn.append(r)
        if accent_index is not None and i == accent_index:
            rect(c, r[0], r[1], r[2] - r[0], r[3] - r[1], acc_lw, ACCENT, 0.95)
        else:
            fade = 1.0 if i > 2 else 0.58 + 0.14 * i
            rect(c, r[0], r[1], r[2] - r[0], r[3] - r[1], lw, col, a * fade)
    return drawn

ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]

# ── the plate ─────────────────────────────────────────────────────────────────
def build(out_pdf):
    c = rl_canvas.Canvas(out_pdf, pagesize=(W, H))
    c.setTitle("LIMIAR — Prancha I")
    c.setAuthor("Cadastral Lyric")

    fill(c, 0, 0, W, H, PAPER, 1.0)

    # the ghost of the press
    rect(c, ML - 22, MB - 22, CW + 44, H - MT - MB + 44, 0.5, GRAY, 0.28)

    # ── header ────────────────────────────────────────────────────────────────
    y_head = H - MT - 4
    text(c, X0, y_head, "CADASTRO DO LIMIAR", "Mono", 6.4, 2.2, INK, 0.92, "l")
    text(c, X1, y_head, "PRANCHA I · SÉRIE 35.314", "Mono", 6.4, 2.2, INK, 0.92, "r")
    line(c, X0, y_head - 13, X1, y_head - 13, 0.5, INK, 0.85)

    # ── field I : the aperture ────────────────────────────────────────────────
    P_TOP, P_BOT = 1160.0, 588.0
    PH = P_TOP - P_BOT
    rect(c, X0, P_BOT, CW, PH, 0.5, INK, 0.85)

    c.saveState()
    p = c.beginPath()
    p.rect(X0, P_BOT, CW, PH)
    c.clipPath(p, stroke=0)

    COLS, ROWS = 16, 12
    for i in range(1, COLS):
        x = X0 + CW * i / COLS
        line(c, x, P_BOT, x, P_TOP, 0.25, GRAY, 0.15)
    for j in range(1, ROWS):
        y = P_BOT + PH * j / ROWS
        line(c, X0, y, X1, y, 0.25, GRAY, 0.15)

    pad = 48.0
    outer = (X0 + pad, P_BOT + pad, X1 - pad, P_TOP - pad)
    vx, vy = X0 + CW * 0.452, P_BOT + PH * 0.515
    vw, vh = CW * 0.086, PH * 0.094
    inner = (vx - vw, vy - vh, vx + vw, vy + vh)

    # the count is not chosen but derived: the tightest interval on the
    # tightest edge never closes below the legible minimum.
    EASE, GAP = 0.66, 2.6
    reach = min(inner[0] - outer[0], inner[1] - outer[1],
                outer[2] - inner[2], outer[3] - inner[3])
    N = int(EASE * reach / GAP)
    rects = nest(c, inner, outer, N, EASE, 0.3, INK, 0.88,
                 accent_index=int(N * 0.30), acc_lw=0.7)

    ext = 34.0
    line(c, inner[0] - ext, vy, inner[2] + ext, vy, 0.3, GRAY, 0.5)
    line(c, vx, inner[1] - ext, vx, inner[3] + ext, 0.3, GRAY, 0.5)
    fill(c, vx - 2.3, vy - 2.3, 4.6, 4.6, ACCENT, 1.0)

    # the measured interval, annotated inside the air it describes
    dy_ = inner[1] + 15
    dim_line(c, inner[0] + 22, inner[2] - 22, dy_, tick=3.2)
    text(c, inner[0] + 22, dy_ + 7.0, "0,35 M", "Mono", 5.0, 1.3, GRAY, 0.95, "l")
    c.restoreState()

    # rulers
    for i in range(COLS + 1):
        x = X0 + CW * i / COLS
        line(c, x, P_TOP, x, P_TOP - (8.0 if i % 4 == 0 else 4.0), 0.35, INK, 0.5)
        if i % 4 == 0 and 0 < i < COLS:
            text(c, x, P_TOP + 8, "%02d" % i, "Mono", 5.0, 1.1, INK, 0.5, "c")
    for j in range(ROWS + 1):
        y = P_BOT + PH * j / ROWS
        line(c, X0, y, X0 + (8.0 if j % 3 == 0 else 4.0), y, 0.35, INK, 0.5)
        if j % 3 == 0 and 0 < j < ROWS:
            text(c, X0 - 9, y - 1.8, "%02d" % j, "Mono", 5.0, 1.1, INK, 0.5, "r")

    text(c, X0, P_BOT - 17, "FIG. 1 — VÃO CENTRAL · %d OBSERVAÇÕES" % N,
         "Mono", 6.0, 1.9, INK, 0.9, "l")
    text(c, X1, P_BOT - 17, "ESCALA 1 : 1", "Mono", 6.0, 1.9, INK, 0.9, "r")

    # ── field II : the migration ──────────────────────────────────────────────
    NS, g = 9, 14.0
    cell = (CW - g * (NS - 1)) / NS
    S_BOT = 452.0
    S_TOP = S_BOT + cell
    for j in range(NS):
        cx0 = X0 + j * (cell + g)
        k = 6.0                       # the drawing sits back from its own frame
        o = (cx0 + k, S_BOT + k, cx0 + cell - k, S_TOP - k)
        u = j / float(NS - 1)
        f = 0.115 + 0.13 * (1 - math.cos(2 * math.pi * u)) / 2.0
        dx = (u - 0.5) * 2 * 0.38 * (cell / 2.0 - k)
        dy = (math.sin(math.pi * u) * 0.26 - 0.09) * (cell / 2.0 - k)
        icx, icy = cx0 + cell / 2.0 + dx, S_BOT + cell / 2.0 + dy
        iw = ih = (cell - 2 * k) * f
        inn = (icx - iw, icy - ih, icx + iw, icy + ih)
        nest(c, inn, o, 10, 0.66, 0.27, INK, 0.84,
             accent_index=(3 if j == 4 else None), acc_lw=0.55)
        corner_ticks(c, cx0, S_BOT, cx0 + cell, S_TOP, L=6.5, lw=0.45, col=INK, a=0.78)
        text(c, cx0 + cell / 2.0, S_BOT - 16, ROMAN[j], "Mono", 5.4, 1.2, INK, 0.85, "c")

    text(c, X0, S_BOT - 35, "FIG. 2 — DESLOCAMENTO DA SOLEIRA, I—IX",
         "Mono", 6.0, 1.9, INK, 0.9, "l")
    text(c, X1, S_BOT - 35, "INTERVALO CONSTANTE", "Mono", 6.0, 1.9, INK, 0.9, "r")

    # ── title stratum ─────────────────────────────────────────────────────────
    line(c, X0, 384, X1, 384, 0.5, INK, 0.85)

    T_BASE = 282.0
    text(c, X0, T_BASE, "LIMIAR", "Display", 108, 19, INK, 1.0, "l")

    for k, s in enumerate(["ESTUDOS DE SOLEIRA",
                           "PASSOS · MINAS GERAIS",
                           "20°43′ S — 46°36′ O"]):
        text(c, X1, T_BASE + 30 - k * 15, s, "Mono", 6.2, 1.9, INK, 0.9, "r")

    text(c, X0 + 3, 234, "o intervalo mensurável entre fora e dentro",
         "SerifIt", 19.5, 0.4, INK, 0.92, "l")

    # ── footer ────────────────────────────────────────────────────────────────
    line(c, X0, 152, X1, 152, 0.5, INK, 0.85)
    text(c, X0, 136, "TINTA SOBRE PAPEL DE ALGODÃO", "Mono", 6.0, 2.0, INK, 0.85, "l")
    text(c, X1, 136, "ED. 1 / 1", "Mono", 6.0, 2.0, INK, 0.85, "r")
    fill(c, X0, 124, 16, 1.5, ACCENT, 1.0)

    gp = os.path.join(HERE, "_grain.png")
    grain_png(gp)
    c.drawImage(ImageReader(gp), 0, 0, width=W, height=H, mask="auto")

    c.showPage()
    c.save()
    return out_pdf


if __name__ == "__main__":
    out = os.path.join(HERE, "LIMIAR_Prancha_I.pdf")
    build(out)
    print("ok", out)
