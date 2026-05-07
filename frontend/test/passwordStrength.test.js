import { describe, it, expect } from 'vitest';
import { computePasswordStrength, isStrongEnough } from '../src/helpers/passwordStrength';

describe('computePasswordStrength', () => {
    it('retorna score 0 y label vacío sin contraseña', () => {
        const r = computePasswordStrength('');
        expect(r.score).toBe(0);
        expect(r.label).toBe('');
        expect(r.rules.length).toBe(false);
    });

    it('cuenta cada regla cumplida', () => {
        expect(computePasswordStrength('abcdefgh').score).toBe(1);          // length
        expect(computePasswordStrength('Abcdefgh').score).toBe(2);          // length + case
        expect(computePasswordStrength('Abcdefg1').score).toBe(3);          // length + case + number
        expect(computePasswordStrength('Abcdefg1!').score).toBe(4);         // todas
    });

    it('rules refleja qué cumplió y qué no', () => {
        const r = computePasswordStrength('abc');
        expect(r.rules).toEqual({ length: false, case: false, number: false, special: false });
        const r2 = computePasswordStrength('Abcdefg1!');
        expect(r2.rules).toEqual({ length: true, case: true, number: true, special: true });
    });

    it('aplica labels segun score', () => {
        expect(computePasswordStrength('abcdefgh').label).toBe('Muy débil');
        expect(computePasswordStrength('Abcdefgh').label).toBe('Débil');
        expect(computePasswordStrength('Abcdefg1').label).toBe('Aceptable');
        expect(computePasswordStrength('Abcdefg1!').label).toBe('Buena');
    });
});

describe('isStrongEnough', () => {
    it('exige al menos score 3 (longitud + case + numero)', () => {
        expect(isStrongEnough('abc')).toBe(false);
        expect(isStrongEnough('abcdefgh')).toBe(false);     // solo length
        expect(isStrongEnough('Abcdefgh')).toBe(false);     // length + case
        expect(isStrongEnough('Abcdefg1')).toBe(true);      // 3
        expect(isStrongEnough('Abcdefg1!')).toBe(true);     // 4
    });
});
