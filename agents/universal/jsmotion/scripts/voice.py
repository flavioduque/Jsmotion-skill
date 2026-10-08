"""Uso: python3 voice.py narracao.txt  (--elevenlabs VOICE_ID | --audio voz.mp3 | --estimate)  [opções]
       python3 voice.py --check          (o que está disponível: chave do ElevenLabs, faster-whisper)
       python3 voice.py --voices pt      (lista vozes do ElevenLabs no idioma, para sugerir 3 ao usuário)
Transforma o texto da narração em LINHA DO TEMPO POR PALAVRA (words.json) — é ela que dita o ritmo do vídeo narrado.

Fontes da voz (escolha uma):
  --elevenlabs VOICE_ID   gera a voz pela API do ElevenLabs (precisa de ELEVENLABS_API_KEY no ambiente) e usa os
                          tempos de cada letra devolvidos pela própria API (sincronia exata)
  --audio arquivo         voz já pronta (gravada pelo usuário ou gerada em outra ferramenta, ex.: conector do
                          ElevenLabs): alinha palavra por palavra com faster-whisper; sem ele, pela energia do áudio
  --estimate              sem voz: tempos estimados pela velocidade de fala (vídeo "narrado" só com texto e trilha)
Opções: --lead 0.5 (segundos de respiro antes da 1ª palavra) · --wpm 160 (só no --estimate) · --lang pt
        --model small (modelo do whisper) · --out PASTA (padrão $WORK/voice)

Marcação do texto (narracao.txt):
  [nome]       marcador de cena: a cena do SCRIPT com mark:'nome' começa na palavra seguinte
  *palavra*    destaque (pode cobrir várias palavras: *After Effects*)
  # comentário linha ignorada · linha em branco = pausa maior (só no --estimate)
Saída: PASTA/words.json {method, lead, dur, audio, words:[{w,t0,t1,hl,br}], marks:{nome:índice}}
       + PASTA/narracao.mp3 (voz normalizada, quando houver voz)."""
import sys, os, re, json, base64, subprocess, difflib, unicodedata, urllib.request
from _paths import workdir

args = sys.argv[1:]
EL_KEY = os.environ.get('ELEVENLABS_API_KEY')
def el_get(path):
    req = urllib.request.Request('https://api.elevenlabs.io' + path, headers={'xi-api-key': EL_KEY})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())
if args[:1] == ['--check']:
    try: import faster_whisper; fw = True
    except Exception: fw = False
    print(f"ElevenLabs (ELEVENLABS_API_KEY): {'sim' if EL_KEY else 'não'}")
    print(f"faster-whisper (alinhar voz pronta): {'sim' if fw else 'não — bash $SK/scripts/install_watch.sh --voz'}")
    sys.exit(0)
if args[:1] == ['--voices']:
    if not EL_KEY: sys.exit('❌ sem ELEVENLABS_API_KEY')
    lang = (args[1] if len(args) > 1 else 'pt').lower()
    for v in el_get('/v2/voices?page_size=100').get('voices', []):
        lb = v.get('labels') or {}; langs = [x.get('language', '') for x in v.get('verified_languages') or []]
        if lang in (lb.get('language', '') or '').lower() or lang in langs or not langs:
            print(f"{v['voice_id']}  {v.get('name','')}  · {lb.get('gender','')} {lb.get('age','')} {lb.get('accent','')} · {lb.get('descriptive','') or lb.get('description','')} · {v.get('preview_url','')}")
    sys.exit(0)
def opt(flag, default=None, cast=str):
    if flag in args: i = args.index(flag); v = args[i+1]; del args[i:i+2]; return cast(v)
    return default
def flag(f):
    if f in args: args.remove(f); return True
    return False
