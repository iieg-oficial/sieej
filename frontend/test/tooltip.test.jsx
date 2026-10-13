import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalProvider } from '../src/context/GlobalContext';
import Tooltip from '../src/components/Tooltip';

const montados = [];
let ancla = { x: 400, y: 300 };

const caja = ({ x, y, width, height }) => ({
    x, y, width, height, left: x, top: y, right: x + width, bottom: y + height, toJSON: () => ({}),
});

const render = async (props) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    montados.push({ root, container });
    await act(async () => {
        root.render(
            <GlobalProvider>
                <Tooltip text="Ayuda del campo" {...props} />
            </GlobalProvider>,
        );
    });
    return container;
};

const disparador = (container) => container.querySelector('button[aria-label="Mostrar información"]').parentElement;

const entrar = async (elemento) => {
    await act(async () => {
        elemento.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, relatedTarget: document.body }));
    });
};

const salir = async (elemento) => {
    await act(async () => {
        elemento.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body }));
    });
};

const flotante = () => document.querySelector('[data-placement]');

beforeEach(() => {
    ancla = { x: 400, y: 300 };
    window.innerWidth = 1024;
    window.innerHeight = 768;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
        if (this.hasAttribute('data-placement')) return caja({ x: 0, y: 0, width: 200, height: 40 });
        return caja({ ...ancla, width: 20, height: 20 });
    });
});

afterEach(() => {
    montados.splice(0).forEach(({ root, container }) => {
        act(() => root.unmount());
        container.remove();
    });
    vi.restoreAllMocks();
});

describe('tooltip', () => {
    it('aparece arriba del disparador, centrado, y se va al salir', async () => {
        const container = await render();
        expect(flotante()).toBeNull();
        await entrar(disparador(container));
        const panel = flotante();
        expect(container.contains(panel)).toBe(false);
        expect(panel.textContent).toContain('Ayuda del campo');
        expect(panel.dataset.placement).toBe('top');
        expect(panel.style.position).toBe('fixed');
        expect(panel.style.top).toBe('252px');
        expect(panel.style.left).toBe('310px');
        expect(panel.style.visibility).toBe('');
        await salir(disparador(container));
        expect(flotante()).toBeNull();
    });

    it('voltea abajo si no cabe arriba y se acota al viewport', async () => {
        ancla = { x: 1000, y: 20 };
        const container = await render({ size: 'small' });
        await entrar(disparador(container));
        const panel = flotante();
        expect(panel.dataset.placement).toBe('bottom');
        expect(panel.style.top).toBe('48px');
        expect(panel.style.left).toBe('816px');
    });

    it('respeta placement abajo', async () => {
        const container = await render({ placement: 'bottom' });
        await entrar(disparador(container));
        expect(flotante().dataset.placement).toBe('bottom');
        expect(flotante().style.top).toBe('328px');
    });

    it('la variante full atrapa el foco y se cierra con Esc o clic fuera', async () => {
        const container = await render({ size: 'full' });
        const boton = container.querySelector('button[aria-label="Mostrar información"]');
        boton.focus();
        await act(async () => {
            boton.click();
        });
        const dialogo = container.querySelector('[role="dialog"]');
        expect(dialogo.querySelector('button[aria-label="Cerrar"]')).toBe(document.activeElement);
        await act(async () => {
            document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        });
        expect(container.querySelector('[role="dialog"]')).toBeNull();
        expect(boton).toBe(document.activeElement);

        await act(async () => {
            boton.click();
        });
        const fondo = container.querySelector('[role="dialog"]').parentElement;
        await act(async () => {
            fondo.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }));
            fondo.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 }));
        });
        expect(container.querySelector('[role="dialog"]')).toBeNull();
    });
});
