import { describe, expect, it } from 'vitest';
import {
    agruparActualizables, armarPayload, reindexarPendientes,
} from '../src/forms/renderer/actualizacion';

const definicion = {
    steps: [
        {
            id: 'general',
            type: 'form',
            fields: [{ name: 'nota', type: 'text', editableAfterSubmit: true }],
        },
        {
            id: 'conjuntos',
            type: 'repeater',
            fields: [
                { name: 'corte', type: 'date', editableAfterSubmit: true },
                { name: 'metodologia', type: 'textarea' },
                { name: 'carga', type: 'file', editableAfterSubmit: true },
                { name: 'aviso', type: 'info' },
            ],
        },
        { id: 'resumen', type: 'summary', fields: [] },
    ],
};

describe('agruparActualizables', () => {
    it('da un grupo por paso, también para el repeater', () => {
        const grupos = agruparActualizables(definicion);
        expect(grupos.map(({ step }) => step.id)).toEqual(['general', 'conjuntos']);
        expect(grupos[1].fields.map((f) => f.name)).toEqual(['corte', 'carga']);
    });
});

describe('armarPayload', () => {
    const grupos = agruparActualizables(definicion);
    const original = {
        general: { nota: 'a' },
        conjuntos: [{ corte: '2026-06-30', metodologia: 'm1', carga: { filename: 'x.csv' } }],
    };

    it('en un conjunto existente manda solo lo actualizable y nunca archivos', () => {
        const campos = armarPayload({ grupos, valores: original, original });
        expect(campos).toEqual({
            'general.nota': 'a',
            'conjuntos[0].corte': '2026-06-30',
        });
    });

    it('en un conjunto nuevo manda todo lo lleno del paso, no solo lo actualizable', () => {
        const valores = {
            ...original,
            conjuntos: [...original.conjuntos, { corte: '2026-09-30', metodologia: 'm2', carga: null }],
        };
        const campos = armarPayload({ grupos, valores, original });
        expect(campos['conjuntos[1].corte']).toBe('2026-09-30');
        expect(campos['conjuntos[1].metodologia']).toBe('m2');
        expect(campos).not.toHaveProperty('conjuntos[1].carga');
        expect(campos).not.toHaveProperty('conjuntos[1].aviso');
    });

    it('en un conjunto nuevo no manda lo que quedó vacío', () => {
        const valores = { ...original, conjuntos: [...original.conjuntos, { corte: '' }] };
        const campos = armarPayload({ grupos, valores, original });
        expect(Object.keys(campos).some((k) => k.startsWith('conjuntos[1]'))).toBe(false);
    });

    it('manda el nombre de la pestaña solo cuando cambió', () => {
        const sinCambio = armarPayload({ grupos, valores: original, original });
        expect(sinCambio).not.toHaveProperty('conjuntos[0].__etiqueta');

        const valores = { ...original, conjuntos: [{ ...original.conjuntos[0], __etiqueta: 'Planteles' }] };
        expect(armarPayload({ grupos, valores, original })['conjuntos[0].__etiqueta']).toBe('Planteles');
    });

    it('borrar el nombre lo manda como vacío para que regrese al número', () => {
        const conNombre = { ...original, conjuntos: [{ ...original.conjuntos[0], __etiqueta: 'Planteles' }] };
        const valores = { ...original, conjuntos: [{ ...original.conjuntos[0], __etiqueta: '' }] };
        expect(armarPayload({ grupos, valores, original: conNombre })['conjuntos[0].__etiqueta']).toBeNull();
    });
});

describe('reindexarPendientes', () => {
    const archivo = (nombre) => ({ name: nombre });

    it('al quitar un conjunto nuevo descarta sus archivos y recorre los de después', () => {
        const pendientes = new Map([
            ['conjuntos[1].carga', archivo('uno.csv')],
            ['conjuntos[2].carga', archivo('dos.csv')],
            ['otro[2].carga', archivo('otro.csv')],
        ]);
        reindexarPendientes(pendientes, 'conjuntos', 1);
        expect([...pendientes.keys()]).toEqual(['conjuntos[1].carga', 'otro[2].carga']);
        expect(pendientes.get('conjuntos[1].carga').name).toBe('dos.csv');
    });
});
