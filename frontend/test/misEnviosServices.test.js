import { describe, it, expect, vi } from 'vitest';
import { getMiEnvioDetalle } from '../src/services/formulariosServices';

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
