import React, { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import PlusIcon from '@components/icons/PlusIcon';
import Tooltip from '@components/Tooltip';
import Typography from '@components/Typography';
import Tabs from '@forms/components/wizard/Tabs';
import CampoConHistorial from '@forms/components/CampoConHistorial';
import useGlobal from '@context/useGlobal';
import FieldRenderer from '@forms/renderer/FieldRenderer';
import { evaluarShowWhen } from '@forms/renderer/conditional';
import {
    buildRepeaterItems, CLAVE_ETIQUETA, renderItemLabel, resolverTabDeCampo,
} from '@forms/renderer/repeaterItems';
import { layoutSlots, spacerClass } from '@helpers/gridLayout';

const RepeaterActualizable = ({
    step, fields, methods, catalogos, onUpload, historialPorCampo,
    originales, onArchivoPendiente, onQuitarElemento,
}) => {
    const { append, remove } = useFieldArray({ control: methods.control, name: step.id });
    const { isMobile } = useGlobal();
    const tabs = Array.isArray(step.tabs) && step.tabs.length ? step.tabs : null;
    const [activo, setActivo] = useState(0);
    const [subtab, setSubtab] = useState(tabs?.[0]?.id);

    const lista = methods.watch(step.id);
    const count = Array.isArray(lista) ? lista.length : 0;
    const actual = Math.max(0, Math.min(activo, count - 1));
    const esNuevo = actual >= originales;
    const maxItems = step.maxItems ?? null;
    const valoresItem = (Array.isArray(lista) ? lista[actual] : null) || {};

    const items = buildRepeaterItems(step, lista || []).map((item, idx) => (
        idx >= originales ? { ...item, label: `${item.label} (nuevo)` } : item
    ));

    const etiquetaAgregar = `Agregar ${renderItemLabel(step.itemLabel || 'Elemento {{index}}', count)}`;

    const elegir = (idx) => {
        setActivo(idx);
        setSubtab(tabs?.[0]?.id);
    };

    const agregar = () => {
        append({});
        elegir(count);
    };

    const quitar = (idx) => {
        remove(idx);
        onQuitarElemento?.(idx);
        setActivo(Math.max(0, Math.min(actual, count - 2)));
    };

    const renombrar = (idx, nombre) => methods.setValue(
        `${step.id}.${idx}.${CLAVE_ETIQUETA}`, nombre || null, { shouldDirty: true },
    );

    const visiblesNuevo = (step.fields || []).filter((field) => {
        if (!evaluarShowWhen(field.showWhen, valoresItem)) return false;
        if (tabs && resolverTabDeCampo(field, tabs) !== subtab) return false;
        return true;
    });

    return (
        <section className="space-y-4">
            <Typography as="h3" titleName={step.title} />
            <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                    <Tabs
                        show
                        items={items}
                        activeTab={actual}
                        onTabClick={elegir}
                        onTabRemove={(_item, idx) => quitar(idx)}
                        canRemove={(_item, idx) => idx >= originales}
                        onTabRename={renombrar}
                        isMobile={isMobile}
                    />
                </div>
                {(maxItems === null || count < maxItems) && (
                    <Tooltip text={etiquetaAgregar} showIcon={false} size="small">
                        <button
                            type="button"
                            onClick={agregar}
                            aria-label={etiquetaAgregar}
                            className="
                                flex items-center justify-center shrink-0 w-[38px] h-[38px] rounded-full p-0!
                                bg-[#F8F8F8] border-none! text-[#5C2472]
                                hover:bg-white hover:shadow-[0px_8px_16px_#6E6E6E29]
                            "
                        >
                            <PlusIcon size={24} className="shrink-0" />
                        </button>
                    </Tooltip>
                )}
            </div>

            {count > 0 && esNuevo && tabs && (
                <div className="flex gap-2 mb-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSubtab(tab.id)}
                            className={`px-4 py-2 text-sm border-b-2! transition ${
                                subtab === tab.id
                                    ? 'border-b-[#5C2472]! text-[#5C2472] font-garetbold!'
                                    : 'border-b-transparent! text-[#7C7C7C] font-garetregular! hover:text-[#5C2472]'
                            }`}
                        >
                            {tab.title}
                        </button>
                    ))}
                </div>
            )}

            {count > 0 && esNuevo && (
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {layoutSlots(visiblesNuevo).map((slot, i) => {
                        if (slot.kind === 'spacer') {
                            return <div key={`spacer-${i}`} aria-hidden className={spacerClass(slot.units)} />;
                        }
                        const field = visiblesNuevo[slot.idx];
                        const fullName = `${step.id}.${actual}.${field.name}`;
                        const ruta = `${step.id}[${actual}].${field.name}`;
                        return (
                            <FieldRenderer
                                key={fullName}
                                field={{ ...field, name: fullName }}
                                placement={slot}
                                methods={methods}
                                catalogos={catalogos}
                                onUpload={async (_name, file) => {
                                    onArchivoPendiente?.(ruta, file);
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {count > 0 && !esNuevo && (
                <div className="space-y-5">
                    {fields.map((field) => {
                        if (!evaluarShowWhen(field.showWhen, valoresItem)) return null;
                        const fullName = `${step.id}[${actual}].${field.name}`;
                        return (
                            <CampoConHistorial
                                key={fullName}
                                field={field}
                                fullName={fullName}
                                methods={methods}
                                catalogos={catalogos}
                                onUpload={onUpload}
                                historial={historialPorCampo[fullName] || []}
                            />
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default RepeaterActualizable;
