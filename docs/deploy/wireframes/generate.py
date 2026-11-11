#!/usr/bin/env python3
"""Generates the low-fidelity Deploy wireframes as SVG. Standard library only.
Run: python3 docs/deploy/wireframes/generate.py"""
import os, html
OUT = os.path.dirname(os.path.abspath(__file__))
W, H = 1280, 800
INK, MUTE, LINE, FILL, BG, ACC = "#1a1a1a", "#6b6b6b", "#c9c9c9", "#ececec", "#fafafa", "#2f5d50"

class Svg:
    def __init__(s, title): s.t, s.e = title, []
    def rect(s, x, y, w, h, fill="none", stroke=LINE, r=6, dash=False):
        d = ' stroke-dasharray="5 4"' if dash else ''
        s.e.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"{d}/>')
    def text(s, x, y, t, size=13, color=INK, weight=400, anchor="start"):
        s.e.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}">{html.escape(t)}</text>')
    def line(s, x1, y1, x2, y2, c=LINE): s.e.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}"/>')
    def bars(s, x, y, w, h, vals):
        bw = w / len(vals)
        for i, v in enumerate(vals): s.rect(round(x + i * bw + 3), round(y + h - h * v), round(bw - 6), round(h * v), FILL, LINE, 2)
    def spark(s, x, y, w, h, vals, c=ACC):
        pts = " ".join(f"{round(x + i * w / (len(vals) - 1))},{round(y + h - h * v)}" for i, v in enumerate(vals))
        s.e.append(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="2"/>')
    def btn(s, x, y, label, primary=False, w=None):
        w = w or 16 + 7.4 * len(label)
        s.rect(x, y, round(w), 30, INK if primary else "#fff", INK if primary else LINE, 15)
        s.text(x + w / 2, y + 20, label, 12, "#fff" if primary else INK, 600, "middle"); return x + w + 8
    def tabs(s, x, y, names, active=0):
        for i, n in enumerate(names):
            w = 18 + 7.2 * len(n)
            if i == active: s.rect(x, y, round(w), 28, INK, INK, 14)
            s.text(x + w / 2, y + 19, n, 12, "#fff" if i == active else MUTE, 600, "middle"); x += w + 6
        s.line(40 if x < 300 else 232, y + 38, W - 24, y + 38)
    def table(s, x, y, w, cols, rows, rh=34):
        cw = w / len(cols)
        for i, c in enumerate(cols): s.text(x + i * cw + 10, y + 18, c, 11, MUTE, 600)
        s.line(x, y + 26, x + w, y + 26)
        for r, row in enumerate(rows):
            yy = y + 26 + rh * r
            for i, c in enumerate(row): s.text(x + i * cw + 10, yy + 22, c, 12)
            s.line(x, yy + rh, x + w, yy + rh, "#e4e4e4")
    def kpi(s, x, y, w, label, val, delta=""):
        s.rect(x, y, w, 84, "#fff"); s.text(x + 14, y + 24, label, 11, MUTE, 600); s.text(x + 14, y + 58, val, 26, INK, 700)
        if delta: s.text(x + w - 14, y + 58, delta, 12, ACC, 600, "end")
    def shell(s, active, crumb):
        s.rect(0, 0, W, H, BG, "none", 0); s.rect(0, 0, 208, H, "#f1f1f1", "none", 0); s.line(208, 0, 208, H)
        s.text(24, 38, "deploy", 20, INK, 800); s.rect(16, 56, 176, 34, "#fff"); s.text(28, 78, "biddeed.ai  v", 12, INK, 600)
        nav = ["Home", "Deploys", "Analytics", "AI visibility", "SEO", "Monitors", "Playbooks", "Database", "Forms", "Assets"]
        for i, n in enumerate(nav):
            y = 112 + i * 34
            if n == active: s.rect(12, y - 20, 184, 30, INK, INK, 15)
            s.text(28, y, n, 13, "#fff" if n == active else INK, 600 if n == active else 400)
        s.line(16, H - 96, 192, H - 96); s.text(28, H - 68, "Integrations", 13); s.text(28, H - 36, "Settings", 13)
        s.text(232, 36, crumb, 12, MUTE); s.rect(W - 300, 16, 190, 30, "#fff", LINE, 15); s.text(W - 284, 36, "Ask Deploy...  Ctrl K", 12, MUTE)
        s.rect(W - 98, 16, 74, 30, "#fff", LINE, 15); s.text(W - 61, 36, "AS", 12, INK, 600, "middle"); s.line(208, 60, W, 60)
    def save(s, name):
        body = "\n".join(s.e)
        open(os.path.join(OUT, name), "w").write(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" font-family="Inter, Helvetica, Arial, sans-serif" role="img" aria-label="{html.escape(s.t)}">\n<title>{html.escape(s.t)}</title>\n{body}\n</svg>\n')

def w01():
    s = Svg("D01 Sign in"); s.rect(0, 0, W, H, BG, "none", 0); s.text(48, 56, "deploy", 22, INK, 800)
    s.text(96, 380, "EVERY SITE WE OWN,", 44, INK, 800); s.text(96, 432, "WATCHED AND WORKED.", 44, INK, 800); s.text(96, 470, "Internal tool. Allowlisted accounts only.", 14, MUTE)
    s.rect(760, 250, 400, 300, "#fff"); s.text(792, 300, "Sign in", 24, INK, 700); s.text(792, 336, "Work email", 12, MUTE, 600); s.rect(792, 346, 336, 38, "#fff")
    s.btn(792, 400, "Send magic link", True, 336); s.text(960, 458, "or", 12, MUTE, 400, "middle"); s.btn(792, 474, "Continue with Google", False, 336)
    s.text(792, 530, "Not on the allowlist? Access is denied, no sign-up.", 11, MUTE); s.save("D01-sign-in.svg")

def w02():
    s = Svg("D02 Home: portfolio of sites"); s.shell("Home", "Home / All sites")
    s.text(232, 100, "Good morning. 3 things need you.", 24, INK, 700)
    for i, (l, v, d) in enumerate([("Sites monitored", "6", ""), ("Visitors, 7 days", "18,402", "+12%"), ("AI answer share", "31%", "+4 pts"), ("Open findings", "14", "3 high")]):
        s.kpi(232 + i * 258, 120, 244, l, v, d)
    s.text(232, 240, "Sites", 15, INK, 700)
    s.table(232, 250, 700, ["Site", "Status", "Visitors 7d", "AI share", "Findings", "Last deploy"], [
        ["biddeed.ai", "Up", "9,210", "38%", "4", "2h ago"], ["dealdeed.app", "Up", "3,884", "22%", "2", "yesterday"], ["zonewise", "Up", "2,115", "41%", "1", "3d ago"],
        ["rentaliq", "Degraded", "1,902", "12%", "5", "6d ago"], ["everest capital", "Up", "911", "9%", "2", "12d ago"], ["swim tracker", "Up", "380", "n/a", "0", "30d ago"]])
    s.rect(952, 232, 304, 290, "#fff"); s.text(968, 258, "Needs you", 14, INK, 700)
    for i, t in enumerate(["Approve 2 drafted page updates", "rentaliq: LCP regressed to 4.1s", "biddeed.ai lost citation on 3 prompts", "Weekly SEO playbook finished"]):
        s.rect(968, 272 + i * 58, 272, 48, BG); s.text(980, 301 + i * 58, t, 12)
    s.rect(232, 540, 1024, 236, "#fff"); s.text(248, 566, "Activity (agent runs, deploys, alerts)", 14, INK, 700)
    for i in range(5): s.line(248, 596 + i * 34, 1240, 596 + i * 34, "#e4e4e4"); s.rect(248, 578 + i * 34, 420 - i * 40, 10, FILL, "none", 4)
    s.save("D02-home-portfolio.svg")

def w03(view, idx, name):
    s = Svg(f"D03 Deploy workspace, {view} view"); s.shell("Deploys", "biddeed.ai / Deploys / Auction calendar refresh")
    s.text(232, 96, "Auction calendar refresh", 22, INK, 700); x = s.btn(980, 76, "Preview"); s.btn(x, 76, "Publish", True)
    s.tabs(232, 112, ["Chat", "Gallery", "Preview", "Changes", "Runs"], idx)
    if view == "Gallery":
        s.text(232, 178, "Everything this Deploy produced: pages, images, reports, datasets.", 12, MUTE); s.tabs(900, 160, ["All", "Pages", "Images", "Docs", "Data"], 0)
        for i in range(8):
            x, y = 232 + (i % 4) * 258, 206 + (i // 4) * 280
            s.rect(x, y, 244, 264, "#fff"); s.rect(x + 12, y + 12, 220, 160, FILL, "none"); s.rect(x + 12, y + 186, 150, 12, INK, "none", 4); s.rect(x + 12, y + 208, 200, 9, FILL, "none", 4)
            s.text(x + 12, y + 246, ["Page draft", "Image", "Report", "Dataset"][i % 4], 11, MUTE, 600); s.text(x + 232, y + 246, "Open", 11, ACC, 600, "end")
    elif view == "Chat":
        s.rect(232, 166, 560, 610, "#fff")
        for i, (me, wd) in enumerate([(True, 300), (False, 460), (False, 380), (True, 220), (False, 440)]):
            s.rect(232 + (560 - wd - 16 if me else 16), 186 + i * 96, wd, 76, FILL if me else BG, LINE, 12)
        s.rect(248, 708, 528, 52, "#fff", INK, 12); s.text(264, 739, "Tell Deploy what to change...", 12, MUTE); s.btn(700, 719, "Send", True)
        s.rect(808, 166, 448, 610, "#fff"); s.text(824, 192, "Plan and tool calls", 13, INK, 700)
        for i, t in enumerate(["Read site theme and components", "Pull GSC queries, last 90 days", "Draft /auctions/brevard update", "Lighthouse on draft", "Waiting for your approval"]):
            s.rect(824, 208 + i * 52, 416, 42, BG, LINE if i < 4 else INK); s.text(838, 234 + i * 52, t, 12)
        s.rect(824, 484, 416, 276, FILL, LINE, 6, True); s.text(1032, 626, "Artifact preview", 12, MUTE, 400, "middle")
    else:
        s.rect(232, 166, 1024, 40, "#fff"); s.text(248, 191, "preview.deploy.internal/biddeed/auction-calendar", 12, MUTE); s.tabs(1040, 172, ["Desktop", "Tablet", "Mobile"], 0)
        s.rect(232, 214, 1024, 562, FILL, LINE, 6, True); s.rect(292, 250, 520, 30, INK, "none", 4); s.rect(292, 296, 380, 12, LINE, "none", 4)
        for i in range(3): s.rect(292 + i * 300, 350, 280, 180, "#fff")
        s.rect(292, 560, 904, 180, "#fff")
    s.save(name)

def w04():
    s = Svg("D04 Analytics"); s.shell("Analytics", "biddeed.ai / Analytics")
    s.text(232, 96, "Analytics", 22, INK, 700); s.btn(1090, 76, "Last 7 days  v"); s.tabs(232, 112, ["Overview", "Pages", "Sources", "AI assistants", "Events", "Forms", "Web vitals"], 0)
    for i, (l, v, d) in enumerate([("Active now", "19", ""), ("Pageviews", "6,989", "+44.6%"), ("Visitors", "3,160", "+52.4%"), ("Avg time on page", "5m 38s", "+11.3%")]): s.kpi(232 + i * 258, 166, 244, l, v, d)
    s.rect(232, 266, 660, 260, "#fff"); s.text(248, 292, "Pageviews and visitors", 13, INK, 700)
    s.spark(252, 310, 620, 190, [.2, .35, .3, .5, .45, .7, .62, .8, .74, .9]); s.spark(252, 330, 620, 170, [.1, .2, .18, .3, .28, .4, .36, .5, .46, .55], MUTE)
    s.rect(908, 266, 348, 260, "#fff"); s.text(924, 292, "Sources", 13, INK, 700)
    for i, (n, v) in enumerate([("Organic search", .9), ("Direct", .6), ("AI assistants", .42), ("Referral", .3), ("Social", .15)]):
        s.text(924, 326 + i * 38, n, 12); s.rect(1050, 314 + i * 38, round(190 * v), 14, FILL, LINE, 3)
    s.rect(232, 542, 500, 234, "#fff"); s.text(248, 568, "Top pages", 13, INK, 700)
    s.table(248, 578, 468, ["Path", "Views", "Bounce"], [["/", "2,104", "38%"], ["/auctions/brevard", "1,330", "29%"], ["/pricing", "902", "44%"], ["/blog/tax-deed-guide", "611", "51%"]], 32)
    s.rect(748, 542, 508, 234, "#fff"); s.text(764, 568, "Conversion funnel", 13, INK, 700); s.bars(764, 590, 476, 160, [1, .62, .31, .12])
    s.save("D04-analytics.svg")

def w05():
    s = Svg("D05 AI visibility"); s.shell("AI visibility", "biddeed.ai / AI visibility")
    s.text(232, 96, "AI search visibility", 22, INK, 700); x = s.btn(1004, 76, "Add prompt"); s.btn(x, 76, "Run check", True)
    s.tabs(232, 112, ["Prompts", "Citations", "Agent readiness", "History"], 0)
    for i, (l, v, d) in enumerate([("Answer share", "31%", "+4 pts"), ("Prompts tracked", "42", ""), ("Cited pages", "17", "+3"), ("Readiness", "86 / 100", "")]): s.kpi(232 + i * 258, 166, 244, l, v, d)
    eng = ["ChatGPT", "Gemini", "Claude", "Perplexity", "AI Overviews", "AI Mode"]
    s.rect(232, 266, 1024, 510, "#fff"); s.text(248, 296, "Prompt", 11, MUTE, 600)
    for i, e in enumerate(eng): s.text(700 + i * 92, 296, e, 11, MUTE, 600, "middle")
    s.line(248, 306, 1240, 306)
    ps = ["best foreclosure auction software florida", "how to research tax deed auctions", "brevard county foreclosure calendar", "ai tool for auction due diligence", "biddeed vs propertyonion", "max bid calculator foreclosure", "lien search before auction", "what is a certificate of title", "foreclosure auction data api"]
    for r, p in enumerate(ps):
        y = 336 + r * 48; s.text(248, y, p, 12)
        for i in range(6):
            st = (r * 7 + i * 3) % 4
            s.rect(676 + i * 92, y - 18, 48, 26, [INK, FILL, "#fff", ACC][st], LINE, 13); s.text(700 + i * 92, y, ["Cited", "Named", "-", "Top"][st], 10, ["#fff", INK, MUTE, "#fff"][st], 600, "middle")
        s.line(248, y + 18, 1240, y + 18, "#e4e4e4")
    s.save("D05-ai-visibility.svg")

def w06():
    s = Svg("D06 Monitors and change feed"); s.shell("Monitors", "All sites / Monitors")
    s.text(232, 96, "Monitors", 22, INK, 700); s.btn(1140, 76, "New monitor", True); s.tabs(232, 112, ["Feed", "Uptime", "Visual diffs", "Performance", "Content", "Rules"], 0)
    s.rect(232, 166, 640, 610, "#fff")
    for i, (sev, t, m) in enumerate([("HIGH", "rentaliq: LCP 4.1s on /search (was 2.3s)", "Performance, 14 min ago"), ("HIGH", "biddeed.ai: 3 broken links after deploy 8f2c", "Content, 1h ago"), ("MED", "dealdeed.app: hero changed 12% of pixels", "Visual diff, 3h ago"), ("MED", "zonewise: sitemap lost 14 URLs", "SEO, 5h ago"), ("LOW", "everest capital: certificate renews in 21 days", "Uptime, 1d ago"), ("LOW", "biddeed.ai: schema warning on 2 pages", "SEO, 1d ago")]):
        y = 182 + i * 96; s.rect(248, y, 608, 82, BG); s.rect(262, y + 14, 46, 22, INK if sev == "HIGH" else FILL, LINE, 11); s.text(285, y + 29, sev, 10, "#fff" if sev == "HIGH" else INK, 700, "middle")
        s.text(320, y + 30, t, 13, INK, 600); s.text(320, y + 54, m, 11, MUTE); s.text(840, y + 54, "Fix with Deploy", 11, ACC, 600, "end")
    s.rect(888, 166, 368, 300, "#fff"); s.text(904, 192, "Visual diff", 13, INK, 700); s.rect(904, 206, 160, 200, FILL, "none"); s.rect(1080, 206, 160, 200, FILL, "none"); s.rect(1096, 250, 120, 60, "none", INK, 4, True)
    s.text(984, 430, "Before", 11, MUTE, 400, "middle"); s.text(1160, 430, "After", 11, MUTE, 400, "middle")
    s.rect(888, 482, 368, 294, "#fff"); s.text(904, 508, "Uptime, 30 days", 13, INK, 700)
    for i, n in enumerate(["biddeed.ai", "dealdeed.app", "zonewise", "rentaliq", "everest capital"]):
        s.text(904, 544 + i * 44, n, 12)
        for k in range(30): s.rect(1010 + k * 7.6, 530 + i * 44, 5, 20, INK if (i == 3 and k in (11, 12, 24)) else LINE, "none", 1)
    s.save("D06-monitors.svg")

def w07():
    s = Svg("D07 Playbooks"); s.shell("Playbooks", "biddeed.ai / Playbooks")
    s.text(232, 96, "Playbooks", 22, INK, 700); s.btn(1140, 76, "New playbook", True); s.tabs(232, 112, ["Library", "Scheduled", "Runs"], 0)
    names = ["GSC keyword optimization", "Agent readiness audit", "Weekly traffic report", "Broken link sweep", "AEO comparison pages", "Lighthouse regression check", "Content refresh", "Schema and llms.txt audit", "Programmatic county pages"]
    for i, n in enumerate(names):
        x, y = 232 + (i % 3) * 344, 166 + (i // 3) * 200
        s.rect(x, y, 328, 184, "#fff"); s.text(x + 16, y + 32, n, 14, INK, 700); s.rect(x + 16, y + 48, 280, 9, FILL, "none", 4); s.rect(x + 16, y + 66, 220, 9, FILL, "none", 4)
        s.text(x + 16, y + 108, "6 steps  -  est. 40 credits", 11, MUTE); s.text(x + 16, y + 128, ["Every Monday 9:00", "On demand", "On deploy"][i % 3], 11, MUTE)
        xx = s.btn(x + 16, y + 142, "Run", True); s.btn(xx, y + 142, "Schedule")
    s.save("D07-playbooks.svg")

def w08():
    s = Svg("D08 SEO"); s.shell("SEO", "biddeed.ai / SEO")
    s.text(232, 96, "SEO", 22, INK, 700); s.tabs(232, 112, ["Keyword gaps", "Pages", "Technical", "Lighthouse"], 0)
    s.rect(232, 166, 640, 610, "#fff"); s.text(248, 192, "Search Console, last 90 days  -  /auctions/brevard", 13, INK, 700)
    s.table(248, 204, 608, ["Query", "Impr.", "Pos.", "On page"], [["brevard foreclosure auction", "4,120", "8.4", "Covered"], ["brevard tax deed sale dates", "1,380", "14.2", "Missing"], ["foreclosure auction calendar fl", "960", "18.7", "Partial"], ["how to bid brevard clerk", "610", "22.1", "Missing"], ["realforeclose brevard", "540", "9.9", "Covered"], ["titusville foreclosures", "410", "25.0", "Missing"]], 40)
    s.rect(888, 166, 368, 610, "#fff"); s.text(904, 192, "Suggested edits (2)", 13, INK, 700); s.text(904, 212, "Waiting for your review", 11, MUTE)
    for i in range(2):
        y = 230 + i * 150; s.rect(904, y, 336, 134, BG); s.rect(918, y + 16, 290, 10, INK, "none", 4); s.rect(918, y + 38, 300, 9, FILL, "none", 4); s.rect(918, y + 56, 240, 9, FILL, "none", 4)
        xx = s.btn(918, y + 88, "Approve", True); s.btn(xx, y + 88, "Edit")
    s.save("D08-seo.svg")

def w09():
    s = Svg("D09 Settings"); s.shell("", "Settings")
    s.text(232, 96, "Settings", 22, INK, 700); s.tabs(232, 112, ["Sites", "Integrations", "Team", "API tokens", "MCP", "Budget", "Audit log"], 0)
    s.rect(232, 166, 1024, 300, "#fff"); s.text(248, 192, "Monitored sites (must pass ownership verification)", 13, INK, 700); s.btn(1130, 172, "Add site", True)
    s.table(248, 210, 992, ["Domain", "Verified by", "Repo", "Host", "Tracking", "Auto-publish"], [["biddeed.ai", "DNS TXT", "breverdbidder/biddeed", "Cloudflare Pages", "Installed", "Off"], ["dealdeed.app", "DNS TXT", "breverdbidder/dealdeed", "Cloudflare Pages", "Installed", "Off"], ["zonewise", "Meta tag", "breverdbidder/zonewise", "Cloudflare Pages", "Installed", "Drafts only"], ["rentaliq", "File", "breverdbidder/rentaliq", "Cloudflare Pages", "Missing", "Off"]], 44)
    s.rect(232, 482, 504, 294, "#fff"); s.text(248, 508, "Add a site", 13, INK, 700)
    for i, t in enumerate(["1  Enter domain", "2  Prove ownership: DNS TXT, meta tag or file", "3  Connect GitHub repo and Cloudflare project", "4  Install tracking snippet", "5  First crawl and baseline"]):
        s.rect(248, 522 + i * 48, 472, 38, BG); s.text(262, 546 + i * 48, t, 12)
    s.rect(752, 482, 504, 294, "#fff"); s.text(768, 508, "Monthly budget", 13, INK, 700); s.text(768, 548, "$41.20 of $100.00", 24, INK, 700); s.rect(768, 566, 472, 14, FILL, LINE, 7); s.rect(768, 566, 194, 14, INK, INK, 7)
    s.bars(768, 610, 472, 140, [.3, .5, .2, .7, .4, .6, .35, .8, .3, .45, .5, .25])
    s.save("D09-settings.svg")

w01(); w02(); w03("Chat", 0, "D03a-deploy-chat.svg"); w03("Gallery", 1, "D03b-deploy-gallery.svg"); w03("Preview", 2, "D03c-deploy-preview.svg"); w04(); w05(); w06(); w07(); w08(); w09()
print("wrote", len([f for f in os.listdir(OUT) if f.endswith(".svg")]), "wireframes")
