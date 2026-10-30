import { EXERCICIOS, volume, seriesAnteriores, finalizar } from './logic.js';

const CHAVE = 'treino-v1';
const app = document.getElementById('app');
let estado = carregar();
let tela = { nome: estado.atual ? 'treino' : 'inicio' };

function novo() { return { treinos: [], atual: null, custom: [] }; }
function carregar() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || novo(); } catch { return novo(); }
}
function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
  catch { alert('Não foi possível salvar. Exporte um backup.'); }
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const norm = s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const data = ms => new Date(ms).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
const kg = n => `${n.toLocaleString('pt-BR')} kg`;
const duracao = ms => { const m = Math.floor(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m}min`; };
const relogio = ms => {
  const s = Math.floor(ms / 1000), p = n => String(n).padStart(2, '0');
  return `${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
};

const telas = {
  inicio() {
    const lista = estado.treinos.map((t, i) => `
      <button class="card" data-acao="abrir" data-i="${i}">
        <b>${data(t.inicio)}</b>
        <span>${duracao(t.fim - t.inicio)} · ${t.exercicios.length} exercícios · ${kg(volume(t))}</span>
      </button>`).reverse().join('');
    return `
      <header><span></span><h1>Treinos</h1><span></span></header>
      <button class="primario" data-acao="${estado.atual ? 'continuar' : 'iniciar'}">
        ${estado.atual ? 'Continuar treino' : 'Iniciar treino'}</button>
      <h2>Histórico</h2>
      ${lista || '<p class="vazio">Nenhum treino ainda.</p>'}
      <div class="linha">
        <button class="secundario" data-acao="exportar">Exportar backup</button>
        <button class="secundario" data-acao="importar">Importar backup</button>
        <input id="arquivo" type="file" accept="application/json,.json" hidden>
      </div>`;
  },

  treino() {
    const blocos = estado.atual.exercicios.map((ex, ei) => {
      const ant = seriesAnteriores(estado.treinos, ex.nome);
      const linhas = ex.series.map((s, si) => {
        const p = ant[si];
        return `<tr class="${s.feita ? 'feita' : ''}">
          <td>${si + 1}</td>
          <td class="ant">${p ? `${esc(p.kg)}×${esc(p.reps)}` : '—'}</td>
          <td><input inputmode="decimal" data-ei="${ei}" data-si="${si}" data-campo="kg" value="${esc(s.kg)}" placeholder="${p ? esc(p.kg) : 'kg'}"></td>
          <td><input inputmode="numeric" data-ei="${ei}" data-si="${si}" data-campo="reps" value="${esc(s.reps)}" placeholder="${p ? esc(p.reps) : 'reps'}"></td>
          <td><button class="check" data-acao="feita" data-ei="${ei}" data-si="${si}" aria-label="Série feita">✓</button></td>
        </tr>`;
      }).join('');
      return `<section class="ex">
        <div class="ex-topo"><h3>${esc(ex.nome)}</h3>
          <button class="link perigo" data-acao="remover-ex" data-ei="${ei}">Remover</button></div>
        <table><thead><tr><th>Série</th><th>Anterior</th><th>kg</th><th>Reps</th><th></th></tr></thead>
        <tbody>${linhas}</tbody></table>
        <button class="secundario" data-acao="add-serie" data-ei="${ei}">+ Série</button>
      </section>`;
    }).join('');
    return `
      <header><button class="link" data-acao="voltar">‹ Início</button>
        <span id="cronometro">${relogio(Date.now() - estado.atual.inicio)}</span>
        <button class="link destaque" data-acao="concluir">Finalizar</button></header>
      ${blocos}
      <button class="primario" data-acao="escolher">+ Exercício</button>
      <button class="link perigo centro" data-acao="descartar">Descartar treino</button>`;
  },

  escolher() {
    return `
      <header><button class="link" data-acao="continuar">‹ Voltar</button><h1>Exercício</h1><span></span></header>
      <input id="busca" type="search" placeholder="Buscar ou criar…" autocomplete="off">
      <div id="lista">${listaExercicios('')}</div>`;
  },

  detalhe() {
    const t = estado.treinos[tela.i];
    return `
      <header><button class="link" data-acao="voltar">‹ Início</button><h1>${data(t.inicio)}</h1>
        <button class="link perigo" data-acao="apagar">Apagar</button></header>
      <p class="resumo">${duracao(t.fim - t.inicio)} · ${kg(volume(t))}</p>
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
function ir(nome, i) { tela = { nome, i }; render(); scrollTo(0, 0); }

const acoes = {
  iniciar() { estado.atual = { inicio: Date.now(), exercicios: [] }; salvar(); ir('treino'); },
  continuar() { ir('treino'); },
  voltar() { ir('inicio'); },
  abrir(b) { ir('detalhe', +b.dataset.i); },
  escolher() { ir('escolher'); },
  'add-ex'(b) {
    const nome = b.dataset.nome;
    if (![...EXERCICIOS, ...estado.custom].includes(nome)) estado.custom.push(nome);
    const n = Math.max(1, seriesAnteriores(estado.treinos, nome).length);
    estado.atual.exercicios.push({ nome, series: Array.from({ length: n }, () => ({ kg: '', reps: '', feita: false })) });
    salvar(); ir('treino');
  },
  'remover-ex'(b, ei) {
    if (!confirm(`Remover ${estado.atual.exercicios[ei].nome}?`)) return;
    estado.atual.exercicios.splice(ei, 1); salvar(); render();
  },
  'add-serie'(b, ei) { estado.atual.exercicios[ei].series.push({ kg: '', reps: '', feita: false }); salvar(); render(); },
  feita(b, ei, si) {
    const ex = estado.atual.exercicios[ei], s = ex.series[si];
    const p = seriesAnteriores(estado.treinos, ex.nome)[si];
    s.feita = !s.feita;
    if (s.feita && p) { s.kg ||= p.kg; s.reps ||= p.reps; } // vazio = repete o anterior
    salvar(); render();
  },
  concluir() {
    const f = finalizar(estado.atual, Date.now());
    if (f) estado.treinos.push(f);
    else if (!confirm('Nenhuma série marcada como feita. Descartar treino?')) return;
    estado.atual = null; salvar(); ir('inicio');
  },
  descartar() { if (confirm('Descartar treino?')) { estado.atual = null; salvar(); ir('inicio'); } },
  apagar() { if (confirm('Apagar este treino?')) { estado.treinos.splice(tela.i, 1); salvar(); ir('inicio'); } },
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
});

app.addEventListener('change', async e => {
  if (e.target.id !== 'arquivo' || !e.target.files[0]) return;
  try {
    const dados = JSON.parse(await e.target.files[0].text());
    if (!Array.isArray(dados.treinos) || !dados.treinos.every(t => Array.isArray(t.exercicios))) throw 0;
    if (!confirm(`Substituir os dados atuais por ${dados.treinos.length} treinos do backup?`)) return;
    estado = { ...novo(), ...dados }; salvar(); ir('inicio');
  } catch { alert('Arquivo de backup inválido.'); }
});

setInterval(() => {
  const c = document.getElementById('cronometro');
  if (c && estado.atual) c.textContent = relogio(Date.now() - estado.atual.inicio);
}, 1000);

render();
navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
