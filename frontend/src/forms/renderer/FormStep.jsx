import React from 'react';
import FieldRenderer from './FieldRenderer';
import { evaluarShowWhen } from './conditional';

const FormStep = ({ step, methods, catalogos, onUpload }) => {
    const stepValues = methods.watch(step.id) || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {step.fields.map((field) => {
                if (!evaluarShowWhen(field.showWhen, stepValues)) return null;
                const fullName = `${step.id}.${field.name}`;
                return (
                    <FieldRenderer
                        key={fullName}
                        field={{ ...field, name: fullName }}
                        methods={methods}
                        catalogos={catalogos}
                        onUpload={(_n, file) => onUpload?.(fullName, file)}
                    />
                );
            })}
        </div>
    );
};

export default FormStep;
