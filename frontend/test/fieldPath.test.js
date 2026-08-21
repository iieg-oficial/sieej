import { describe, expect, it } from 'vitest';
import {
    aNombreRHF,
    aPathBackend,
    aplanarDatos,
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
