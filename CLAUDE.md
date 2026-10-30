# Treino — contexto do projeto

App pessoal de controle de treinos (exercícios, séries, kg, repetições) para o iPhone do usuário. Inspirado no gênero de apps como o Hevy, mas com nome, ícone e visual próprios — não copiar marca nem UI de app existente.

## Por que PWA
O usuário usa Windows (sem Mac/Xcode) e não quer publicar na App Store. Opções avaliadas:
- App nativo Swift: exige Mac; com Apple ID grátis expira a cada 7 dias; conta paga US$ 99/ano.
- Expo Go: só roda com servidor de dev ligado.
- **PWA (escolhido):** instalado via Safari > Compartilhar > "Adicionar à Tela de Início". Sem conta Apple, não expira.

## Hospedagem
- Repositório público: https://github.com/contatoguilhermebackes-ctrl/treino (público é exigência do Pages grátis; só o código fica visível).
- GitHub Pages, branch `main`, raiz `/`: https://contatoguilhermebackes-ctrl.github.io/treino/
- Deploy = `git push`; Pages atualiza em ~1 min.
- `gh` instalado em `C:\Program Files\GitHub CLI\gh.exe`, já autenticado. Criar repositório público pelo Claude foi bloqueado pelo classificador de permissões; o usuário rodou os comandos manualmente.

## Arquivos
- `index.html` — shell, CSS inline (tema escuro, safe-area do iPhone, inputs 16px para evitar zoom no iOS).
- `app.js` — telas (`inicio`, `historico`, `treino`, `escolher`, `rotina`, `progresso`, `detalhe`), ações por delegação de eventos (`data-acao`), estado em `localStorage` na chave `treino-v1` (`treinos`, `atual`, `custom`, `rotinas`, `descanso`). `carregar()` mescla com `novo()`, então campos novos ganham padrão sem migração.
- `logic.js` — regras puras: `EXERCICIOS`, `novaSerie`, `treinoDaRotina`, `exerciciosFeitos`, `historicoExercicio`, `volume`, `seriesAnteriores`, `finalizar`.
- `test.js` — testes com `node:assert`; rodar `node test.js` (espera `ok`).
- `sw.js` — service worker: responde do cache e atualiza em segundo plano. Ao adicionar arquivos, incluir em `ARQUIVOS`; trocar `CACHE` se precisar forçar atualização.
- `manifest.webmanifest`, `icon-180.png`, `icon-512.png` (ícone de halter gerado via System.Drawing).

## Comportamento
- Tela inicial: escolher rotina para começar, criar/editar rotinas, treino livre, botões Histórico e Progresso.
- Rotina = nome + exercícios com nº de séries; começar uma rotina gera o treino com séries vazias.
- Treino ativo com cronômetro; exercícios da lista padrão ou criados pelo usuário (`estado.custom`).
- Coluna "Anterior" mostra a série do último treino com o mesmo exercício; marcar ✓ com campo vazio copia o valor anterior.
- Marcar ✓ inicia o timer de descanso (barra fixa embaixo, padrão 90s). ±15s ajusta o timer atual e também vira o novo padrão (`estado.descanso`, mínimo 15s). Bip via Web Audio ao zerar.
- × apaga uma série (pede confirmação se tiver valores).
- Finalizar salva só séries marcadas como feitas.
- Histórico com rotina, duração e volume; apagar treino; backup (exportar via share sheet no iOS / importar JSON).
- Progresso: por exercício, gráficos SVG de carga máxima e volume por treino, e recorde.

## Limitações conhecidas
- Dados só no aparelho; apagar o app da tela de início apaga os dados — exportar backup.
- Atualização aparece no iPhone só na segunda abertura após o push (cache do service worker).
- Bip do descanso só toca com o app aberto na tela (sem push server não há notificação com tela bloqueada) e pode ser silenciado pela chave de silencioso do iPhone.
- Não testado em iPhone real ainda; telas conferidas por screenshot no Edge headless (390×844).

## Fora do escopo por enquanto
Reordenar exercícios na rotina, descanso por exercício, salvar treino livre como rotina.
