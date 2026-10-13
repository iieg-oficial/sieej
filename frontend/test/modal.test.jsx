import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalProvider } from '../src/context/GlobalContext';
import useGlobal from '../src/context/useGlobal';
import Modal from '../src/components/Modal';

const Abridor = ({ tipo }) => {
    const { openModal } = useGlobal();
    return <button type="button" onClick={() => openModal(tipo)}>Abrir</button>;
};

const montados = [];

const render = async (tipo = 'warn') => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    montados.push({ root, container });
    await act(async () => {
        root.render(
            <GlobalProvider>
                <Abridor tipo={tipo} />
                <Modal />
            </GlobalProvider>,
        );
    });
    return container;
};

const abrir = async (container) => {
    const disparador = container.querySelector('button');
    disparador.focus();
    await act(async () => {
        disparador.click();
    });
    return disparador;
};

const boton = (texto) => [...document.querySelectorAll('[role="dialog"] button')]
    .find((item) => item.textContent.includes(texto));

const tecla = async (key, opciones = {}) => {
    await act(async () => {
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', {
            key, bubbles: true, cancelable: true, ...opciones,
        }));
    });
};

const presionar = async (elemento) => {
    await act(async () => {
        elemento.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1 }));
        elemento.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 }));
    });
};

afterEach(() => {
    montados.splice(0).forEach(({ root, container }) => {
        act(() => root.unmount());
        container.remove();
    });
    vi.useRealTimers();
});

describe('modal global', () => {
    it('se monta en un portal, enfoca dentro y cicla con Tab', async () => {
        const container = await render();
        await abrir(container);
        const dialogo = document.querySelector('[role="dialog"]');
        expect(container.contains(dialogo)).toBe(false);
        expect(container.hasAttribute('inert')).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
        expect(boton('Cancelar')).toBe(document.activeElement);

        await tecla('Tab', { shiftKey: true });
        expect(boton('Confirmar')).toBe(document.activeElement);
        await tecla('Tab');
        expect(boton('Cancelar')).toBe(document.activeElement);
    });

    it('Esc cierra, libera el scroll y regresa el foco al disparador', async () => {
        const container = await render();
        const disparador = await abrir(container);
        await tecla('Escape');
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(document.body.style.overflow).toBe('');
        expect(container.hasAttribute('inert')).toBe(false);
        expect(disparador).toBe(document.activeElement);
    });

    it('cierra con un clic en el fondo y no con uno dentro', async () => {
        const container = await render();
        await abrir(container);
        await presionar(document.querySelector('[role="dialog"]'));
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        await presionar(document.querySelector('[role="dialog"]').parentElement);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('el de éxito se cierra solo', async () => {
        vi.useFakeTimers();
        const container = await render('success');
        await abrir(container);
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        await act(async () => {
            vi.advanceTimersByTime(1500);
        });
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
});
