# Variantes por agente

A jsmotion segue o padrão aberto **Agent Skills** (`SKILL.md`). Cada pasta aqui é uma skill completa, pronta para
instalar, com o mesmo fluxo e os mesmos scripts da versão principal (a raiz do repositório, feita para o Claude).

| Pasta | Para | O que muda em relação à versão Claude |
|---|---|---|
| [`codex/jsmotion`](codex/jsmotion) | OpenAI Codex (CLI, IDE, app) | perguntas numeradas (pare e espere) · `view_image` · aviso de rede do sandbox · `agents/openai.yaml` com nome e descrição para o app |
| [`gemini/jsmotion`](gemini/jsmotion) | Gemini CLI | `ask_user` (tipo `choice`) · `read_file` para imagens · `run_shell_command` em segundo plano no render |
| [`hermes/jsmotion`](hermes/jsmotion) | Hermes Agent (Nous Research) | frontmatter do Hermes (versão, autor, `platforms`, `category: creative`) · `${HERMES_SKILL_DIR}` · `clarify` · `vision_analyze` · entrega de mídia pelo gateway (Telegram, Discord…) |
| [`openclaw/jsmotion`](openclaw/jsmotion) | OpenClaw | `metadata.openclaw` (emoji, `os`, `requires.bins`) · caminho real da skill (o OpenClaw não troca variáveis) · `image` · `exec` · entrega com a ferramenta `message` / `MEDIA:` · versão leve se o canal recusar o tamanho |
| [`universal/jsmotion`](universal/jsmotion) | Cursor, GitHub Copilot, OpenCode e qualquer agente compatível | instruções neutras + tabela de ferramentas de todos os agentes |

Toda variante traz a **tabela de ferramentas de todos os agentes**. Assim a skill continua funcionando se outro
agente ler a mesma pasta (por exemplo, `~/.agents/skills` é lida pelo Codex, pelo Gemini CLI, pelo Copilot e pelo OpenClaw — onde tem prioridade).

## Instalar
```bash
./install.sh <claude|codex|gemini|hermes|openclaw|cursor|copilot|universal> [--project [PASTA]]
```
Detalhes de cada agente (instalação nativa, uso e cuidados) estão no [README principal](../README.md#-em-qualquer-agente).

## Como foi verificado
- **Descoberta** testada nos agentes reais: Codex CLI 0.157 (`skills/list`), Gemini CLI 0.61 (`gemini skills list` e
  `gemini skills install`), Hermes Agent (`hermes skills list`, com `${HERMES_SKILL_DIR}` trocado pelo caminho real) e
  OpenClaw 2026.6 (`openclaw skills info jsmotion` → `🎬 jsmotion ✓ Ready`; `openclaw skills install <pasta> --global`).
- **Frontmatter**: Codex, Gemini, OpenClaw e universal passam no validador oficial (`agentskills validate`, do `skills-ref`).
  O Hermes usa o formato próprio, igual ao dos skills oficiais dele.
- **Segurança**: as 5 variantes passam como `SAFE` no scanner do Hermes (`skills_guard`), que bloqueia skills da
  comunidade com veredito "caution".

## Para quem mantém
**Não edite estas pastas à mão.** Elas são geradas a partir da raiz (`SKILL.md`, `scripts/`, `templates/`,
`references/`) por:
```bash
python3 tools/build_agents.py          # regenera agents/ e dist/jsmotion-<agente>.zip
python3 tools/build_agents.py --check  # confere se agents/ está em dia (e valida com agentskills, se instalado)
```
As diferenças de cada agente ficam no próprio `tools/build_agents.py` (`AGENTS`, `SWAPS`, `frontmatter`).
