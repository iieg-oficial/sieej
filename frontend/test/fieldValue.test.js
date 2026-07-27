import { describe, expect, it } from 'vitest';
import { formatFieldValue } from '@forms/renderer/fieldValue';

const CATALOGOS = {
    dependencias: [ { value: '1', label: 'IIEG' }, { value: '2', label: 'Salud' } ],
};

describe('formatFieldValue', () => {
    it('deja vacio lo que no tiene valor', () => {
        expect(formatFieldValue({ type: 'text' }, null)).toBe('');
        expect(formatFieldValue({ type: 'text' }, '')).toBe('');
        expect(formatFieldValue({ type: 'text' }, undefined)).toBe('');
    });

    it('traduce la opcion elegida a su etiqueta', () => {
        const field = { type: 'select', catalog: 'dependencias' };
        expect(formatFieldValue(field, '2', CATALOGOS)).toBe('Salud');
    });

    it('traduce las opciones booleanas de un radio a Si/No', () => {
        const field = {
            type: 'radio',
            options: [ { value: true, label: 'Sí' }, { value: false, label: 'No' } ],
        };
        expect(formatFieldValue(field, true)).toBe('Sí');
        expect(formatFieldValue(field, false)).toBe('No');
        expect(formatFieldValue(field, 'false')).toBe('No');
    });

    it('traduce un booleano aunque el campo no traiga sus opciones', () => {
        expect(formatFieldValue({ type: 'select' }, true)).toBe('Sí');
        expect(formatFieldValue(undefined, false)).toBe('No');
        expect(formatFieldValue(undefined, 'true')).toBe('Sí');
    });

    it('un checkbox se lee como Si/No', () => {
        expect(formatFieldValue({ type: 'checkbox' }, true)).toBe('Sí');
        expect(formatFieldValue({ type: 'checkbox' }, false)).toBe('No');
    });

    it('une las opciones de un multiple con sus etiquetas', () => {
        const field = { type: 'select_multiple', catalog: 'dependencias' };
        expect(formatFieldValue(field, [ '1', '2' ], CATALOGOS)).toBe('IIEG, Salud');
        expect(formatFieldValue(undefined, [ 'a', 'b' ])).toBe('a, b');
    });

    it('arma el rango de fechas y el nombre del archivo', () => {
        expect(formatFieldValue({ type: 'date_range' }, { start: '2026-01-01', endOption: 'Vigente' }))
            .toBe('2026-01-01 – Vigente');
        expect(formatFieldValue({ type: 'date_range' }, {})).toBe('');
        expect(formatFieldValue({ type: 'file' }, { filename_original: 'padron.xlsx' }))
            .toBe('padron.xlsx');
    });
});
