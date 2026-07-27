import { describe, expect, it } from 'vitest';
import { buildFieldHints } from '@helpers/fieldHints';

const hint = (hints, id) => hints.find((h) => h.id === id);

describe('buildFieldHints', () => {
    it('sin reglas no describe nada', () => {
        expect(buildFieldHints({ value: 'algo' })).toEqual([]);
        expect(buildFieldHints()).toEqual([]);
    });

    it('describe el formato esperado antes de escribir', () => {
        const hints = buildFieldHints({
            pattern: /^\d{10}$/,
            patternMessage: 'Ingresa un teléfono de 10 dígitos',
            value: '',
        });
        expect(hint(hints, 'pattern')).toMatchObject({
            text: 'Ingresa un teléfono de 10 dígitos',
            state: 'neutral',
        });
    });

    it('evalua el regex conforme se escribe', () => {
        const regla = { pattern: /^\d{10}$/, patternMessage: 'Diez dígitos' };
        expect(hint(buildFieldHints({ ...regla, value: '333' }), 'pattern').state).toBe('error');
        expect(hint(buildFieldHints({ ...regla, value: '3312345678' }), 'pattern').state).toBe('ok');
    });

    it('un regex global no arrastra su ultima posicion entre evaluaciones', () => {
        const pattern = /\d+/g;
        const primera = buildFieldHints({ pattern, value: '123' });
        const segunda = buildFieldHints({ pattern, value: '123' });
        expect(hint(primera, 'pattern').state).toBe('ok');
        expect(hint(segunda, 'pattern').state).toBe('ok');
    });

    it('marca la longitud minima hasta que se alcanza', () => {
        expect(hint(buildFieldHints({ minLength: 5, value: '' }), 'minLength'))
            .toMatchObject({ text: 'Mínimo 5 caracteres', state: 'neutral' });
        expect(hint(buildFieldHints({ minLength: 5, value: 'abc' }), 'minLength').state).toBe('error');
        expect(hint(buildFieldHints({ minLength: 5, value: 'abcde' }), 'minLength').state).toBe('ok');
    });

    it('lleva la cuenta de caracteres y avisa al tocar el tope', () => {
        expect(hint(buildFieldHints({ maxLength: 10, value: 'hola' }), 'maxLength'))
            .toMatchObject({ text: '4/10 caracteres', state: 'neutral' });
        expect(hint(buildFieldHints({ maxLength: 4, value: 'hola' }), 'maxLength').state).toBe('limite');
    });

    it('convive el formato con la longitud', () => {
        const hints = buildFieldHints({
            pattern: /^[A-Z]+$/,
            patternMessage: 'Solo mayúsculas',
            minLength: 3,
            maxLength: 8,
            value: 'ABC',
        });
        expect(hints.map((h) => h.id)).toEqual([ 'pattern', 'minLength', 'maxLength' ]);
        expect(hints.map((h) => h.state)).toEqual([ 'ok', 'ok', 'neutral' ]);
    });
});