el_voice = opt('--elevenlabs'); audio_in = opt('--audio'); estimate = flag('--estimate')
lead = opt('--lead', 0.5, float); wpm = opt('--wpm', 160, float); lang = opt('--lang', 'pt')
model = opt('--model', 'small'); out = opt('--out') or os.path.join(workdir(), 'voice')
if not args or sum(map(bool, [el_voice, audio_in, estimate])) != 1: sys.exit(__doc__)
os.makedirs(out, exist_ok=True)

# ---------- 1. texto → palavras com marcadores e destaques ----------
words, marks, hl, pause_after = [], {}, False, set()
for raw in open(args[0], encoding='utf-8').read().splitlines():
    line = raw.strip()
    if line.startswith('#'): continue
    if not line:
        if words: pause_after.add(len(words) - 1)
        continue
    for tok in re.findall(r'\[[^\]]+\]|\S+', line):
        m = re.fullmatch(r'\[([^\]]+)\]', tok)
        if m: marks[m.group(1).strip()] = len(words); continue
        start, end = tok.startswith('*'), tok.rstrip('.,!?;:…"\'').endswith('*')
        if start: hl = True
        w = tok.replace('*', '')
        if w: words.append({'w': w, 'hl': int(hl), 'br': 0})
        if end: hl = False
    if words: words[-1]['br'] = 1                     # quebra de linha do texto (dica de layout)
if not words: sys.exit('❌ narração vazia')
bad = [k for k, v in marks.items() if v >= len(words)]
if bad: sys.exit(f'❌ marcador sem texto depois: {bad}')
text = ' '.join(w['w'] for w in words)                 # o que a voz fala (sem marcadores nem *)

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))

def dur_of(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                       capture_output=True, text=True)
    return float(r.stdout.strip())

def normalize_audio(src, dst):
    """voz limpa: mono 44,1 kHz, −16 LUFS (a mixagem final do render leva tudo a −14)."""
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-af', 'loudnorm=I=-16:TP=-2:LRA=11',
                    '-ac', '1', '-ar', '44100', '-b:a', '128k', dst], check=True)

def fill_gaps(ts, total):
    """palavras sem tempo (não reconhecidas) recebem tempo proporcional ao tamanho, entre as vizinhas."""
    n = len(ts); i = 0
    while i < n:
        if ts[i] is not None: i += 1; continue
        j = i
        while j < n and ts[j] is None: j += 1
        a = ts[i-1][1] if i > 0 else 0.0
        b = ts[j][0] if j < n else total
        span = [len(words[k]['w']) + 2 for k in range(i, j)]; tot = sum(span); t = a
        for k in range(i, j):
            d = (b - a) * span[k-i] / tot; ts[k] = (t, t + d); t += d
        i = j
    return ts

method = None
voice_mp3 = os.path.join(out, 'narracao.mp3')

# ---------- 2a. ElevenLabs (tempos exatos por caractere) ----------
if el_voice:
    key = EL_KEY
    if not key: sys.exit('❌ defina ELEVENLABS_API_KEY (ou gere a voz em outra ferramenta e use --audio)')
    body = json.dumps({'text': text, 'model_id': os.environ.get('ELEVENLABS_MODEL', 'eleven_multilingual_v2'),
                       'voice_settings': {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.3}}).encode()
    req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{el_voice}/with-timestamps'
                                 '?output_format=mp3_44100_128', data=body,
                                 headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    try: res = json.loads(urllib.request.urlopen(req, timeout=180).read())
    except Exception as e: sys.exit(f'❌ ElevenLabs falhou: {e}')
    rawp = os.path.join(out, 'narracao_raw.mp3'); open(rawp, 'wb').write(base64.b64decode(res['audio_base64']))
    al = res.get('alignment') or res.get('normalized_alignment') or {}
    st, en = al.get('character_start_times_seconds', []), al.get('character_end_times_seconds', [])
    if len(st) == len(text):
        ts, pos = [], 0
        for w in words:
            a = pos; b = pos + len(w['w']) - 1; ts.append((st[a], en[b])); pos = b + 2
        method = 'elevenlabs'
    else:
        audio_in = rawp                                      # alinhamento veio diferente: alinha pelo áudio
    if method: normalize_audio(rawp, voice_mp3)

