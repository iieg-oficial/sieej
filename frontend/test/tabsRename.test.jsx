import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Tabs from '../src/forms/components/wizard/Tabs';

vi.mock('@context/useGlobal', () => ({
    default: () => ({ isDesktop: true, isMobile: false, openModal: vi.fn(), screenSize: {} }),
}));

const items = [
    { id: 'a', label: 'Conjunto de datos 1', etiquetaBase: 'Conjunto de datos 1' },
    { id: 'b', label: 'Planteles', __etiqueta: 'Planteles', etiquetaBase: 'Conjunto de datos 2' },
];

let root;
let contenedor;

const montar = (props = {}) => {
    contenedor = document.createElement('div');
    document.body.appendChild(contenedor);
    root = createRoot(contenedor);
    act(() => {
        root.render(<Tabs show items={items} activeTab={1} onTabClick={vi.fn()} {...props} />);
    });
};

afterEach(() => {
    act(() => root.unmount());
    contenedor.remove();
});

const lapices = () => contenedor.querySelectorAll('[aria-label^="Cambiar el nombre"]');
const campo = () => contenedor.querySelector('input[aria-label="Nombre de la pestaña"]');

const escribir = (el, valor) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, valor);
    el.dispatchEvent(new Event('input', { bubbles: true }));
};

const tecla = (el, key) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

describe('renombrar pestañas', () => {
    it('sin onTabRename no aparece el lápiz', () => {
        montar();
        expect(lapices().length).toBe(0);
    });

    it('el lápiz solo sale en la pestaña activa', () => {
        montar({ onTabRename: vi.fn() });
        expect(lapices().length).toBe(1);
        expect(lapices()[0].getAttribute('aria-label')).toBe('Cambiar el nombre de Planteles');
    });

    it('el lápiz va dentro de la pestaña, como la ✕', () => {
        montar({ onTabRename: vi.fn() });
        expect(lapices()[0].closest('button[role="tab"]')).not.toBeNull();
    });

    it('presionar el lápiz no cuenta como elegir la pestaña', () => {
        const onTabClick = vi.fn();
        montar({ onTabRename: vi.fn(), onTabClick });
        act(() => lapices()[0].click());
        expect(onTabClick).not.toHaveBeenCalled();
        expect(campo()).not.toBeNull();
    });

    it('Enter confirma el nombre recortado', () => {
        const onTabRename = vi.fn();
        montar({ onTabRename });
        act(() => lapices()[0].click());
        expect(campo().value).toBe('Planteles');
        expect(campo().placeholder).toBe('Conjunto de datos 2');
        act(() => {
            escribir(campo(), '  Escuelas 2026  ');
            tecla(campo(), 'Enter');
        });
        expect(onTabRename).toHaveBeenCalledTimes(1);
        expect(onTabRename).toHaveBeenCalledWith(1, 'Escuelas 2026');
        expect(campo()).toBeNull();
    });

    it('Escape cancela sin tocar el nombre', () => {
        const onTabRename = vi.fn();
        montar({ onTabRename });
        act(() => lapices()[0].click());
        act(() => {
            escribir(campo(), 'otro');
            tecla(campo(), 'Escape');
        });
        expect(onTabRename).not.toHaveBeenCalled();
        expect(campo()).toBeNull();
    });

    it('canRemove decide qué pestaña se puede quitar', () => {
        montar({ onTabRemove: vi.fn(), canRemove: () => false });
        expect(contenedor.querySelector('[aria-label^="Quitar"]')).toBeNull();
    });

    it('la ✕ va dentro de la pestaña y quita sin elegir la pestaña', () => {
        const onTabRemove = vi.fn();
        const onTabClick = vi.fn();
        montar({ onTabRemove, onTabClick, canRemove: () => true });
        const x = contenedor.querySelector('[aria-label="Quitar Planteles"]');
        expect(x.closest('button[role="tab"]')).not.toBeNull();
        act(() => x.click());
        expect(onTabRemove).toHaveBeenCalledWith(items[1], 1);
        expect(onTabClick).not.toHaveBeenCalled();
    });

    it('con lápiz y ✕ juntos, los dos quedan dentro de la misma pestaña', () => {
        montar({ onTabRename: vi.fn(), onTabRemove: vi.fn(), canRemove: () => true });
        const pestana = lapices()[0].closest('button[role="tab"]');
        expect(pestana.querySelector('[aria-label="Quitar Planteles"]')).not.toBeNull();
    });
});
