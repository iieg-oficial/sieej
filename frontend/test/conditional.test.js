import { describe, it, expect } from 'vitest';
import { evaluarShowWhen } from '../src/forms/renderer/conditional';

describe('evaluarShowWhen', () => {
    it('retorna true cuando no hay condición', () => {
        expect(evaluarShowWhen(undefined, {})).toBe(true);
        expect(evaluarShowWhen(null, {})).toBe(true);
    });

    it('retorna true cuando la condición no especifica field', () => {
        expect(evaluarShowWhen({ equals: 'true' }, {})).toBe(true);
    });

    it('compara strings correctamente', () => {
        expect(evaluarShowWhen({ field: 'tiene_diccionario', equals: 'true' }, { tiene_diccionario: 'true' })).toBe(true);
        expect(evaluarShowWhen({ field: 'tiene_diccionario', equals: 'true' }, { tiene_diccionario: 'false' })).toBe(false);
    });

    it('coerciona booleanos a "true"/"false"', () => {
        expect(evaluarShowWhen({ field: 'tiene_diccionario', equals: 'true' }, { tiene_diccionario: true })).toBe(true);
        expect(evaluarShowWhen({ field: 'tiene_diccionario', equals: 'false' }, { tiene_diccionario: false })).toBe(true);
    });

    it('retorna false cuando el campo no existe en scope', () => {
        expect(evaluarShowWhen({ field: 'foo', equals: 'true' }, {})).toBe(false);
    });

    it('acepta equals como lista de valores (OR)', () => {
        const cond = { field: 'categoria', equals: ['salud', 'seguridad'] };
        expect(evaluarShowWhen(cond, { categoria: 'salud' })).toBe(true);
        expect(evaluarShowWhen(cond, { categoria: 'seguridad' })).toBe(true);
        expect(evaluarShowWhen(cond, { categoria: 'empleo' })).toBe(false);
    });

    it('con equals lista y scope multiselección cruza por intersección', () => {
        const cond = { field: 'ejes', equals: ['salud', 'empleo'] };
        expect(evaluarShowWhen(cond, { ejes: ['empleo', 'otro'] })).toBe(true);
        expect(evaluarShowWhen(cond, { ejes: ['otro'] })).toBe(false);
    });
});
