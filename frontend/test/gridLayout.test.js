import { describe, expect, it } from 'vitest';
import { placementClasses, startColOf } from '@helpers/gridLayout';

describe('startColOf', () => {
    it('usa la columna explícita cuando cabe el ancho', () => {
        expect(startColOf({ col: 5, colSpan: 2 })).toBe(5);
        expect(startColOf({ col: 4, colSpan: 3 })).toBe(4);
    });

    it('descarta una columna donde el campo no cabría', () => {
        expect(startColOf({ col: 5, colSpan: 3 })).toBe(null);
    });

    it('newRow equivale a la columna 1', () => {
        expect(startColOf({ newRow: true, colSpan: 3 })).toBe(1);
        expect(startColOf({ colSpan: 3 })).toBe(null);
    });
});

describe('placementClasses', () => {
    it('coloca un campo normal con su ancho y su columna', () => {
        expect(placementClasses({ colSpan: 2, col: 5 }))
            .toBe('md:col-span-2 md:col-start-5');
    });

    it('omite la columna cuando el campo fluye', () => {
        expect(placementClasses({ colSpan: 3 })).toBe('md:col-span-3');
    });

    it('un campo con línea reservada se extiende hasta el final y limita su ancho', () => {
        expect(placementClasses({ colSpan: 2, col: 1, alone: true }))
            .toBe('md:col-start-1 md:col-end-7 md:max-w-[33.3333%]');
        expect(placementClasses({ colSpan: 3, col: 1, alone: true }))
            .toBe('md:col-start-1 md:col-end-7 md:max-w-[50%]');
    });

    it('no limita el ancho cuando ya ocupa todo el espacio restante', () => {
        expect(placementClasses({ colSpan: 2, col: 5, alone: true }))
            .toBe('md:col-start-5 md:col-end-7');
        expect(placementClasses({ colSpan: 3, col: 4, alone: true }))
            .toBe('md:col-start-4 md:col-end-7');
    });

    it('reservar la línea no aplica a un campo que ya ocupa la fila completa', () => {
        expect(placementClasses({ colSpan: 6, col: 1, alone: true }))
            .toBe('md:col-span-6 md:col-start-1');
    });
});
