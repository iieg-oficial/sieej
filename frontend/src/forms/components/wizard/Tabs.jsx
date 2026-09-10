import React, { useEffect, useRef, useState } from 'react';
import icoX from '@icons/ico_delete_predeterminada.svg';
import Button from '@components/Button';
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
    activeTab, visitedTabs, onTabClick, onTabRemove, onTabRename, canRemove,
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
                const allowRename = isActive && typeof onTabRename === 'function' && !isMobile;
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

                const boton = (
                    <Button
                        key={tabId}
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        variant="label"
                        label={!numbered ? itemLabel : isMobile ? index + 1 : `${index + 1}.  ${itemLabel}`}
                        sufIcon={allowRemove ? icoX : null}
                        sufIconButton={allowRemove}
                        onSufClick={allowRemove ? () => onTabRemove(item, index) : undefined}
                        isActive={isActive}
                        isVisited={visitedTabs?.has(index)}
                        onClick={() => onTabClick?.(index)}
                        className={`line-clamp-1 ${allowRename ? '' : margen}`}
                    />
                );

                if (!allowRename) return boton;

                return (
                    <span key={tabId} className={`inline-flex items-center gap-1 ${margen}`}>
                        {boton}
                        <button
                            type="button"
                            onClick={() => setEditando(index)}
                            aria-label={`Cambiar el nombre de ${itemLabel}`}
                            title="Cambiar el nombre"
                            className="
                                inline-flex items-center justify-center shrink-0 w-[26px] h-[26px] rounded-full
                                p-0! border-none! bg-transparent text-[#FF8300] cursor-pointer hover:bg-[#FEDAB2]!
                            "
                        >
                            <PencilIcon />
                        </button>
                    </span>
                );
            })}
        </div>
    );
};

export default Tabs;
