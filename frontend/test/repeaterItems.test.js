import { describe, it, expect } from 'vitest';
import { buildRepeaterItems, resolverTabDeCampo } from '../src/forms/renderer/repeaterItems';

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

describe('buildRepeaterItems', () => {
    const step = { id: 'conjuntos', itemLabel: 'Conjunto de datos {{index}}' };

    it('usa el nombre que le puso quien llena', () => {
        const [item] = buildRepeaterItems(step, [{ __etiqueta: 'Planteles', nombre: 'otro' }]);
        expect(item.label).toBe('Planteles');
    });

    it('sin nombre propio cae a la etiqueta numerada del paso', () => {
        const items = buildRepeaterItems(step, [{}, { __etiqueta: '' }]);
        expect(items.map((i) => i.label)).toEqual(['Conjunto de datos 1', 'Conjunto de datos 2']);
    });

    it('respeta los campos de nombre que ya existían antes que la plantilla', () => {
        const [item] = buildRepeaterItems(step, [{ nombre_bd: 'BD escolar' }]);
        expect(item.label).toBe('BD escolar');
    });
});
