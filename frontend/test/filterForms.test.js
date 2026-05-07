import { describe, it, expect } from 'vitest';
import { filterByTab, filterBySearch, countByTab } from '../src/helpers/filterForms';

const data = [
    { nombre: 'Levantamiento Anual', descripcion: 'Ente de gobierno', estado_envio: 'no_iniciado' },
    { nombre: 'Diagnóstico Trimestral', descripcion: 'BD', estado_envio: 'en_proceso' },
    { nombre: 'Inventario Bases', descripcion: '', estado_envio: 'enviado' },
    { nombre: 'Reporte 2024', descripcion: 'Anual', estado_envio: 'enviado' },
    { nombre: 'Capacitaciones', descripcion: 'cursos', estado_envio: 'expirado' },
];

describe('filterByTab', () => {
    it('pendientes incluye no_iniciado y en_proceso', () => {
        const r = filterByTab(data, 'pendientes');
        expect(r.map((x) => x.estado_envio)).toEqual(['no_iniciado', 'en_proceso']);
    });

    it('enviados solo enviado', () => {
        expect(filterByTab(data, 'enviados')).toHaveLength(2);
    });

    it('expirados solo expirado', () => {
        expect(filterByTab(data, 'expirados')).toHaveLength(1);
    });

    it('tab desconocido no filtra', () => {
        expect(filterByTab(data, 'noexiste')).toHaveLength(data.length);
    });
});

describe('filterBySearch', () => {
    it('case-insensitive sobre nombre y descripcion', () => {
        expect(filterBySearch(data, 'levantamiento')).toHaveLength(1);
        expect(filterBySearch(data, 'ANUAL').map((x) => x.nombre))
            .toEqual(['Levantamiento Anual', 'Reporte 2024']);
    });

    it('query vacio devuelve todo', () => {
        expect(filterBySearch(data, '')).toHaveLength(data.length);
        expect(filterBySearch(data, '   ')).toHaveLength(data.length);
    });

    it('sin match retorna []', () => {
        expect(filterBySearch(data, 'xyz')).toEqual([]);
    });
});

describe('countByTab', () => {
    it('cuenta correctamente cada categoria', () => {
        expect(countByTab(data)).toEqual({ pendientes: 2, enviados: 2, expirados: 1 });
    });

    it('lista vacia da ceros', () => {
        expect(countByTab([])).toEqual({ pendientes: 0, enviados: 0, expirados: 0 });
    });
});
