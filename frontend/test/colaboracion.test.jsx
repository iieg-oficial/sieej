import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import useColaboracion from '../src/forms/hooks/useColaboracion';

const definicion = {
    steps: [{
        id: 'general',
        fields: [
            { name: 'razon_social', type: 'text' },
            { name: 'contacto', type: 'text' },
            { name: 'acta', type: 'file' },
        ],
    }],
};

let metodos = null;
let ultimosPresentes = [];

const Sonda = ({ defaults, capturar, activo, onError, sincronizar }) => {
    const methods = useForm({ defaultValues: defaults });
    metodos = methods;
    const { presentes } = useColaboracion(methods, {
        activo, definicion, capturar, sincronizar, seccion: 'general', onError,
    });
    ultimosPresentes = presentes;
    return null;
};

const montar = ({
    defaults = { general: {} }, activo = true, capturar, onError, sincronizar,
} = {}) => {
    const espia = capturar ?? vi.fn().mockResolvedValue({ datos_version: 1 });
    const contenedor = document.createElement('div');
    document.body.appendChild(contenedor);
    const root = createRoot(contenedor);
    act(() => {
        root.render(
            <Sonda
                defaults={defaults}
                capturar={espia}
                activo={activo}
                onError={onError}
                sincronizar={sincronizar}
            />,
        );
    });
    return { capturar: espia, desmontar: () => act(() => root.unmount()) };
};

const escribir = async (campo, valor) => {
    await act(async () => {
        metodos.setValue(campo, valor);
    });
};

const esperarDebounce = async () => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
    });
};

describe('autosave por campo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        metodos = null;
    });
    afterEach(() => vi.useRealTimers());

    it('no manda nada mientras la persona sigue escribiendo', async () => {
        const { capturar, desmontar } = montar();

        await escribir('general.razon_social', 'Ac');
        await act(async () => { await vi.advanceTimersByTimeAsync(800); });
        await escribir('general.razon_social', 'Acme');
        await act(async () => { await vi.advanceTimersByTimeAsync(800); });

        expect(capturar).not.toHaveBeenCalled();
        desmontar();
    });

    it('manda un solo lote cuando se detiene', async () => {
        const { capturar, desmontar } = montar();

        await escribir('general.razon_social', 'Ac');
        await escribir('general.razon_social', 'Acme');
        await esperarDebounce();

        expect(capturar).toHaveBeenCalledTimes(1);
        expect(capturar).toHaveBeenCalledWith({ 'general.razon_social': 'Acme' });
        desmontar();
    });

    it('junta en un lote los campos tocados en la misma pausa', async () => {
        const { capturar, desmontar } = montar();

        await escribir('general.razon_social', 'Acme');
        await escribir('general.contacto', 'Ana');
        await esperarDebounce();

        expect(capturar).toHaveBeenCalledWith({
            'general.razon_social': 'Acme',
            'general.contacto': 'Ana',
        });
        desmontar();
    });

    it('solo manda lo que cambio respecto de lo ya enviado', async () => {
        const { capturar, desmontar } = montar({
            defaults: { general: { razon_social: 'Acme', contacto: '' } },
        });

        await escribir('general.contacto', 'Ana');
        await esperarDebounce();

        expect(capturar).toHaveBeenCalledWith({ 'general.contacto': 'Ana' });
        desmontar();
    });

    it('no repite un campo que ya viajo', async () => {
        const { capturar, desmontar } = montar();

        await escribir('general.razon_social', 'Acme');
        await esperarDebounce();
        await escribir('general.contacto', 'Ana');
        await esperarDebounce();

        expect(capturar).toHaveBeenCalledTimes(2);
        expect(capturar).toHaveBeenLastCalledWith({ 'general.contacto': 'Ana' });
        desmontar();
    });

    it('nunca manda un archivo por esta via', async () => {
        const { capturar, desmontar } = montar();

        await escribir('general.acta', { url_publica: 'x' });
        await esperarDebounce();

        expect(capturar).not.toHaveBeenCalled();
        desmontar();
    });

    it('un campo que fallo se reintenta en el siguiente lote', async () => {
        const capturar = vi.fn()
            .mockRejectedValueOnce(new Error('conflicto'))
            .mockResolvedValue({ datos_version: 2 });
        const onError = vi.fn();
        const { desmontar } = montar({ capturar, onError });

        await escribir('general.razon_social', 'Acme');
        await esperarDebounce();
        await escribir('general.contacto', 'Ana');
        await esperarDebounce();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(capturar).toHaveBeenCalledTimes(2);
        expect(capturar).toHaveBeenLastCalledWith({
            'general.razon_social': 'Acme',
            'general.contacto': 'Ana',
        });
        desmontar();
    });

    it('en un formulario individual el autosave ni se engancha', async () => {
        const { capturar, desmontar } = montar({ activo: false });

        await escribir('general.razon_social', 'Acme');
        await esperarDebounce();

        expect(capturar).not.toHaveBeenCalled();
        desmontar();
    });
});

