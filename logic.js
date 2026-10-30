// Regras puras (sem DOM), testadas em test.js.

export const EXERCICIOS = [
  'Supino reto (barra)', 'Supino inclinado (halteres)', 'Crucifixo (halteres)', 'Crossover',
  'Desenvolvimento (halteres)', 'Elevação lateral', 'Elevação frontal',
  'Puxada frontal', 'Barra fixa', 'Remada curvada (barra)', 'Remada baixa', 'Remada unilateral (halter)',
  'Rosca direta (barra)', 'Rosca alternada', 'Rosca martelo', 'Tríceps pulley', 'Tríceps francês', 'Mergulho',
  'Agachamento livre', 'Leg press', 'Cadeira extensora', 'Mesa flexora', 'Stiff', 'Levantamento terra',
  'Afundo', 'Elevação pélvica', 'Panturrilha em pé', 'Abdominal', 'Prancha',
];

export function volume(treino) {
  return treino.exercicios.reduce((total, ex) =>
    total + ex.series.reduce((s, x) => s + (x.feita ? (+x.kg || 0) * (+x.reps || 0) : 0), 0), 0);
}

// Séries do último treino finalizado que tem esse exercício.
export function seriesAnteriores(treinos, nome) {
  for (let i = treinos.length - 1; i >= 0; i--) {
    const ex = treinos[i].exercicios.find(e => e.nome === nome);
    if (ex) return ex.series;
  }
  return [];
}

// Mantém só séries marcadas como feitas; null se não sobrou nada.
export function finalizar(treino, fim) {
  const exercicios = treino.exercicios
    .map(ex => ({ ...ex, series: ex.series.filter(s => s.feita) }))
    .filter(ex => ex.series.length);
  return exercicios.length ? { ...treino, fim, exercicios } : null;
}
