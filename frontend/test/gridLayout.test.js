import { describe, expect, it } from 'vitest';
import {
    GRID_COLUMNS, layoutSlots, placementClasses, spacerClass, startColOf,
} from '@helpers/gridLayout';
import { CASOS, aCampo, marca } from './fixtures/layoutContract';

const filasDeSlots = (campos) => {
    const filas = [];
    let actual = [];
    let usado = 0;
    layoutSlots(campos).forEach((slot) => {
        if (slot.kind === 'field') {
            actual.push(marca(campos[slot.idx].name, slot.col, slot.units));
        }
        usado += slot.units;
        if (usado >= GRID_COLUMNS) {
            filas.push(actual);
            actual = [];
            usado = 0;
        }
    });
    if (actual.length) filas.push(actual);
    return filas;
};

describe('contrato de acomodo (compartido con el editor de mariachi)', () => {
    CASOS.forEach(({ nombre, campos, filas }) => {
        it(nombre, () => {
            expect(filasDeSlots(campos.map(aCampo))).toEqual(filas);
        });
    });
});

describe('layoutSlots', () => {
    it('rellena el hueco de la izquierda para que la línea reservada no se comparta', () => {
        const campos = [
            aCampo({ name: 'a', colSpan: 3, col: 1 }),
            aCampo({ name: 'b', colSpan: 3, col: 3, alone: true }),
        ];
        expect(layoutSlots(campos)).toEqual([
            { kind: 'field', idx: 0, col: 1, units: 2 },
            { kind: 'spacer', units: 4 },
            { kind: 'spacer', units: 2 },
            { kind: 'field', idx: 1, col: 3, units: 2 },
            { kind: 'spacer', units: 2 },
        ]);
    });

    it('cada línea suma exactamente el ancho de la cuadrícula', () => {
        CASOS.forEach(({ campos }) => {
            const total = layoutSlots(campos.map(aCampo)).reduce((acc, s) => acc + s.units, 0);
            expect(total % GRID_COLUMNS).toBe(0);
        });
    });

    it('ignora los campos ocultos porque recibe solo los visibles', () => {
        const visibles = [aCampo({ name: 'a', colSpan: 2 }), aCampo({ name: 'c', colSpan: 2 })];
        expect(layoutSlots(visibles).filter((s) => s.kind === 'field').map((s) => s.col))
            .toEqual([1, 4]);
    });
});

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
    it('coloca un campo con su ancho y su columna', () => {
        expect(placementClasses({ colSpan: 2, col: 5 }))
            .toBe('md:col-span-2 md:col-start-5');
    });

    it('omite la columna cuando el campo fluye', () => {
        expect(placementClasses({ colSpan: 3 })).toBe('md:col-span-3');
    });

    it('los rellenos solo existen en escritorio', () => {
        expect(spacerClass(2)).toBe('hidden md:block md:col-span-2');
    });
});
