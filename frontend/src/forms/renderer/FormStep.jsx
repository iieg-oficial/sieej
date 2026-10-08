import React, { useMemo } from 'react';
import FieldRenderer from './FieldRenderer';
import { evaluarShowWhen } from './conditional';
import { layoutSlots, spacerClass } from '@helpers/gridLayout';

const FormStep = ({
    step, methods, catalogos, onUpload, cambiosStep = [], marcarVisto, autoria,
}) => {
    methods.watch(step.id);

    const cambioPorField = useMemo(() => {
        const map = new Map();
        cambiosStep.forEach((c) => {
            if (c.field_name) map.set(c.field_name, c);
        });
        return map;
    }, [cambiosStep]);

    const scope = methods.getValues(step.id) || {};
    const visibles = step.fields.filter((field) => evaluarShowWhen(field.showWhen, scope));
    const slots = layoutSlots(visibles);

    return (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                        autoriaField={autoria?.[fullName]}
                        onInteract={marcarVisto ? () => marcarVisto(`${step.id}.${field.name}`) : undefined}
                    />
                );
            })}
        </div>
    );
};

export default FormStep;
