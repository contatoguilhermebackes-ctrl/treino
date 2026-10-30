// node test.js
import assert from 'node:assert/strict';
import { volume, seriesAnteriores, finalizar, treinoDaRotina, exerciciosFeitos, historicoExercicio } from './logic.js';

const t = {
  inicio: 0,
  exercicios: [
    { nome: 'Supino', series: [{ kg: '60', reps: '10', feita: true }, { kg: '70', reps: '8', feita: false }] },
    { nome: 'Remada', series: [{ kg: '', reps: '', feita: false }] },
  ],
};

assert.equal(volume(t), 600);

const f = finalizar(t, 100);
assert.equal(f.fim, 100);
assert.deepEqual(f.exercicios.map(e => e.nome), ['Supino']);
assert.equal(f.exercicios[0].series.length, 1);
assert.equal(finalizar({ exercicios: [{ nome: 'X', series: [{ feita: false }] }] }, 1), null);

const historico = [f, { exercicios: [{ nome: 'Supino', series: [{ kg: '80', reps: '5', feita: true }] }] }];
assert.equal(seriesAnteriores(historico, 'Supino')[0].kg, '80');
assert.equal(seriesAnteriores(historico, 'Remada').length, 0);

const r = treinoDaRotina({ nome: 'A', exercicios: [{ nome: 'Supino', series: 3 }] }, 5);
assert.equal(r.rotina, 'A');
assert.equal(r.inicio, 5);
assert.equal(r.exercicios[0].series.length, 3);
r.exercicios[0].series[0].kg = '10';
assert.equal(r.exercicios[0].series[1].kg, ''); // séries independentes

assert.deepEqual(exerciciosFeitos(historico), ['Supino']);

const h = historicoExercicio([{ inicio: 1, exercicios: [{ nome: 'Supino', series: [{ kg: '60', reps: '10' }, { kg: '70', reps: '5' }] }] }, ...historico], 'Supino');
assert.equal(h.length, 3);
assert.deepEqual(h[0], { data: 1, carga: 70, volume: 950 });

console.log('ok');
