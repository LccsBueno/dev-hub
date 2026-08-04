# 🗂️ DevHub

> Um hub desktop para listar, rodar, monitorar e organizar todos os seus projetos locais em um só lugar.

---

## 🚀 Sobre o projeto

DevHub é uma aplicação desktop (Electron) que escaneia pastas raiz configuradas, descobre seus projetos automaticamente e centraliza as tarefas do dia a dia de um dev: rodar/parar o projeto, abrir no editor ou terminal, inspecionar Git, gerenciar containers Docker e até esboçar a arquitetura do sistema em um canvas. Ideal para quem tem dezenas de repositórios locais e quer parar de caçar pastas e comandos espalhados.

---

## 🏗️ Arquitetura

O projeto segue a separação padrão do Electron entre **processo principal** e **renderer**. O processo principal (`electron/`) concentra toda a lógica sensível — acesso ao sistema de arquivos, spawn de processos, Docker e Git — e expõe essas operações ao renderer via IPC (`ipcMain.handle`/`preload.ts`), mantendo `contextIsolation` ativado e `nodeIntegration` desativado. O renderer (`src/`) é uma SPA em React responsável só pela interface, consumindo a API exposta em `window` (tipada em `src/api.d.ts`) através de hooks (`src/hooks/`).

**Camadas / módulos principais:**

| Camada | Responsabilidade |
|---|---|
| `electron/main.ts` | Bootstrap da janela e registro de todos os canais IPC |
| `electron/scanner.ts`, `configStore.ts` | Descoberta de projetos nas pastas raiz e persistência de configuração |
| `electron/processManager.ts` | Spawn, log e status de processos rodando por projeto |
| `electron/docker.ts`, `dockerInspect.ts` | Start/stop/restart de containers e leitura de mounts |
| `electron/gitInfo.ts` | Leitura de branches, histórico e checkout de refs |
| `src/hooks/` | Estado da aplicação no renderer (projetos, status de processo) |
| `src/components/` | UI (grid de projetos, painel de detalhe com abas de Info/Docker/Git/Logs/Notas/Arquitetura) |
| `src/lib/` | Lógica pura e reutilizável (templates de Dockerfile/compose, cores, filtros, grafo de git) |

> 💡 Toda operação que toca o sistema de arquivos ou processos externos passa por `isKnownProjectPath` no main process — o renderer nunca acessa caminhos arbitrários, só projetos já conhecidos pela configuração.

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Função |
|---|---|---|
| Electron | ^43 | Runtime desktop (main + renderer) |
| electron-vite | ^5 | Build e dev server integrados ao Electron |
| React | ^19 | UI do renderer |
| TypeScript | ^7 | Tipagem em todo o projeto |
| Tailwind CSS | ^4 | Estilização |
| Vite | ^7 | Bundler do renderer |
| Vitest | ^4 | Testes unitários |
| @monaco-editor/react | ^4 | Edição de Dockerfile / docker-compose.yml na UI |
| @excalidraw/excalidraw | ^0.18 | Canvas de arquitetura por projeto |
| gsap | ^3 | Animações |
| marked | ^18 | Renderização de README/Markdown |
| electron-builder | ^26 | Empacotamento da aplicação (`npm run dist`) |

> Integra também com **Docker** (start/stop/restart de containers, leitura de `docker-compose.yml`) e **Git** (histórico, branches, checkout) via CLI local — não requer serviços externos.

---

## ⚙️ Pré-requisitos

Antes de começar, você precisa ter instalado:

- 🟢 Node.js
- 🐳 Docker (opcional, apenas para usar os recursos de container)
- 🔧 Git (opcional, apenas para os recursos de Git)

---

## 🏃 Como inicializar

```bash
# Clone o repositório
git clone https://github.com/LccsBueno/dev-hub.git
cd devhub

# Instale as dependências
npm install

# Rode em modo desenvolvimento
npm run dev
```

Outros comandos disponíveis:

```bash
npm run build   # build de produção (electron-vite build)
npm run dist    # empacota a aplicação com electron-builder
npm run test    # roda a suíte de testes (vitest)
```

---

## 📁 Estrutura do projeto (resumo)

```
devhub/
├── electron/          # Processo principal (IPC, scanner, docker, git, processos)
├── src/
│   ├── components/    # UI (ProjectDetail, Docker, etc.)
│   ├── hooks/         # Hooks de estado do renderer
│   └── lib/           # Lógica pura (templates, filtros, cores)
├── tests/             # Testes unitários (vitest)
└── docs/              # Specs e planos de design
```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
