import React, { useMemo } from 'react';
import FieldRenderer from './FieldRenderer';
import { evaluarShowWhen } from './conditional';
import { layoutSlots, spacerClass } from '@helpers/gridLayout';

const FormStep = ({ step, methods, catalogos, onUpload, cambiosStep = [], marcarVisto }) => {
    const watched = methods.watch(step.id);
    const stepValues = useMemo(() => watched || {}, [watched]);

    const cambioPorField = useMemo(() => {
        const map = new Map();
        cambiosStep.forEach((c) => {
            if (c.field_name) map.set(c.field_name, c);
        });
        return map;
    }, [cambiosStep]);

    const tieneCambiosStep = useMemo(() => {
        return cambiosStep.some((c) => !c.field_name) || cambiosStep.length > 0;
    }, [cambiosStep]);

    const visibles = useMemo(
        () => step.fields.filter((field) => evaluarShowWhen(field.showWhen, stepValues)),
        [step.fields, stepValues],
    );

    const slots = useMemo(() => layoutSlots(visibles), [visibles]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {tieneCambiosStep && (
                <div className="md:col-span-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-garetbold bg-[#F0E2F5] text-[#5C2472]">
                        Actualizado
                    </span>
                </div>
            )}
            {slots.map((slot, i) => {
                if (slot.kind === 'spacer') {
                    return <div key={`spacer-${i}`} aria-hidden className={spacerClass(slot.units)} />;
                }
                const field = visibles[slot.idx];
                const fullName = `${step.id}.${field.name}`;
                const cambio = cambioPorField.get(field.name);
                return (
                    <FieldRenderer
                        key={fullName}
                        field={{ ...field, name: fullName }}
                        placement={slot}
                        methods={methods}
                        catalogos={catalogos}
                        onUpload={(_n, file) => onUpload?.(fullName, file)}
                        cambioField={cambio}
                        onInteract={marcarVisto ? () => marcarVisto(`${step.id}.${field.name}`) : undefined}
                    />
                );
            })}
        </div>
    );
};

export default FormStep;
