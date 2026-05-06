import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@components/Button';
import Typography from '@components/Typography';
import StepRenderer from './StepRenderer';

const FormRenderer = ({ definicion, envio, catalogos, currentStepIdx, onSave, onSubmit, onUpload, onPrev, onNext }) => {
    const methods = useForm({
        defaultValues: envio?.datos ?? {},
        mode: 'onBlur',
    });
    const { handleSubmit, reset } = methods;

    useEffect(() => {
        if (envio?.datos) reset(envio.datos);
    }, [envio?.id, envio?.datos, reset]);

    const steps = definicion.steps ?? [];
    const currentStep = steps[currentStepIdx];
    const isLastStep = currentStepIdx >= steps.length - 1;
    const isSummary = currentStep?.type === 'summary';
    const isReadOnly = envio?.estado === 'enviado' || envio?.estado === 'expirado';

    const handleSaveCurrent = handleSubmit((values) => onSave?.(values, currentStepIdx));
    const handleFinalSubmit = handleSubmit((values) => onSubmit?.(values));

    if (!currentStep) {
        return <Typography variant="body">Sin pasos definidos.</Typography>;
    }

    return (
        <div className="space-y-6">
            <Typography variant="heading">{currentStep.title}</Typography>

            <StepRenderer
                step={{ ...currentStep, allSteps: steps }}
                methods={methods}
                catalogos={catalogos}
                datos={methods.watch()}
                onUpload={onUpload}
            />

            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={currentStepIdx === 0}
                    onClick={onPrev}
                >
                    Anterior
                </Button>

                <div className="flex gap-3">
                    {!isReadOnly && !isSummary && (
                        <Button type="button" variant="secondary" onClick={handleSaveCurrent}>
                            Guardar
                        </Button>
                    )}
                    {!isLastStep && (
                        <Button type="button" variant="primary" onClick={() => {
                            handleSaveCurrent();
                            onNext?.();
                        }}>
                            Siguiente
                        </Button>
                    )}
                    {isLastStep && !isReadOnly && (
                        <Button type="button" variant="primary" onClick={handleFinalSubmit}>
                            Enviar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormRenderer;
