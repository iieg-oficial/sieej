import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import RootErrorBoundary from '../src/components/RootErrorBoundary';

const Explota = () => {
    throw new Error('fallo de render');
};

const render = async (children) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
        createRoot(container).render(<RootErrorBoundary basename="/">{children}</RootErrorBoundary>);
    });
    return container;
};

afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
});

describe('RootErrorBoundary', () => {
    it('renderiza los hijos cuando no hay error', async () => {
        const container = await render(<p>contenido</p>);
        expect(container.textContent).toContain('contenido');
    });

    it('muestra ErrorPage con el mensaje del error capturado', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const container = await render(<Explota />);
        expect(container.textContent).toContain('Algo salió mal...');
        expect(container.textContent).toContain('fallo de render');
    });
});
