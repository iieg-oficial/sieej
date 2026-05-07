import { describe, it, expect } from 'vitest';
import { resolveOptions } from '../src/forms/renderer/catalogResolver';

describe('resolveOptions', () => {
    it('retorna [] si no hay options ni catalog', () => {
        expect(resolveOptions({}, null)).toEqual([]);
        expect(resolveOptions({ catalog: 'foo' }, null)).toEqual([]);
        expect(resolveOptions({ catalog: 'foo' }, {})).toEqual([]);
    });

    it('retorna options inline cuando vienen', () => {
        const field = { options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] };
        expect(resolveOptions(field, null)).toEqual([
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
        ]);
    });

    it('mapea catálogo de objetos { value }', () => {
        const catalogos = { unidades_admin: [{ value: 'Hacienda' }, { value: 'Salud' }] };
        const result = resolveOptions({ catalog: 'unidades_admin' }, catalogos);
        expect(result).toEqual([
            { value: 'Hacienda', label: 'Hacienda' },
            { value: 'Salud', label: 'Salud' },
        ]);
    });

    it('mapea catálogo de strings', () => {
        const catalogos = { tipos: ['A', 'B'] };
        expect(resolveOptions({ catalog: 'tipos' }, catalogos)).toEqual([
            { value: 'A', label: 'A' },
            { value: 'B', label: 'B' },
        ]);
    });

    it('da preferencia a options sobre catalog', () => {
        const field = { catalog: 'foo', options: [{ value: 'x', label: 'X' }] };
        const catalogos = { foo: [{ value: 'y' }] };
        expect(resolveOptions(field, catalogos)).toEqual([{ value: 'x', label: 'X' }]);
    });
});
