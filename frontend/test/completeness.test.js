import { describe, expect, it } from 'vitest';
import { requisitosPendientes, stepsConPendientes } from '@forms/renderer/completeness';

const STEP_DATOS = {
    id: 'datos',
    type: 'form',
    title: 'Datos generales',
    fields: [
        { name: 'nombre', type: 'text', required: true },
        { name: 'comentario', type: 'textarea' },
    ],
};

const STEP_BASES = {
    id: 'bases',
    type: 'repeater',
    title: 'Bases de datos',
    minItems: 1,
    fields: [ { name: 'titulo', type: 'text', required: true } ],
};

const STEP_RESUMEN = { id: 'resumen', type: 'summary', title: 'Resumen' };

const STEPS = [ STEP_DATOS, STEP_BASES, STEP_RESUMEN ];

describe('requisitosPendientes', () => {
    it('reclama el campo obligatorio vacio', () => {
        expect(requisitosPendientes(STEP_DATOS, { datos: {} }))
            .toBe('Completa los campos obligatorios para continuar.');
    });

    it('no reclama los campos opcionales', () => {
        expect(requisitosPendientes(STEP_DATOS, { datos: { nombre: 'Ana' } })).toBeNull();
    });
});

describe('stepsConPendientes', () => {
    it('reune los pasos a los que les falta un obligatorio', () => {
        const pendientes = stepsConPendientes(STEPS, { datos: {}, bases: [] });
        expect(pendientes.map(({ step }) => step.id)).toEqual([ 'datos', 'bases' ]);
        expect(pendientes[1].mensaje).toBe('Agrega al menos un elemento para continuar.');
    });

    it('ignora el paso de resumen y los pasos completos', () => {
        const pendientes = stepsConPendientes(STEPS, {
            datos: { nombre: 'Ana' },
            bases: [ { titulo: 'Padrón' } ],
        });
        expect(pendientes).toEqual([]);
    });

    it('detecta el item de un repeater al que le falta un obligatorio', () => {
        const pendientes = stepsConPendientes(STEPS, {
            datos: { nombre: 'Ana' },
            bases: [ { titulo: 'Padrón' }, {} ],
        });
        expect(pendientes.map(({ step }) => step.id)).toEqual([ 'bases' ]);
        expect(pendientes[0].mensaje).toBe('Completa los campos obligatorios para continuar.');
    });
});
