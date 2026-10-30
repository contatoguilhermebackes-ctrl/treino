// node test.js
import assert from 'node:assert/strict';
import { volume, seriesAnteriores, finalizar } from './logic.js';

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

console.log('ok');
