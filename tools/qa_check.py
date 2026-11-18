#!/usr/bin/env python3
"""Automated QA gate (docs/QA_CHECKLIST.md ✅auto items) for the latest render of a carrier.

usage: python3 tools/qa_check.py <carrier> [render.mp4] [--every 2]
Writes carriers/<code>/review/qa_report.md and contact_sheet.jpg.
OCR checks need `brew install tesseract` (skipped with a warning otherwise).
"""
import json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
code = args[0]
every = float(sys.argv[sys.argv.index("--every") + 1]) if "--every" in sys.argv else 2.0
cdir = ROOT / "carriers" / code
renders = sorted((cdir / "renders").glob("*.mp4"), key=lambda p: p.stat().st_mtime)
video = Path(args[1]) if len(args) > 1 else (renders[-1] if renders else None)
if not video or not video.exists():
    sys.exit(f"no render found in {cdir/'renders'}")

results = []  # (status, check, detail)
def add(ok, check, detail=""):
    results.append(("PASS" if ok is True else "FAIL" if ok is False else "SKIP", check, detail))

# 1. props consistency (script <-> shots, files, boxes) — strict mode
p = subprocess.run(["node", "scripts/build-props.mjs", code], cwd=ROOT / "engine", capture_output=True, text=True)
add(p.returncode == 0, "shots.yaml / script.md / captures / boxes consistent", (p.stderr or p.stdout).strip().splitlines()[-1] if (p.stderr or p.stdout).strip() else "")

# 2. technical
probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)]))
v = next(s for s in probe["streams"] if s["codec_type"] == "video")
a = next((s for s in probe["streams"] if s["codec_type"] == "audio"), None)
final = "final" in video.name
want = (3840, 2160) if final else (1920, 1080)
add((v["width"], v["height"]) == want, f"resolution {want[0]}x{want[1]}", f'{v["width"]}x{v["height"]}')
add(v["r_frame_rate"] == "30/1", "30 fps", v["r_frame_rate"])
add(v["codec_name"] == "h264", "H.264", v["codec_name"])
add(a is not None and a["codec_name"] == "aac", "AAC audio", a["codec_name"] if a else "no audio stream")
if a:
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(video), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.findall(r"I:\s+(-?[\d.]+) LUFS", out)
    if m:
        lufs = float(m[-1])
        add(-17 <= lufs <= -15, "loudness −16 LUFS ±1", f"{lufs} LUFS")
bd = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(video), "-vf", "blackdetect=d=1:pix_th=0.05", "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
add(not blacks, "no black gaps > 1 s", ", ".join(f"{float(s):.1f}-{float(e):.1f}s" for s, e in blacks))

# 3. frames: contact sheet + OCR
review = cdir / "review"; review.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory() as td:
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", f"fps=1/{every},scale=1280:-1", f"{td}/f_%04d.jpg"], check=True)
    frames = sorted(Path(td).glob("f_*.jpg"))
    sheet_frames = frames[:: max(1, len(frames) // 40)][:40]
    lst = Path(td) / "list.txt"
    lst.write_text("".join(f"file '{f}'\n" for f in sheet_frames))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-vf", "scale=480:-1,tile=5x8", "-frames:v", "1", str(review / "contact_sheet.jpg")])
    if shutil.which("tesseract"):
        qa_hits, pii_hits = [], []
        email = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
        phone = re.compile(r"\+?\d[\d\s().-]{8,}\d")
        for i, f in enumerate(frames):
            t = (i * every)
            txt = subprocess.run(["tesseract", str(f), "-", "--psm", "11"], capture_output=True, text=True).stdout
            if re.search(r"QA[\s-]*Multi\s*Carrier", txt, re.I):
                qa_hits.append(f"{t:.0f}s")
            for m in email.findall(txt) + phone.findall(txt):
                if "pluginhive.com" not in m:
                    pii_hits.append(f"{t:.0f}s: {m}")
        add(not qa_hits, 'no "QA-MultiCarrier" on screen', ", ".join(qa_hits))
        add(not pii_hits, "no visible e-mail / phone (review hits; demo data may be fine)", "; ".join(pii_hits[:15]))
    else:
        add(None, "OCR checks (QA app name, PII)", "tesseract not installed: brew install tesseract")

fails = sum(1 for r in results if r[0] == "FAIL")
md = [f"# QA report — {code}", "", f"Render: `{video.relative_to(ROOT) if video.is_relative_to(ROOT) else video}`", "",
      "| Result | Check | Detail |", "|---|---|---|"] + [f"| {s} | {c} | {d} |" for s, c, d in results] + \
     ["", "Manual items: see docs/QA_CHECKLIST.md. Contact sheet: `review/contact_sheet.jpg`."]
(review / "qa_report.md").write_text("\n".join(md) + "\n")
print("\n".join(f"{s:4}  {c}  {d}" for s, c, d in results))
print(f"\n{fails} failure(s). Report: {review/'qa_report.md'}")
sys.exit(1 if fails else 0)
