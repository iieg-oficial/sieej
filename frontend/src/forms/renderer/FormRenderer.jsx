import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Typography from '@components/Typography';
import StepRenderer from './StepRenderer';
import NavigateStep from '../components/wizard/NavigateStep';
import useWizard from '../context/useWizard';

const FormRenderer = ({
    definicion, envio, catalogos,
    onSave, onSubmit, onUpload, isMobile = false,
    onMethodsReady,
}) => {
    const methods = useForm({
        defaultValues: envio?.datos ?? {},
        mode: 'onBlur',
    });
    const { handleSubmit, reset, getValues } = methods;
    const { currentStep, goNext, goPrev, activeTab } = useWizard();

    useEffect(() => {
        if (envio?.datos) reset(envio.datos);
    }, [envio?.id, envio?.datos, reset]);

    useEffect(() => {
        onMethodsReady?.(methods);
    }, [methods, onMethodsReady]);

    const steps = definicion.steps ?? [];
    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep >= steps.length - 1;
    const isReadOnly = envio?.estado === 'enviado' || envio?.estado === 'expirado';

    const handleSave = async (silent = false) => {
        const values = getValues();
        await onSave?.(values, currentStep, silent);
    };

    const handleNext = handleSubmit(async (values) => {
        await onSave?.(values, currentStep, true);
        if (isLast) {
            await onSubmit?.(values);
        } else {
            goNext();
        }
    });

    const isLastTab = (() => {
        if (step?.type !== 'repeater') return true;
        const items = methods.watch(step.id) || [];
        return activeTab >= items.length - 1;
    })();

    if (!step) {
        return <Typography as="p" titleName="Sin pasos definidos." />;
    }

    return (
        <div className="w-full">
            <NavigateStep
                step={step}
                isFirst={isFirst}
                isLast={isLast}
                isLastTab={isLastTab}
                isMobile={isMobile}
                onPrev={goPrev}
                onSubmit={handleNext}
                onSave={isReadOnly ? null : handleSave}
            />

            <div className="py-4">
                <StepRenderer
                    step={{ ...step, allSteps: steps }}
                    methods={methods}
                    catalogos={catalogos}
                    datos={methods.watch()}
                    onUpload={onUpload}
                />
            </div>
        </div>
    );
};

export default FormRenderer;
