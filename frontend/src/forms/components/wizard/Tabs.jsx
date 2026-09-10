import React, { useEffect, useRef, useState } from 'react';
import Button from '@components/Button';
import ClearIcon from '@components/icons/ClearIcon';
import PencilIcon from '@components/icons/PencilIcon';

const NOMBRE_MAX = 60;

const CampoNombre = ({ inicial, placeholder, onConfirm, onCancel }) => {
    const [valor, setValor] = useState(inicial);
    const cerrado = useRef(false);
    const campo = useRef(null);

    useEffect(() => {
        campo.current?.focus();
        campo.current?.select();
    }, []);
    const cerrar = (accion) => {
        if (cerrado.current) return;
        cerrado.current = true;
        accion();
    };

    return (
        <input
            ref={campo}
            value={valor}
            maxLength={NOMBRE_MAX}
            placeholder={placeholder}
            aria-label="Nombre de la pestaña"
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => cerrar(() => onConfirm(valor))}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    cerrar(() => onConfirm(valor));
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cerrar(onCancel);
                }
            }}
            className="
                h-[30px] w-[240px] max-w-full px-3 mr-4 rounded-lg border border-[#FF8300] bg-white
                text-[13px] font-garetmedium text-[#191919] focus:outline-none focus:ring-1 focus:ring-[#FF8300]
            "
        />
    );
};

const Tabs = ({
    show, vertical, className, items = [],
    activeTab, visitedTabs, onTabClick, onTabRemove, onTabRename, canRemove, esNuevo,
    isMobile = false, numbered = true,
}) => {
    const [editando, setEditando] = useState(null);

    if (!show) return null;

    const margen = vertical ? 'mb-0' : 'mr-4';

    return (
        <div
            role="tablist"
            aria-orientation={vertical ? 'vertical' : 'horizontal'}
            className={`flex flex-wrap bg-white ${className ?? ''} ${vertical ? 'flex-col items-start' : 'w-full items-center'}`}
        >
            {items.map((item, index) => {
                const isActive = activeTab === index;
                const allowRemove = isActive && typeof onTabRemove === 'function'
                    && (typeof canRemove !== 'function' || canRemove(item, index));
                const allowRename = isActive && typeof onTabRename === 'function';
                const nuevo = typeof esNuevo === 'function' && esNuevo(item, index);
                const tabId = item.id ?? item._id ?? `tab-${index}`;
                const itemLabel = item.label || item.nombre_bd || item.nombre || `Item ${index + 1}`;

                if (editando === index && typeof onTabRename === 'function') {
                    return (
                        <CampoNombre
                            key={tabId}
                            inicial={item.__etiqueta || ''}
                            placeholder={item.etiquetaBase || itemLabel}
                            onConfirm={(valor) => {
                                setEditando(null);
                                onTabRename(index, valor.trim());
                            }}
                            onCancel={() => setEditando(null)}
                        />
                    );
                }

                const lapiz = allowRename ? (
                    <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Cambiar el nombre de ${itemLabel}`}
                        title="Cambiar el nombre"
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditando(index);
                        }}
                        onKeyDown={(e) => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            e.stopPropagation();
                            setEditando(index);
                        }}
                        className="ml-3 inline-flex items-center justify-center w-[20px] h-[20px] rounded-full cursor-pointer text-[#FF8300] hover:bg-white"
                    >
                        <PencilIcon size={12} />
                    </span>
                ) : null;

                const quitar = allowRemove ? (
                    <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Quitar ${itemLabel}`}
                        title="Quitar"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTabRemove(item, index);
                        }}
                        onKeyDown={(e) => {
                            if (e.key !== 'Enter' && e.key !== ' ') return;
                            e.preventDefault();
                            e.stopPropagation();
                            onTabRemove(item, index);
                        }}
                        className={`${lapiz ? 'ml-1' : 'ml-3'} inline-flex items-center justify-center w-[20px] h-[20px] rounded-full cursor-pointer text-[#FF8300] hover:bg-white`}
                    >
                        <ClearIcon size={12} />
                    </span>
                ) : null;

                const label = !numbered ? itemLabel : isMobile ? index + 1 : `${index + 1}.  ${itemLabel}`;

                return (
                    <span key={tabId} className={`relative inline-flex ${margen}`}>
                        <Button
                            role="tab"
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            variant="label"
                            label={label}
                            sufExtra={lapiz || quitar ? <>{lapiz}{quitar}</> : null}
                            isActive={isActive}
                            isVisited={visitedTabs?.has(index)}
                            onClick={() => onTabClick?.(index)}
                            className="line-clamp-1"
                            {...(nuevo && { 'aria-label': `${label}, nuevo` })}
                        />
                        {nuevo && (
                            <span
                                aria-hidden
                                data-nuevo
                                className="absolute -top-[5px] -right-[5px] w-2 h-2 rounded-full bg-[#32A752] pointer-events-none"
                            />
                        )}
                    </span>
                );
            })}
        </div>
    );
};

export default Tabs;