# ---------- 2b. voz pronta: whisper (palavra a palavra) ou energia ----------
if audio_in and not method:
    if not os.path.exists(audio_in): sys.exit(f'❌ áudio não encontrado: {audio_in}')
    normalize_audio(audio_in, voice_mp3)
    total = dur_of(voice_mp3); ts = None
    try:
        import numpy as np
        from faster_whisper import WhisperModel
        pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', voice_mp3, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'],
                             capture_output=True, check=True).stdout
        segs, _ = WhisperModel(model, device='cpu', compute_type='int8').transcribe(
            np.frombuffer(pcm, np.float32), language=lang, word_timestamps=True, initial_prompt=text[:200])
        rec = [(norm(x.word), x.start, x.end) for s in segs for x in s.words if norm(x.word)]
        ts = [None] * len(words)
        sm = difflib.SequenceMatcher(a=[norm(w['w']) for w in words], b=[r[0] for r in rec], autojunk=False)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size): ts[blk.a + k] = (rec[blk.b + k][1], rec[blk.b + k][2])
        hit = sum(t is not None for t in ts) / len(words)
        if hit < 0.5: raise RuntimeError(f'só {hit:.0%} das palavras reconhecidas')
        ts = fill_gaps(ts, total); method = f'whisper ({hit:.0%} reconhecidas)'
    except Exception as e:
        print(f'ℹ️  whisper indisponível ({e}); alinhando pela energia do áudio')
        r = subprocess.run(['ffmpeg', '-hide_banner', '-i', voice_mp3, '-af', 'silencedetect=n=-38dB:d=0.18', '-f', 'null', '-'],
                           capture_output=True, text=True).stderr
        ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r)]
        se = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r)]
        speech, cur = [], 0.0                                # trechos com fala
        for a, b in zip(ss, se + [total] * (len(ss) - len(se))):
            if a > cur + 0.05: speech.append((cur, a))
            cur = b
        if total > cur + 0.05: speech.append((cur, total))
        spt = sum(b - a for a, b in speech) or total
        w8 = [len(w['w']) + 2 for w in words]; acc = 0.0; ts = []
        def at(x):                                           # tempo "só de fala" → tempo real
            for a, b in speech:
                if x <= b - a: return a + x
                x -= b - a
            return total
        for k in w8:
            a = acc; acc += spt * k / sum(w8); ts.append((at(a), at(acc)))
        method = 'energia (aproximado)'

# ---------- 2c. sem voz: estimativa ----------
if estimate:
    per = 60.0 / wpm; t = 0.0; ts = []
    for i, w in enumerate(words):
        d = per * (0.55 + 0.45 * min(2.2, len(w['w']) / 5))
        ts.append((t, t + d)); t += d
        if re.search(r'[.!?…]$', w['w']): t += 0.35
        elif re.search(r'[,;:]$', w['w']): t += 0.15
        if i in pause_after: t += 0.4
    method = f'estimativa ({wpm:g} palavras/min)'; voice_mp3 = None

# ---------- 3. grava ----------
for w, (a, b) in zip(words, ts): w['t0'] = round(a + lead, 3); w['t1'] = round(max(b, a + 0.05) + lead, 3)
total = (dur_of(voice_mp3) if voice_mp3 else words[-1]['t1'] - lead) + lead
res = {'method': method, 'lead': lead, 'dur': round(total, 3), 'audio': os.path.basename(voice_mp3) if voice_mp3 else None,
       'words': words, 'marks': marks}
dst = os.path.join(out, 'words.json'); json.dump(res, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(f'✅ {len(words)} palavras · {len(marks)} marcadores · {total:.1f}s · {method} → {dst}')
for k, i in marks.items(): print(f'   [{k}] {words[i]["t0"]:.2f}s  "{" ".join(w["w"] for w in words[i:i+5])}…"')
