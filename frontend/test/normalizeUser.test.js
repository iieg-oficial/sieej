import { describe, it, expect } from 'vitest';
import { normalizeUser } from '../src/helpers/normalizeUser';

describe('normalizeUser', () => {
    it('retorna null si no hay user', () => {
        expect(normalizeUser(null)).toBe(null);
        expect(normalizeUser(undefined)).toBe(null);
    });

    it('preserva nombre/apellido cuando ya vienen del backend', () => {
        const user = { username: 'a', email: 'a@b', nombre: 'Ana', apellido: 'Pérez' };
        expect(normalizeUser(user)).toEqual(user);
    });

    it('deriva nombre/apellido desde name si faltan', () => {
        const result = normalizeUser({ username: 'a', name: 'Juan Pérez' });
        expect(result.nombre).toBe('Juan');
        expect(result.apellido).toBe('Pérez');
    });

    it('deja vacíos cuando no hay name ni nombre/apellido', () => {
        const result = normalizeUser({ username: 'a' });
        expect(result.nombre).toBe('');
        expect(result.apellido).toBe('');
    });
});
