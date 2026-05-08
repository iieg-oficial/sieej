import { describe, it, expect, vi } from 'vitest';
import { listMisEnvios, getMiEnvioDetalle } from '../src/services/formulariosServices';

const okJson = (data) => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
});

const httpErr = (status, detail = 'fail') => ({
    ok: false,
    status,
    text: async () => JSON.stringify({ detail }),
});

describe('listMisEnvios', () => {
    it('arma URL sin query si no hay params', async () => {
        const onFetch = vi.fn(() => Promise.resolve(okJson({ total: 0, items: [] })));
        await listMisEnvios(onFetch);
        expect(onFetch).toHaveBeenCalledWith(expect.stringMatching(/\/formularios\/mis-envios$/));
    });

    it('serializa estado, q, page, page_size, sort en query', async () => {
        const onFetch = vi.fn(() => Promise.resolve(okJson({ total: 0, items: [] })));
        await listMisEnvios(onFetch, {
            estado: 'enviado', q: 'levant', page: 2, page_size: 10, sort: 'nombre',
        });
        const url = onFetch.mock.calls[0][0];
        expect(url).toContain('estado=enviado');
        expect(url).toContain('q=levant');
        expect(url).toContain('page=2');
        expect(url).toContain('page_size=10');
        expect(url).toContain('sort=nombre');
    });

    it('omite params falsy', async () => {
        const onFetch = vi.fn(() => Promise.resolve(okJson({ total: 0, items: [] })));
        await listMisEnvios(onFetch, { estado: '', q: undefined, sort: '-actualizado_en' });
        const url = onFetch.mock.calls[0][0];
        expect(url).not.toContain('estado=');
        expect(url).not.toContain('q=');
        expect(url).toContain('sort=-actualizado_en');
    });

    it('parsea JSON exitoso', async () => {
        const payload = { total: 2, items: [{ id: 1 }, { id: 2 }] };
        const onFetch = vi.fn(() => Promise.resolve(okJson(payload)));
        const result = await listMisEnvios(onFetch);
        expect(result).toEqual(payload);
    });

    it('lanza error con status y data en HTTP error', async () => {
        const onFetch = vi.fn(() => Promise.resolve(httpErr(500, 'kaboom')));
        await expect(listMisEnvios(onFetch)).rejects.toMatchObject({
            message: 'kaboom',
            status: 500,
        });
    });
});

describe('getMiEnvioDetalle', () => {
    it('arma URL con envio_id', async () => {
        const onFetch = vi.fn(() => Promise.resolve(okJson({ id: 42 })));
        await getMiEnvioDetalle(onFetch, 42);
        expect(onFetch.mock.calls[0][0]).toMatch(/\/formularios\/mis-envios\/42$/);
    });

    it('parsea JSON exitoso', async () => {
        const payload = { id: 7, datos: { x: 1 }, archivos: [], eventos: [] };
        const onFetch = vi.fn(() => Promise.resolve(okJson(payload)));
        expect(await getMiEnvioDetalle(onFetch, 7)).toEqual(payload);
    });

    it('propaga 403 con status', async () => {
        const onFetch = vi.fn(() => Promise.resolve(httpErr(403, 'Este envio no te pertenece')));
        await expect(getMiEnvioDetalle(onFetch, 1)).rejects.toMatchObject({ status: 403 });
    });

    it('propaga 404 con status', async () => {
        const onFetch = vi.fn(() => Promise.resolve(httpErr(404, 'Envio no encontrado')));
        await expect(getMiEnvioDetalle(onFetch, 999)).rejects.toMatchObject({ status: 404 });
    });
});
