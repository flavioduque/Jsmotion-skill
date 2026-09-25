"""Gera as variantes da skill para outros agentes a partir do SKILL.md principal (versão Claude).

Uso:
  python3 tools/build_agents.py          # (re)gera agents/<agente>/jsmotion/ e dist/jsmotion-<agente>.zip
  python3 tools/build_agents.py --check  # só confere se agents/ está em dia (use antes de commitar)

Fonte única: SKILL.md + scripts/ + templates/ + references/. Nunca edite agents/ à mão — edite a raiz e rode este script.
Cada variante = mesmo fluxo, com: frontmatter do agente, bloco "Neste agente" (ferramentas, pasta, rede)
e a tabela de ferramentas de todos os agentes (assim a skill funciona mesmo se outro agente ler a pasta).
"""
import os, re, sys, shutil, zipfile, filecmp, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = ['scripts', 'templates', 'references']          # recursos copiados em toda variante
VERSION = '1.1.0'

DESC = ('Creates studio-quality motion-design videos in JavaScript (canvas + Web Audio): company, brand, product '
        'and app promos, launches, Reels/TikTok/Shorts/YouTube/LinkedIn. Delivers ready MP4s (9:16, 1:1, 4:5 and 16:9 '
        'from the same code) with a soundtrack mastered to -14 LUFS, plus an .html with a "Download MP4" button. '
        'Studies a reference video and the brand website (colors, projects, images), asks a few multiple-choice '
        'questions, shows the script, then produces and reviews it. Use whenever the user asks for an animated or '
        'motion video, a video of their company/brand/app, a video with their logo, a Reels/TikTok video, "jsmotion", '
        'or attaches a reference video asking for something similar. PT: vídeo animado, motion, vídeo da minha '
        'empresa/marca/app, vídeo para Reels/TikTok, vídeo com minha logo.')
assert len(DESC) <= 1024, len(DESC)   # limite do padrão Agent Skills

TOOLS = """## Ferramentas por agente

Os passos abaixo falam em "perguntar com opções", "ver a imagem" e "entregar". Use a ferramenta do seu agente:

| Ação | Claude | Codex | Gemini CLI | Hermes Agent | OpenClaw | Cursor · Copilot · outros |
|---|---|---|---|---|---|---|
| Perguntar com opções | `ask_user_input_v0` / `AskUserQuestion` | pergunta com opções numeradas; pare e espere | `ask_user` (tipo `choice`) | `clarify` | mensagem com opções numeradas; espere | ferramenta de perguntas, se houver; senão numeradas |
| Ver imagem (folhas de revisão) | `view` / `Read` | `view_image` | `read_file` | `vision_analyze` | `image` | leitura de arquivo (modelo com visão) |
| Rodar comandos | `bash` | shell | `run_shell_command` | `terminal` | `exec` | terminal |
| Entregar arquivos | `present_files` | caminhos absolutos na resposta final | caminhos absolutos | caminho absoluto sozinho na linha | `message` com `media`/`filePath` (ou linha `MEDIA:/caminho`) | caminhos absolutos |

Se o seu modelo não enxerga imagens, peça ao usuário para abrir `$WORK/review.jpg` e dizer se algo está errado.
"""

