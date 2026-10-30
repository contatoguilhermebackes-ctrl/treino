// Regras puras (sem DOM), testadas em test.js.

export const EXERCICIOS = [
  'Supino reto (barra)', 'Supino inclinado (halteres)', 'Crucifixo (halteres)', 'Crossover',
  'Desenvolvimento (halteres)', 'Elevação lateral', 'Elevação frontal',
  'Puxada frontal', 'Barra fixa', 'Remada curvada (barra)', 'Remada baixa', 'Remada unilateral (halter)',
  'Rosca direta (barra)', 'Rosca alternada', 'Rosca martelo', 'Tríceps pulley', 'Tríceps francês', 'Mergulho',
  'Agachamento livre', 'Leg press', 'Cadeira extensora', 'Mesa flexora', 'Stiff', 'Levantamento terra',
  'Afundo', 'Elevação pélvica', 'Panturrilha em pé', 'Abdominal', 'Prancha',
];

export const novaSerie = () => ({ kg: '', reps: '', feita: false });

export function treinoDaRotina(rotina, agora) {
  return {
    inicio: agora,
    rotina: rotina.nome,
    exercicios: rotina.exercicios.map(e => ({ nome: e.nome, series: Array.from({ length: e.series }, novaSerie) })),
  };
}

export function exerciciosFeitos(treinos) {
  return [...new Set(treinos.flatMap(t => t.exercicios.map(e => e.nome)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// Um ponto por treino que tem o exercício: maior carga e volume (kg × reps).
export function historicoExercicio(treinos, nome) {
  return treinos.flatMap(t => {
    const ex = t.exercicios.find(e => e.nome === nome);
    if (!ex) return [];
    return [{
      data: t.inicio,
      carga: Math.max(...ex.series.map(s => +s.kg || 0)),
      volume: ex.series.reduce((v, s) => v + (+s.kg || 0) * (+s.reps || 0), 0),
    }];
  });
}

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
