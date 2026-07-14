import React from 'react';
import FormStep from './FormStep';
import RepeaterStep from './RepeaterStep';
import SummaryStep from './SummaryStep';

const StepRenderer = ({ step, methods, catalogos, onUpload, cambiosStep, marcarVisto }) => {
    switch (step.type) {
    case 'form':
        return (
            <FormStep
                step={step}
                methods={methods}
                catalogos={catalogos}
                onUpload={onUpload}
                cambiosStep={cambiosStep}
                marcarVisto={marcarVisto}
            />
        );
    case 'repeater':
        return (
            <RepeaterStep
                step={step}
                methods={methods}
                catalogos={catalogos}
                onUpload={onUpload}
                cambiosStep={cambiosStep}
                marcarVisto={marcarVisto}
            />
        );
    case 'summary':
        return (
            <SummaryStep
                definicion={{ steps: step.allSteps, nombre: step.formNombre, descripcion: step.formDescripcion }}
                methods={methods}
                catalogos={catalogos}
                summaryStep={step}
            />
        );
    default:
        return <p>Tipo de step no soportado: {step.type}</p>;
    }
};

export default StepRenderer;
