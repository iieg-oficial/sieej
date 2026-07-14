import React, { useMemo, useState } from 'react';

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

const UpdateBanner = ({ cambiosPreview, definicion, onActualizar }) => {
    const [mostrando, setMostrando] = useState(false);
    const [actualizando, setActualizando] = useState(false);

    const labelMap = useMemo(() => buildLabelMap(definicion), [definicion]);

    const handleActualizar = async () => {
        setActualizando(true);
        try {
            await onActualizar?.();
        } finally {
            setActualizando(false);
        }
    };

    return (
        <div className="mt-4">
            <div className="flex items-center gap-1 flex-wrap">
                <button
                    type="button"
                    onClick={handleActualizar}
                    disabled={actualizando}
                    title="Actualiza tu envío a la versión más reciente del formulario. Tus respuestas se conservan."
                    className="flex items-center justify-center h-[40px] rounded-[20px] px-6 bg-[#FEDAB2] text-[#FF8300] border border-[#FF8300] font-garetbold text-sm hover:shadow-[0px_8px_16px_#6E6E6E29] disabled:bg-[#CBCBCB] disabled:text-[#5B6670] disabled:border-[#CBCBCB] disabled:cursor-not-allowed cursor-pointer"
                >
                    {actualizando ? (
                        <span className="inline-block w-4 h-4 border-2 border-[#FF8300] border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    Actualizar formulario
                </button>
                <button
                    type="button"
                    onClick={() => setMostrando((v) => !v)}
                    className="flex items-center gap-1 text-sm text-[#5C2472] hover:underline cursor-pointer bg-transparent border-none p-0 font-garetregular"
                >
                    {mostrando ? 'Ocultar cambios' : 'Ver cambios'}
                </button>
            </div>

            {mostrando && cambiosPreview && cambiosPreview.length > 0 && (
                <ul className="mt-2 space-y-1.5 text-xs pl-6">
                    {cambiosPreview.map((c, i) => {
                        const stepLabel = labelMap[c.step_id] || c.step_id;
                        const fieldLabel = c.field_name
                            ? labelMap[`${c.step_id}.${c.field_name}`] || c.field_name
                            : null;
                        return (
                            <li key={i} className="flex items-center gap-1.5 break-words">
                                <span className="font-garetbold shrink-0">{stepLabel}</span>
                                {fieldLabel && (
                                    <>
                                        <span className="text-[#CBCBCB] shrink-0 font-garetregular">·</span>
                                        <span className="shrink-0 font-garetregular">{fieldLabel}</span>
                                    </>
                                )}
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-garetbold ml-1 ${TIPO_BADGE[c.tipo] || 'bg-[#F0E2F5] text-[#5C2472]'}`}>
                                    {TIPO_LABEL[c.tipo] || c.tipo}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default UpdateBanner;
