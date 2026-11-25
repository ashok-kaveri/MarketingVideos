#!/usr/bin/env python3
"""Voiceover for a carrier: carriers/<code>/script.md -> audio/<id>.wav + audio/<id>.timings.json

Kokoro (kokoro-onnx) speaks each script section; faster-whisper gives word times, which are aligned
back to the script's own words so `on:` phrases in shots.yaml resolve exactly.

Setup once (outside the repo):
  ~/.cache/mcsl-tts/venv  with  kokoro-onnx soundfile faster-whisper
  ~/.cache/mcsl-tts/kokoro-v1.0.onnx, voices-v1.0.bin   (github.com/thewh1teagle/kokoro-onnx releases)

Usage: ~/.cache/mcsl-tts/venv/bin/python tools/tts.py <code> [--voice af_heart] [--speed 1.0] [--only id,id] [--force]

A section that ends mid-sentence (no . ! ? at the end) is spoken together with the next one(s) as one take,
then split between the words, so a sentence that spans two scenes sounds like one sentence. build-props
plays such scenes back to back with no pause (scripts/build-props.mjs: continues()).

Raw TTS goes to audio/raw/<id>.wav; audio/<id>.wav is the same audio with ONE shared gain for the whole
carrier so the narration sits at -16 LUFS (QA gate), peaks limited to -0.3 dBFS.
"""
import argparse, difflib, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser('~/.cache/mcsl-tts')

# How words are spoken (TTS only — script.md and on-screen text keep the written form).
SAY = [
    (r'\bPostNord\b', 'Postnord'),  # one word (espeak splits the camel case into "Post Nord")
    (r'www\.pluginhive\.com/support', 'www dot pluginhive dot com slash support'),
    (r'\bCN22\b', 'C N twenty-two'),
    (r'\bCN23\b', 'C N twenty-three'),
    (r'\bCSV\b', 'C S V'),
    (r'\bHS code\b', 'H S code'),
    (r'\bID\b', 'I D'),
    (r'\bIDs\b', 'I Ds'),
]


def parse_script(path):
    out, cur = {}, None
    for line in open(path, encoding='utf8'):
        m = re.match(r'^##\s+([\w-]+)\s*(\(silent\))?\s*$', line)
        if m:
            cur = m.group(1)
            out[cur] = {'text': '', 'silent': bool(m.group(2))}
            continue
        if cur and line.strip():
            out[cur]['text'] = (out[cur]['text'] + ' ' + line.strip()).strip()
    return out


def ends_sentence(text):
    return bool(re.search(r'[.!?][\"”’)]*$', text.strip()))


def runs(script):
    """Group spoken sections: a run ends at a section that ends a sentence."""
    out, cur = [], []
    for sid, s in script.items():
        if s['silent'] or not s['text']:
            continue
        cur.append(sid)
        if ends_sentence(s['text']):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower())


def spoken(text):
    for pat, rep in SAY:
        text = re.sub(pat, rep, text)
    return text