AGENTS = {
    'codex': dict(
        title='Codex (CLI, IDE e app)',
        sk='a pasta desta SKILL.md — o Codex mostra o caminho na lista de skills (ex.: `~/.agents/skills/jsmotion`). '
           'Rode `export SK=<pasta>` no primeiro comando',
        extra="""- **Perguntas**: o Codex não tem botões de opção. Escreva **uma** pergunta com as opções numeradas, a sua
  recomendação e "Não sei, escolha por mim" — e **termine a sua vez** esperando a resposta.
- **Imagens**: `view_image` com o caminho do .jpg (folhas de contato e revisão).
- **Rede**: o sandbox padrão do Codex bloqueia a internet. Os passos 0 e 1 (instalar dependências, baixar a
  referência, ler o site) precisam dela: quando o Codex pedir aprovação, explique ao usuário o motivo e
  peça para aprovar (ou para ele liberar o acesso à rede do sandbox nas configurações do Codex).
- **Render longo**: o `pack.py` leva minutos. Se o comando tiver limite de tempo, rode em segundo plano
  (`nohup python3 … > $WORK/pack.log 2>&1 &`) e acompanhe o log até aparecer `total:`.
- **Entregar**: termine com a lista de arquivos (caminhos absolutos em `$OUT`), MP4 principal primeiro."""),
    'gemini': dict(
        title='Gemini CLI',
        sk='a pasta desta skill — o Gemini mostra o caminho ao ativá-la (ex.: `~/.gemini/skills/jsmotion`). '
           'Rode `export SK=<pasta>` no primeiro comando',
        extra="""- **Perguntas**: `ask_user` com uma pergunta do tipo `choice` por vez (3 opções + "Não sei, escolha por mim";
  cabeçalho curto, até 16 caracteres, ex.: "Formato").
- **Imagens**: `read_file` no .jpg (folhas de contato e revisão).
- **Comandos**: `run_shell_command`. Para o `pack.py` (leva minutos), rode em segundo plano e acompanhe o log
  (`nohup python3 … > $WORK/pack.log 2>&1 &`) até aparecer `total:`.
- **Permissões**: o Gemini pede confirmação ao ativar a skill e ao rodar comandos; explique ao usuário que a
  skill instala ffmpeg/Playwright e baixa o vídeo de referência.
- **Entregar**: termine com a lista de arquivos (caminhos absolutos em `$OUT`), MP4 principal primeiro."""),
    'hermes': dict(
        title='Hermes Agent (Nous Research)',
        sk='`${HERMES_SKILL_DIR}` (o Hermes substitui pelo caminho real). Rode `export SK=${HERMES_SKILL_DIR}` no '
           'primeiro comando',
        extra="""- **Perguntas**: `clarify` com uma pergunta por vez — 3 opções + "Não sei, escolha por mim" (o Hermes já
  oferece "Outro" para resposta livre).
- **Imagens**: `vision_analyze` no .jpg (folhas de contato e revisão).
- **Comandos**: `terminal`. O `pack.py` leva minutos; se precisar, rode em segundo plano e acompanhe o log.
- **Entregar**: escreva o caminho absoluto de cada arquivo **sozinho numa linha** — o gateway (Telegram, Discord,
  WhatsApp, Slack…) envia como mídia. Para mandar o MP4 como arquivo, sem recompressão do app, use `[[as_document]]`.
- **Mensageiros**: o usuário pode estar no celular — mensagens curtas, uma pergunta por vez, e mande primeiro o
  MP4 do formato principal."""),
    'openclaw': dict(
        title='OpenClaw',
        sk='a pasta desta SKILL.md — o OpenClaw mostra o caminho em `<location>` na lista de skills (ex.: '
           '`~/.openclaw/skills/jsmotion/SKILL.md` → pasta `~/.openclaw/skills/jsmotion`). Rode `export SK=<pasta>` com o '
           'caminho real no primeiro comando (o OpenClaw não troca variáveis no texto da skill)',
        extra="""- **Onde o usuário está**: normalmente num mensageiro (WhatsApp, Telegram, Discord, Slack…). Mensagens curtas,
  **uma pergunta por mensagem**, com as opções numeradas, a sua recomendação e "Não sei, escolha por mim"; espere a resposta.
- **Logo e referência**: o usuário manda pelo chat; use o arquivo recebido (caminho da mídia) no Passo 1.
- **Imagens**: ferramenta `image` no .jpg (folhas de contato e revisão).
- **Comandos**: ferramenta `exec`. O `pack.py` leva minutos: avise o usuário do tempo e, se precisar, rode em
  segundo plano (`nohup python3 … > $WORK/pack.log 2>&1 &`) e acompanhe o log até aparecer `total:`.
- **Entregar**: ferramenta `message` com `media`/`filePath` apontando para o MP4 (ou uma linha `MEDIA:/caminho/absoluto`).
  Mande primeiro o MP4 do formato principal. Para o app não recomprimir o vídeo, envie como documento se o canal permitir.
- **Tamanho**: se o canal recusar o arquivo pelo tamanho, gere uma versão leve e mande essa:
  `ffmpeg -i x.mp4 -c:v libx264 -crf 24 -preset slow -c:a copy x_leve.mp4`."""),
    'universal': dict(
        title='Cursor, GitHub Copilot, OpenCode e outros (padrão Agent Skills)',
        sk='a pasta desta SKILL.md (ex.: `~/.agents/skills/jsmotion`, `~/.cursor/skills/jsmotion`, '
           '`~/.copilot/skills/jsmotion`). Rode `export SK=<pasta>` no primeiro comando',
        extra="""- **Perguntas**: use a ferramenta de perguntas do agente, se existir; senão escreva **uma** pergunta com opções
  numeradas e espere a resposta.
- **Imagens**: abra os .jpg de revisão com a ferramenta de leitura de arquivos (o modelo precisa ter visão).
- **Render longo**: o `pack.py` leva minutos; se o terminal do agente tiver limite de tempo, rode em segundo plano
  (`nohup python3 … > $WORK/pack.log 2>&1 &`) e acompanhe o log até aparecer `total:`.
- **Entregar**: termine com a lista de arquivos (caminhos absolutos em `$OUT`), MP4 principal primeiro."""),
}

