import { describe, it, expect } from 'vitest';
import { resolverTabDeCampo } from '../src/forms/renderer/repeaterItems';

const TABS = [{ id: 'datos', title: 'Datos' }, { id: 'diccionario', title: 'Diccionario' }];

describe('resolverTabDeCampo', () => {
    it('respeta el tab del campo cuando existe', () => {
        expect(resolverTabDeCampo({ tab: 'diccionario' }, TABS)).toBe('diccionario');
    });

    it('cae a la primera pestaña cuando el campo no trae tab', () => {
        expect(resolverTabDeCampo({}, TABS)).toBe('datos');
    });

    it('cae a la primera pestaña cuando el tab ya no existe', () => {
        expect(resolverTabDeCampo({ tab: 'borrado' }, TABS)).toBe('datos');
    });

    it('devuelve undefined si no hay pestañas', () => {
        expect(resolverTabDeCampo({ tab: 'datos' }, [])).toBeUndefined();
        expect(resolverTabDeCampo({ tab: 'datos' }, null)).toBeUndefined();
    });
});
