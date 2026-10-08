import { describe, expect, it } from 'vitest';
import {
    aNombreRHF,
    aPathBackend,
    aplanarDatos,
    autoriaDesdeHistorial,
    camposCambiados,
    pathsDeArchivo,
} from '@helpers/fieldPath';

describe('traduccion de paths entre el wizard y la API', () => {
    it('deja igual un campo de paso simple', () => {
        expect(aPathBackend('general.razon_social')).toBe('general.razon_social');
        expect(aNombreRHF('general.razon_social')).toBe('general.razon_social');
    });

    it('mueve el indice del repeater a corchetes y de regreso', () => {
        expect(aPathBackend('bases_datos.0.diccionario')).toBe('bases_datos[0].diccionario');
        expect(aNombreRHF('bases_datos[0].diccionario')).toBe('bases_datos.0.diccionario');
    });

    it('solo toca el primer indice, que es el unico que el contrato admite', () => {
        expect(aPathBackend('bases_datos.10.campo')).toBe('bases_datos[10].campo');
        expect(aNombreRHF('bases_datos[10].campo')).toBe('bases_datos.10.campo');
    });

    it('ida y vuelta no pierde nada', () => {
        const paths = ['general.razon_social', 'bases_datos[3].diccionario'];
        paths.forEach((p) => expect(aPathBackend(aNombreRHF(p))).toBe(p));
    });
});

describe('aplanado de datos a paths', () => {
    it('aplana pasos simples y repeaters', () => {
        const datos = {
            general: { razon_social: 'Acme', contacto: 'Ana' },
            bases_datos: [{ diccionario: 'si' }, { diccionario: 'no' }],
        };
        expect(aplanarDatos(datos)).toEqual({
            'general.razon_social': 'Acme',
            'general.contacto': 'Ana',
            'bases_datos[0].diccionario': 'si',
            'bases_datos[1].diccionario': 'no',
        });
    });

    it('tolera datos vacios o incompletos', () => {
        expect(aplanarDatos(null)).toEqual({});
        expect(aplanarDatos({ general: null, otros: 'texto suelto' })).toEqual({});
    });
});

describe('campos cambiados', () => {
    const definicion = {
        steps: [{
            id: 'general',
            fields: [{ name: 'razon_social', type: 'text' }, { name: 'acta', type: 'file' }],
        }],
    };

    it('solo devuelve lo que cambio', () => {
        const antes = { 'general.razon_social': 'Acme' };
        const ahora = { 'general.razon_social': 'Acme SA' };
        expect(camposCambiados(antes, ahora)).toEqual({ 'general.razon_social': 'Acme SA' });
    });

    it('compara por valor, no por referencia', () => {
        const antes = { 'general.tags': ['a', 'b'] };
        const ahora = { 'general.tags': ['a', 'b'] };
        expect(camposCambiados(antes, ahora)).toEqual({});
    });

    it('nunca manda archivos: esos van por su propia ruta', () => {
        const archivos = pathsDeArchivo(definicion);
        const cambios = camposCambiados(
            {},
            { 'general.razon_social': 'Acme', 'general.acta': { url_publica: 'x' } },
            archivos,
        );
        expect(cambios).toEqual({ 'general.razon_social': 'Acme' });
    });

    it('reconoce el archivo tambien dentro de un repeater', () => {
        const archivos = pathsDeArchivo({
            steps: [{ id: 'anexos', fields: [{ name: 'doc', type: 'file' }] }],
        });
        expect(camposCambiados({}, { 'anexos[2].doc': { url_publica: 'x' } }, archivos)).toEqual({});
    });
});

describe('autoria derivada del historial', () => {
    it('se queda con la ultima entrada de cada campo', () => {
        const historial = [
            { field_path: 'general.razon_social', actor_nombre: 'Ana', cambiado_en: '2026-08-21T10:00:00Z' },
            { field_path: 'general.razon_social', actor_nombre: 'Beto', cambiado_en: '2026-08-21T11:00:00Z' },
            { field_path: 'general.contacto', actor_nombre: 'Ana', cambiado_en: '2026-08-21T10:30:00Z' },
        ];
        const autoria = autoriaDesdeHistorial(historial);
        expect(autoria['general.razon_social'].actor_nombre).toBe('Beto');
        expect(autoria['general.contacto'].actor_nombre).toBe('Ana');
    });

    it('no depende de que el historial venga ordenado', () => {
        const historial = [
            { field_path: 'general.x', actor_nombre: 'Beto', cambiado_en: '2026-08-21T11:00:00Z' },
            { field_path: 'general.x', actor_nombre: 'Ana', cambiado_en: '2026-08-21T10:00:00Z' },
        ];
        expect(autoriaDesdeHistorial(historial)['general.x'].actor_nombre).toBe('Beto');
    });

    it('en un envio individual deja el nombre vacio y conserva la fecha', () => {
        const autoria = autoriaDesdeHistorial([
            { field_path: 'general.x', actor_nombre: null, cambiado_en: '2026-08-21T10:00:00Z' },
        ]);
        expect(autoria['general.x']).toEqual({
            actor_nombre: null,
            cambiado_en: '2026-08-21T10:00:00Z',
        });
    });

    it('sin historial no hay autoria', () => {
        expect(autoriaDesdeHistorial()).toEqual({});
    });
});