# frases do SKILL.md (Claude) trocadas por instruções neutras — se o SKILL.md mudar, o assert avisa
SWAPS = [
    ("Arquivos da skill (caminho = pasta desta SKILL.md, abaixo `$SK`):",
     "Arquivos da skill (abaixo `$SK` — ver \"Neste agente\"):"),
    ("e use `view` em `$WORK/ref/sheet.jpg`.", "e abra `$WORK/ref/sheet.jpg` com a ferramenta de imagem."),
    ("e veja com `view`.", "e veja com a ferramenta de imagem."),
    ("Use a ferramenta de opções tocáveis (`ask_user_input_v0`) quando existir; senão, texto numerado.",
     "Use a ferramenta de perguntas com opções do seu agente (ver \"Ferramentas por agente\"); senão, texto numerado."),
    ("Veja as folhas com `view`.", "Abra as folhas com a ferramenta de imagem."),
    ("Entregue com `present_files` (MP4 do formato principal primeiro, depois os outros MP4, depois os .html).",
     "Entregue os arquivos (ver \"Ferramentas por agente\"): MP4 do formato principal primeiro, depois os outros MP4, depois os .html."),
]

def frontmatter(agent):
    q = DESC.replace('"', '\\"')
    if agent == 'hermes':   # formato dos skills oficiais do Hermes (ex.: optional-skills/creative/ai-presenter-video)
        return f'''---
name: jsmotion
description: "{q}"
version: {VERSION}
author: Flavio Duque (https://github.com/flavioduque/Jsmotion-skill)
license: MIT
platforms: [linux, macos]
required_commands: [python3, git]
metadata:
  hermes:
    tags: [video, motion-design, animation, marketing, social-media, javascript]
    category: creative
    homepage: https://github.com/flavioduque/Jsmotion-skill
---'''
    if agent == 'openclaw':  # metadata.openclaw: dependências e UI (docs.openclaw.ai/clawhub/skill-format)
        return f'''---
name: jsmotion
description: "{q}"
license: MIT
metadata:
  openclaw:
    emoji: "🎬"
    homepage: https://github.com/flavioduque/Jsmotion-skill
    os:
      - linux
      - darwin
    requires:
      bins:
        - python3
        - git
---'''
    return f'---\nname: jsmotion\ndescription: "{q}"\nlicense: MIT\nmetadata:\n  version: "{VERSION}"\n  author: Flavio Duque\n---'