describe('delta en vivo y presencia', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        metodos = null;
        ultimosPresentes = [];
    });
    afterEach(() => vi.useRealTimers());

    const respuesta = (cambios = [], presentes = []) => ({
        datos_version: 2, estado: 'en_proceso', cambios, presentes,
    });

    it('escribe en el formulario lo que capturo el companero', async () => {
        const sincronizar = vi.fn().mockResolvedValue(respuesta([
            { field_path: 'general.contacto', valor_nuevo: 'Beto' },
        ]));
        const { desmontar } = montar({ sincronizar });

        await act(async () => { await Promise.resolve(); });

        expect(metodos.getValues('general.contacto')).toBe('Beto');
        desmontar();
    });

    it('traduce el path del repeater al nombre que usa el wizard', async () => {
        const sincronizar = vi.fn().mockResolvedValue(respuesta([
            { field_path: 'bases_datos[0].diccionario', valor_nuevo: 'si' },
        ]));
        const { desmontar } = montar({
            defaults: { bases_datos: [{ diccionario: '' }] },
            sincronizar,
        });

        await act(async () => { await Promise.resolve(); });

        expect(metodos.getValues('bases_datos.0.diccionario')).toBe('si');
        desmontar();
    });

    it('no pisa un campo con cambios que todavia no viajan', async () => {
        const capturar = vi.fn().mockRejectedValue(new Error('sin red'));
        const sincronizar = vi.fn()
            .mockResolvedValueOnce(respuesta())
            .mockResolvedValue(respuesta([
                { field_path: 'general.contacto', valor_nuevo: 'Beto' },
            ]));
        const { desmontar } = montar({ capturar, sincronizar, onError: vi.fn() });
        await act(async () => { await Promise.resolve(); });

        await escribir('general.contacto', 'Ana');
        await act(async () => { await vi.advanceTimersByTimeAsync(40000); });

        expect(metodos.getValues('general.contacto')).toBe('Ana');
        desmontar();
    });

    it('deja de latir al desmontar', async () => {
        const sincronizar = vi.fn().mockResolvedValue(respuesta());
        const { desmontar } = montar({ sincronizar });
        await act(async () => { await Promise.resolve(); });
        const llamadas = sincronizar.mock.calls.length;

        desmontar();
        await act(async () => { await vi.advanceTimersByTimeAsync(120000); });

        expect(sincronizar.mock.calls.length).toBe(llamadas);
    });

    it('expone a quien esta viendo el mismo envio', async () => {
        const sincronizar = vi.fn().mockResolvedValue(respuesta([], [
            { username: 'beto', name: 'Beto Ruiz', seccion: 'general' },
        ]));
        const { desmontar } = montar({ sincronizar });

        await act(async () => { await Promise.resolve(); });

        expect(ultimosPresentes).toEqual([
            { username: 'beto', name: 'Beto Ruiz', seccion: 'general' },
        ]);
        desmontar();
    });

    it('en solitario late mas espaciado que acompanado', async () => {
        const sincronizar = vi.fn().mockResolvedValue(respuesta());
        const { desmontar } = montar({ sincronizar });
        await act(async () => { await Promise.resolve(); });
        expect(sincronizar).toHaveBeenCalledTimes(1);

        await act(async () => { await vi.advanceTimersByTimeAsync(11000); });
        expect(sincronizar).toHaveBeenCalledTimes(1);

        await act(async () => { await vi.advanceTimersByTimeAsync(25000); });
        expect(sincronizar).toHaveBeenCalledTimes(2);
        desmontar();
    });

    it('sin sincronizar no hay latido', async () => {
        const { desmontar } = montar({});
        await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
        expect(ultimosPresentes).toEqual([]);
        desmontar();
    });
});
