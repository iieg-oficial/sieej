import React, { useMemo, useState } from 'react';
import arrowDown from '@assets/icons/ico_down_arrow.svg';

const TIPO_BADGE = {
    nuevo: 'bg-[#EAF6ED] text-[#34A853]',
    eliminado: 'bg-[#FEDAB2] text-[#FF8300]',
    modificado: 'bg-[#FEDAB2] text-[#FF8300]',
};

const TIPO_LABEL = { nuevo: 'Nuevo', eliminado: 'Eliminado', modificado: 'Modificado' };

const buildLabelMap = (definicion) => {
    const map = {};
    (definicion?.steps ?? []).forEach((step) => {
        map[step.id] = step.title || step.id;
        (step.fields ?? []).forEach((f) => {
            map[`${step.id}.${f.name}`] = f.label || f.name;
        });
    });
    return map;
};

const Badge = ({ tipo }) => (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-garetbold ${TIPO_BADGE[tipo] || 'bg-[#F0E2F5] text-[#5C2472]'}`}>
        {TIPO_LABEL[tipo] || tipo}
    </span>
);

const UpdateBanner = ({ cambios, definicion, onEntendido }) => {
    const [mostrando, setMostrando] = useState(false);

    const labelMap = useMemo(() => buildLabelMap(definicion), [definicion]);

    const grupos = useMemo(() => {
        const porStep = new Map();
        (cambios ?? []).forEach((c) => {
            const grupo = porStep.get(c.step_id) || { stepCambio: null, items: [] };
            if (c.field_name) grupo.items.push(c);
            else grupo.stepCambio = c;
            porStep.set(c.step_id, grupo);
        });
        return [...porStep.entries()].map(([stepId, grupo]) => ({ stepId, ...grupo }));
    }, [cambios]);

    if (!cambios?.length) return null;

    return (
        <div className="mt-4 w-full rounded-[20px] border border-[#5C2472]">
            <button
                type="button"
                aria-expanded={mostrando}
                onClick={() => setMostrando((v) => !v)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 cursor-pointer bg-transparent border-none text-left"
            >
                <img
                    src={arrowDown}
                    alt=""
                    className={`w-3 h-3 transition-transform shrink-0 ${mostrando ? 'rotate-180' : ''}`}
                />
                <span className="ml-1 text-sm font-garetbold text-[#5C2472] flex-1 min-w-0">
                    El formulario se actualizó
                </span>
                <span aria-hidden="true" className="w-2 h-2 mr-2 rounded-full bg-[#5C2472] animate-pulse-soft shrink-0" />
            </button>

            {mostrando && (
                <>
                    <div className="mx-2 p-3 rounded-[12px] bg-[#F8F8F8] max-h-48 overflow-y-auto space-y-2">
                        {grupos.map(({ stepId, stepCambio, items }) => (
                            <div key={stepId}>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xs font-garetbold text-[#191919] ${stepCambio?.tipo === 'eliminado' ? 'line-through text-[#7C7C7C]' : ''}`}>
                                        {labelMap[stepId] || stepId}
                                    </span>
                                    {stepCambio && <Badge tipo={stepCambio.tipo} />}
                                </div>
                                {items.length > 0 && (
                                    <ul className="mt-1 space-y-1 pl-3">
                                        {items.map((c, i) => (
                                            <li key={i} className="flex items-center gap-1.5 break-words">
                                                <span className={`text-xs font-garetregular ${c.tipo === 'eliminado' ? 'line-through text-[#7C7C7C]' : 'text-[#191919]'}`}>
                                                    {labelMap[`${stepId}.${c.field_name}`] || c.field_name}
                                                </span>
                                                <Badge tipo={c.tipo} />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mx-2 my-0.5 flex justify-end gap-2">
                        {onEntendido && (
                            <button
                                type="button"
                                onClick={onEntendido}
                                className="cursor-pointer border-none text-xs font-garetbold px-3 py-1 rounded-full bg-transparent text-[#34A853]"
                            >
                                Entendido
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default UpdateBanner;