def variant(agent):
    src = open(os.path.join(ROOT, 'SKILL.md')).read()
    body = src.split('---', 2)[2].lstrip('\n')          # tira o frontmatter do Claude
    for a, b in SWAPS:
        assert a in body, f'frase não encontrada no SKILL.md (atualize SWAPS): {a[:60]}'
        body = body.replace(a, b)
    a = AGENTS[agent]
    block = (f"## Neste agente: {a['title']}\n\n"
             f"- **`$SK`** = {a['sk']}.\n{a['extra']}\n"
             f"- **Idioma**: converse no idioma do usuário; estas instruções estão em português.\n\n{TOOLS}\n---\n\n")
    first = body.index('\n## ')                          # insere antes do "Passo 0"
    body = body[:first + 1] + block + body[first + 1:]
    note = f'<!-- GERADO por tools/build_agents.py a partir do SKILL.md — não edite aqui. -->\n'
    return frontmatter(agent) + '\n' + note + '\n' + body

OPENAI_YAML = '''interface:
  display_name: "jsmotion — motion video"
  short_description: "Studio-quality brand videos in JS: MP4 in 9:16, 1:1 and 16:9"
  default_prompt: "Use $jsmotion to make a motion-design video of my brand. I will attach my logo and give you my website."
'''

def build(dst_root):
    for agent in AGENTS:
        d = os.path.join(dst_root, agent, 'jsmotion')
        shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
        open(os.path.join(d, 'SKILL.md'), 'w').write(variant(agent))
        for r in RES:
            shutil.copytree(os.path.join(ROOT, r), os.path.join(d, r), ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        if agent == 'codex':
            os.makedirs(os.path.join(d, 'agents')); open(os.path.join(d, 'agents', 'openai.yaml'), 'w').write(OPENAI_YAML)

def same_tree(a, b):
    c = filecmp.dircmp(a, b)
    if c.left_only or c.right_only or c.diff_files or c.funny_files: return False
    _, mism, err = filecmp.cmpfiles(a, b, c.common_files, shallow=False)
    return not mism and not err and all(same_tree(os.path.join(a, s), os.path.join(b, s)) for s in c.common_dirs)

def zipdir(src, zpath):
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for base, _, files in sorted(os.walk(src)):
            for f in sorted(files):
                p = os.path.join(base, f); z.write(p, os.path.relpath(p, os.path.dirname(src)))

if __name__ == '__main__':
    agents_dir = os.path.join(ROOT, 'agents')
    if '--check' in sys.argv:
        tmp = tempfile.mkdtemp(); build(tmp)
        bad = [a for a in AGENTS if not os.path.isdir(os.path.join(agents_dir, a, 'jsmotion'))
               or not same_tree(os.path.join(tmp, a, 'jsmotion'), os.path.join(agents_dir, a, 'jsmotion'))]
        shutil.rmtree(tmp)
        if bad: sys.exit(f'agents/ desatualizado: {bad} — rode python3 tools/build_agents.py')
        if shutil.which('agentskills'):   # validador oficial do padrão (pip install skills-ref); Hermes usa o formato próprio
            import subprocess
            for a in AGENTS:
                if a == 'hermes': continue
                r = subprocess.run(['agentskills', 'validate', os.path.join(agents_dir, a, 'jsmotion')], capture_output=True, text=True)
                if r.returncode: sys.exit(f'{a}: {r.stdout}{r.stderr}')
        print('agents/ em dia ✅'); sys.exit(0)
    build(agents_dir)
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    for a in AGENTS:
        z = os.path.join(ROOT, 'dist', f'jsmotion-{a}.zip'); zipdir(os.path.join(agents_dir, a, 'jsmotion'), z)
        print(f'agents/{a}/jsmotion  ·  dist/jsmotion-{a}.zip ({os.path.getsize(z)/1e3:.0f} KB)')
