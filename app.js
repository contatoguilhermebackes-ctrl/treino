import {
  EXERCICIOS, novaSerie, treinoDaRotina, exerciciosFeitos, historicoExercicio, volume, seriesAnteriores, finalizar,
} from './logic.js';

const CHAVE = 'treino-v1';
const app = document.getElementById('app');
let estado = carregar();
let tela = { nome: estado.atual ? 'treino' : 'inicio' };
let rascunho = null; // rotina sendo editada; só vai para o estado ao salvar
let audio = null;

function novo() { return { treinos: [], atual: null, custom: [], rotinas: [], descanso: 90 }; }
function carregar() {
  try { return { ...novo(), ...JSON.parse(localStorage.getItem(CHAVE)) }; } catch { return novo(); }
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
  catch { alert('Não foi possível salvar. Exporte um backup.'); }
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const norm = s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const data = ms => new Date(ms).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const dataCurta = ms => new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const kg = n => `${n.toLocaleString('pt-BR')} kg`;
const duracao = ms => { const m = Math.floor(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`; };
const p2 = n => String(n).padStart(2, '0');
const relogio = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 3600)}:${p2(Math.floor(s / 60) % 60)}:${p2(s % 60)}`; };
const regressivo = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${p2(s % 60)}`; };

function bip() {
  if (!audio) return;
  const o = audio.createOscillator(), g = audio.createGain();
  o.frequency.value = 880; g.gain.value = 0.3;
  o.connect(g).connect(audio.destination);
  o.start(); o.stop(audio.currentTime + 0.5);
}

function grafico(pontos, campo) {
  if (pontos.length < 2) return '<p class="vazio">Faça pelo menos 2 treinos com este exercício para ver o gráfico.</p>';
  const W = 320, H = 150, P = 20, PB = 34; // PB: margem de baixo para rótulos de mínimo e datas
  const vals = pontos.map(p => p[campo]), min = Math.min(...vals), max = Math.max(...vals);
  const x = i => P + i * (W - 2 * P) / (pontos.length - 1);
  const y = v => max === min ? H / 2 : H - PB - (v - min) / (max - min) * (H - PB - P);
  const linha = pontos.map((p, i) => `${x(i)},${y(p[campo])}`).join(' ');
  return `<svg class="grafico" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mínimo ${min}, máximo ${max}">
    <polyline points="${linha}" fill="none" stroke="var(--destaque)" stroke-width="2"/>
    ${pontos.map((p, i) => `<circle cx="${x(i)}" cy="${y(p[campo])}" r="3" fill="var(--destaque)"/>`).join('')}
    <text x="${P}" y="12">${max.toLocaleString('pt-BR')}</text>
    <text x="${P}" y="${H - PB + 14}">${min.toLocaleString('pt-BR')}</text>
    <text x="${P}" y="${H - 2}">${dataCurta(pontos[0].data)}</text>
    <text x="${W - P}" y="${H - 2}" text-anchor="end">${dataCurta(pontos.at(-1).data)}</text>
  </svg>`;
}

const telas = {
  inicio() {
    const rotinas = estado.rotinas.map((r, i) => `
      <div class="card rotina">
        <button class="corpo" data-acao="usar-rotina" data-i="${i}">
          <b>${esc(r.nome)}</b><span>${r.exercicios.map(e => esc(e.nome)).join(', ')}</span></button>
        <button class="link" data-acao="editar-rotina" data-i="${i}">Editar</button>
      </div>`).join('');
    return `
      <header><span></span><h1>Treinos</h1><span></span></header>
      ${estado.atual ? '<button class="primario" data-acao="continuar">Continuar treino em andamento</button>' : ''}
      <h2>Escolha a rotina</h2>
      ${rotinas || '<p class="vazio">Nenhuma rotina ainda. Crie uma para começar.</p>'}
      <button class="secundario" data-acao="nova-rotina">+ Nova rotina</button>
      <button class="link centro" data-acao="iniciar">Treino livre (sem rotina)</button>
      <div class="linha">
        <button class="secundario" data-acao="historico">Histórico</button>
        <button class="secundario" data-acao="progresso">Progresso</button>
      </div>`;
  },

  historico() {
    const lista = estado.treinos.map((t, i) => `
      <button class="card" data-acao="abrir" data-i="${i}">
        <b>${esc(t.rotina || 'Treino livre')} · ${data(t.inicio)}</b>
        <span>${duracao(t.fim - t.inicio)} · ${t.exercicios.length} exercícios · ${kg(volume(t))}</span>
      </button>`).reverse().join('');
    return `
      <header><button class="link" data-acao="voltar">‹ Início</button><h1>Histórico</h1><span></span></header>
      ${lista || '<p class="vazio">Nenhum treino ainda.</p>'}
      <div class="linha">
        <button class="secundario" data-acao="exportar">Exportar backup</button>
        <button class="secundario" data-acao="importar">Importar backup</button>
        <input id="arquivo" type="file" accept="application/json,.json" hidden>
      </div>`;
  },

  treino() {
    const a = estado.atual;
    const blocos = a.exercicios.map((ex, ei) => {
      const ant = seriesAnteriores(estado.treinos, ex.nome);
      const linhas = ex.series.map((s, si) => {
        const p = ant[si];
        return `<tr class="${s.feita ? 'feita' : ''}">
          <td>${si + 1}</td>
          <td class="ant">${p ? `${esc(p.kg)}×${esc(p.reps)}` : '—'}</td>
          <td><input inputmode="decimal" data-ei="${ei}" data-si="${si}" data-campo="kg" value="${esc(s.kg)}" placeholder="${p ? esc(p.kg) : 'kg'}"></td>
          <td><input inputmode="numeric" data-ei="${ei}" data-si="${si}" data-campo="reps" value="${esc(s.reps)}" placeholder="${p ? esc(p.reps) : 'reps'}"></td>
          <td><button class="check" data-acao="feita" data-ei="${ei}" data-si="${si}" aria-label="Série feita">✓</button></td>
          <td><button class="x" data-acao="apagar-serie" data-ei="${ei}" data-si="${si}" aria-label="Apagar série">×</button></td>
        </tr>`;
      }).join('');
      return `<section class="ex">
        <div class="ex-topo"><h3>${esc(ex.nome)}</h3>
          <button class="link perigo" data-acao="remover-ex" data-ei="${ei}">Remover</button></div>
        <table><thead><tr><th>Série</th><th>Anterior</th><th>kg</th><th>Reps</th><th></th><th></th></tr></thead>
        <tbody>${linhas}</tbody></table>
        <button class="secundario" data-acao="add-serie" data-ei="${ei}">+ Série</button>
      </section>`;
    }).join('');
    const resta = (a.descansoFim || 0) - Date.now();
    return `
      <header><button class="link" data-acao="voltar">‹ Início</button>
        <span id="cronometro">${relogio(Date.now() - a.inicio)}</span>
        <button class="link destaque" data-acao="concluir">Finalizar</button></header>
      ${a.rotina ? `<h2>${esc(a.rotina)}</h2>` : ''}
      ${blocos}
      <button class="primario" data-acao="escolher">+ Exercício</button>
      <button class="link perigo centro" data-acao="descartar">Descartar treino</button>
      ${resta > 0 ? `<div id="descanso">
        <span>Descanso <b id="descanso-tempo">${regressivo(resta)}</b></span>
        <button data-acao="descanso" data-d="-15">−15s</button>
        <button data-acao="descanso" data-d="15">+15s</button>
        <button data-acao="descanso" data-d="0">Pular</button>
      </div>` : ''}`;
  },

  escolher() {
    return `
      <header><button class="link" data-acao="voltar-escolher">‹ Voltar</button><h1>Exercício</h1><span></span></header>
      <input id="busca" class="campo" type="search" placeholder="Buscar ou criar…" autocomplete="off">
      <div id="lista">${listaExercicios('')}</div>`;
  },

  rotina() {
    const r = rascunho;
    return `
      <header><button class="link" data-acao="voltar">‹ Cancelar</button><h1>Rotina</h1>
        <button class="link destaque" data-acao="salvar-rotina">Salvar</button></header>
      <input id="nome-rotina" class="campo" placeholder="Nome (ex.: Treino A – Peito)" value="${esc(r.nome)}">
      ${r.exercicios.map((ex, ei) => `
        <div class="ex ex-topo">
          <h3>${esc(ex.nome)}</h3>
          <span class="contador">
            <button data-acao="series" data-ei="${ei}" data-d="-1" aria-label="Menos séries">−</button>
            ${ex.series} séries
            <button data-acao="series" data-ei="${ei}" data-d="1" aria-label="Mais séries">+</button>
            <button class="x" data-acao="remover-ex-rotina" data-ei="${ei}" aria-label="Remover">×</button>
          </span>
        </div>`).join('')}
      <button class="primario" data-acao="escolher-rotina">+ Exercício</button>
      ${r.i != null ? '<button class="link perigo centro" data-acao="apagar-rotina">Apagar rotina</button>' : ''}`;
  },

  progresso() {
    const nomes = exerciciosFeitos(estado.treinos);
    const topo = '<header><button class="link" data-acao="voltar">‹ Início</button><h1>Progresso</h1><span></span></header>';
    if (!nomes.length) return `${topo}<p class="vazio">Finalize um treino para ver seu progresso.</p>`;
    const nome = nomes.includes(tela.ex) ? tela.ex : nomes[0];
    const pontos = historicoExercicio(estado.treinos, nome);
    return `${topo}
      <select id="ex-progresso" class="campo">
        ${nomes.map(n => `<option value="${esc(n)}" ${n === nome ? 'selected' : ''}>${esc(n)}</option>`).join('')}
      </select>
      <p class="resumo">Recorde: ${kg(Math.max(...pontos.map(p => p.carga)))} · ${pontos.length} treinos</p>
      <h2>Carga máxima (kg)</h2>${grafico(pontos, 'carga')}
      <h2>Volume (kg × reps)</h2>${grafico(pontos, 'volume')}`;
  },

  detalhe() {
    const t = estado.treinos[tela.i];
    return `
      <header><button class="link" data-acao="historico">‹ Histórico</button><h1>${data(t.inicio)}</h1>
        <button class="link perigo" data-acao="apagar">Apagar</button></header>
      <p class="resumo">${esc(t.rotina || 'Treino livre')} · ${duracao(t.fim - t.inicio)} · ${kg(volume(t))}</p>
      ${t.exercicios.map(ex => `<section class="ex"><h3>${esc(ex.nome)}</h3>
        <ol>${ex.series.map(s => `<li>${esc(s.kg || 0)} kg × ${esc(s.reps || 0)}</li>`).join('')}</ol></section>`).join('')}`;
  },
};

function listaExercicios(termo) {
  const t = norm(termo);
  const nomes = [...EXERCICIOS, ...estado.custom].filter(n => norm(n).includes(t)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const criar = t && !nomes.some(n => norm(n) === t)
    ? `<button class="item destaque" data-acao="add-ex" data-nome="${esc(termo.trim())}">+ Criar "${esc(termo.trim())}"</button>` : '';
  return criar + nomes.map(n => `<button class="item" data-acao="add-ex" data-nome="${esc(n)}">${esc(n)}</button>`).join('');
}

function render() { app.innerHTML = telas[tela.nome](); }
function ir(nome, extra) { tela = { nome, ...extra }; render(); scrollTo(0, 0); }

// Não sobrescreve um treino em andamento sem confirmação.
function comecar(treino) {
  if (estado.atual && !confirm('Já existe um treino em andamento. Descartar e começar outro?')) return;
  estado.atual = treino; salvar(); ir('treino');
}

const acoes = {
  iniciar() { comecar({ inicio: Date.now(), exercicios: [] }); },
  'usar-rotina'(b) { comecar(treinoDaRotina(estado.rotinas[b.dataset.i], Date.now())); },
  continuar() { ir('treino'); },
  voltar() { ir('inicio'); },
  historico() { ir('historico'); },
  progresso() { ir('progresso'); },
  abrir(b) { ir('detalhe', { i: +b.dataset.i }); },
  escolher() { ir('escolher', { destino: 'treino' }); },
  'escolher-rotina'() { ir('escolher', { destino: 'rotina' }); },
  'voltar-escolher'() { ir(tela.destino); },
  'add-ex'(b) {
    const nome = b.dataset.nome;
    if (![...EXERCICIOS, ...estado.custom].includes(nome)) { estado.custom.push(nome); salvar(); }
    if (tela.destino === 'rotina') { rascunho.exercicios.push({ nome, series: 3 }); return ir('rotina'); }
    const n = Math.max(1, seriesAnteriores(estado.treinos, nome).length);
    estado.atual.exercicios.push({ nome, series: Array.from({ length: n }, novaSerie) });
    salvar(); ir('treino');
  },
  'remover-ex'(b, ei) {
    if (!confirm(`Remover ${estado.atual.exercicios[ei].nome}?`)) return;
    estado.atual.exercicios.splice(ei, 1); salvar(); render();
  },
  'add-serie'(b, ei) { estado.atual.exercicios[ei].series.push(novaSerie()); salvar(); render(); },
  'apagar-serie'(b, ei, si) {
    const series = estado.atual.exercicios[ei].series;
    if ((series[si].kg || series[si].reps) && !confirm('Apagar esta série?')) return;
    series.splice(si, 1); salvar(); render();
  },
  feita(b, ei, si) {
    const ex = estado.atual.exercicios[ei], s = ex.series[si];
    const p = seriesAnteriores(estado.treinos, ex.nome)[si];
    s.feita = !s.feita;
    if (s.feita) {
      if (p) { s.kg ||= p.kg; s.reps ||= p.reps; } // vazio = repete o anterior
      estado.atual.descansoFim = Date.now() + estado.descanso * 1000;
      audio ??= new (window.AudioContext || window.webkitAudioContext)(); // iOS só libera áudio após toque
      audio.resume();
    }
    salvar(); render();
  },
  descanso(b) {
    const d = +b.dataset.d;
    if (d) { estado.atual.descansoFim += d * 1000; estado.descanso = Math.max(15, estado.descanso + d); }
    else delete estado.atual.descansoFim;
    salvar(); render();
  },
  concluir() {
    const f = finalizar(estado.atual, Date.now());
    if (f) { delete f.descansoFim; estado.treinos.push(f); }
    else if (!confirm('Nenhuma série marcada como feita. Descartar treino?')) return;
    estado.atual = null; salvar(); ir(f ? 'historico' : 'inicio');
  },
  descartar() { if (confirm('Descartar treino?')) { estado.atual = null; salvar(); ir('inicio'); } },
  apagar() { if (confirm('Apagar este treino?')) { estado.treinos.splice(tela.i, 1); salvar(); ir('historico'); } },

  'nova-rotina'() { rascunho = { i: null, nome: '', exercicios: [] }; ir('rotina'); },
  'editar-rotina'(b) { rascunho = { i: +b.dataset.i, ...structuredClone(estado.rotinas[b.dataset.i]) }; ir('rotina'); },
  series(b, ei) { const ex = rascunho.exercicios[ei]; ex.series = Math.max(1, ex.series + +b.dataset.d); render(); },
  'remover-ex-rotina'(b, ei) { rascunho.exercicios.splice(ei, 1); render(); },
  'salvar-rotina'() {
    const { i, ...r } = rascunho;
    r.nome = r.nome.trim();
    if (!r.nome) return alert('Dê um nome para a rotina.');
    if (!r.exercicios.length) return alert('Adicione pelo menos um exercício.');
    if (i == null) estado.rotinas.push(r); else estado.rotinas[i] = r;
    salvar(); ir('inicio');
  },
  'apagar-rotina'() {
    if (!confirm(`Apagar a rotina ${rascunho.nome}?`)) return;
    estado.rotinas.splice(rascunho.i, 1); salvar(); ir('inicio');
  },

  async exportar() {
    const nome = `treinos-${new Date().toISOString().slice(0, 10)}.json`;
    const arquivo = new File([JSON.stringify(estado)], nome, { type: 'application/json' });
    if (navigator.canShare?.({ files: [arquivo] })) return navigator.share({ files: [arquivo] }).catch(() => {});
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(arquivo), download: nome });
    a.click(); URL.revokeObjectURL(a.href);
  },
  importar() { document.getElementById('arquivo').click(); },
};

app.addEventListener('click', e => {
  const b = e.target.closest('[data-acao]');
  if (b) acoes[b.dataset.acao]?.(b, +b.dataset.ei, +b.dataset.si);
});

app.addEventListener('input', e => {
  const { ei, si, campo } = e.target.dataset;
  if (campo) { estado.atual.exercicios[ei].series[si][campo] = e.target.value; salvar(); }
  else if (e.target.id === 'busca') document.getElementById('lista').innerHTML = listaExercicios(e.target.value);
  else if (e.target.id === 'nome-rotina') rascunho.nome = e.target.value;
});

app.addEventListener('change', async e => {
  if (e.target.id === 'ex-progresso') return ir('progresso', { ex: e.target.value });
  if (e.target.id !== 'arquivo' || !e.target.files[0]) return;
  try {
    const dados = JSON.parse(await e.target.files[0].text());
    if (!Array.isArray(dados.treinos) || !dados.treinos.every(t => Array.isArray(t.exercicios))) throw 0;
    if (!confirm(`Substituir os dados atuais por ${dados.treinos.length} treinos do backup?`)) return;
    estado = { ...novo(), ...dados }; salvar(); ir('inicio');
  } catch { alert('Arquivo de backup inválido.'); }
});

setInterval(() => {
  const a = estado.atual;
  if (!a) return;
  const c = document.getElementById('cronometro');
  if (c) c.textContent = relogio(Date.now() - a.inicio);
  if (!a.descansoFim) return;
  const resta = a.descansoFim - Date.now();
  if (resta > 0) {
    const t = document.getElementById('descanso-tempo');
    if (t) t.textContent = regressivo(resta);
  } else {
    delete a.descansoFim; salvar(); bip();
    document.getElementById('descanso')?.remove(); // sem render: não tira o foco do campo sendo digitado
  }
}, 1000);

render();
navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