def align(script_text, wwords, total):
    """Give every script token a start/end, using whisper word times where they match."""
    toks = script_text.split()
    a = [norm(t) for t in toks]
    b = [norm(w['word']) for w in wwords]
    times = [None] * len(toks)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            w = wwords[blk.b + k]
            times[blk.a + k] = (w['start'], w['end'])
    # interpolate gaps between known anchors
    known = [i for i, t in enumerate(times) if t]
    first_start = wwords[0]['start'] if wwords else 0.0
    i = 0
    while i < len(toks):
        if times[i]:
            i += 1
            continue
        j = i
        while j < len(toks) and not times[j]:
            j += 1
        t0 = times[i - 1][1] if i > 0 else first_start
        t1 = times[j][0] if j < len(toks) else total
        n = j - i
        for k in range(n):
            times[i + k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
        i = j
    return [{'word': t, 'start': round(s, 3), 'end': round(e, 3)} for t, (s, e) in zip(toks, times)], len(known)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('code')
    ap.add_argument('--voice', default='af_heart')
    ap.add_argument('--speed', type=float, default=1.0)
    ap.add_argument('--only', default='')
    ap.add_argument('--force', action='store_true')
    args = ap.parse_args()

    import soundfile as sf
    from kokoro_onnx import Kokoro
    from faster_whisper import WhisperModel

    cdir = os.path.join(ROOT, 'carriers', args.code)
    adir = os.path.join(cdir, 'audio')
    rdir = os.path.join(adir, 'raw')
    os.makedirs(rdir, exist_ok=True)
    for f in os.listdir(adir):  # older runs wrote raw audio straight to audio/<id>.wav
        if f.endswith('.wav') and not os.path.exists(os.path.join(rdir, f)):
            os.replace(os.path.join(adir, f), os.path.join(rdir, f))
    script = parse_script(os.path.join(cdir, 'script.md'))
    only = set(filter(None, args.only.split(',')))

    tts = Kokoro(os.path.join(CACHE, 'kokoro-v1.0.onnx'), os.path.join(CACHE, 'voices-v1.0.bin'))
    asr = WhisperModel('small.en', device='cpu', compute_type='int8')

    import numpy as np
    for run in runs(script):
        if only and not (only & set(run)):
            continue
        done = all(os.path.exists(os.path.join(rdir, f'{sid}.wav')) and os.path.exists(os.path.join(adir, f'{sid}.timings.json')) for sid in run)
        if done and not args.force:
            print(f'skip {"+".join(run)}')
            continue
        text = ' '.join(script[sid]['text'] for sid in run)
        samples, sr = tts.create(spoken(text), voice=args.voice, speed=args.speed, lang='en-us')
        mono = samples if samples.ndim == 1 else samples.mean(axis=1)
        total = len(mono) / sr
        x16 = np.interp(np.arange(0, len(mono), sr / 16000), np.arange(len(mono)), mono).astype(np.float32)
        segs, _ = asr.transcribe(x16, word_timestamps=True, language='en', beam_size=5)
        wwords = [{'word': w.word.strip(), 'start': w.start, 'end': w.end} for seg in segs for w in seg.words]
        timings, matched = align(text, wwords, total)
        # split the take between sections, halfway through the gap between their words
        counts = [len(script[sid]['text'].split()) for sid in run]
        bounds, k = [0.0], 0
        for n in counts[:-1]:
            k += n
            bounds.append((timings[k - 1]['end'] + timings[k]['start']) / 2)
        bounds.append(total)
        k = 0
        for i, sid in enumerate(run):
            a, b = bounds[i], bounds[i + 1]
            sf.write(os.path.join(rdir, f'{sid}.wav'), mono[int(a * sr):int(b * sr)], sr)
            part = [{'word': w['word'], 'start': round(max(0.0, w['start'] - a), 3), 'end': round(min(b, w['end']) - a, 3)} for w in timings[k:k + counts[i]]]
            k += counts[i]
            json.dump(part, open(os.path.join(adir, f'{sid}.timings.json'), 'w'), indent=0)
        print(f'ok   {"+".join(run)}: {total:5.1f}s  {matched}/{len(timings)} words matched')

    normalize(script, adir, rdir)


def normalize(script, adir, rdir, target=-16.0):
    ids = [sid for sid, s in script.items() if not s['silent'] and s['text'] and os.path.exists(os.path.join(rdir, f'{sid}.wav'))]
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as lst:
        lst.write(''.join(f"file '{os.path.join(rdir, sid + '.wav')}'\n" for sid in ids))
    out = subprocess.run(['ffmpeg', '-hide_banner', '-f', 'concat', '-safe', '0', '-i', lst.name, '-af', 'ebur128', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    os.unlink(lst.name)
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', out)[-1])
    gain = target - lufs
    for sid in ids:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(rdir, f'{sid}.wav'),
                        '-af', f'volume={gain:.2f}dB,alimiter=limit=0.966:level=false', os.path.join(adir, f'{sid}.wav')], check=True)
    print(f'loudness: narration {lufs:.1f} LUFS -> {target} LUFS ({gain:+.1f} dB on {len(ids)} files)')


if __name__ == '__main__':
    sys.exit(main())
