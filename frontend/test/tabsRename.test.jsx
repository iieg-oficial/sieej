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
        expect(contenedor.querySelector('img[src*="ico_delete"]')).toBeNull();
    });
});
