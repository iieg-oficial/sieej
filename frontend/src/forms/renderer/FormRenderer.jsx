import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Typography from '@components/Typography';
import StepRenderer from './StepRenderer';
import NavigateStep from '@forms/components/wizard/NavigateStep';
import useWizard from '@forms/context/useWizard';
import useSubmission from '@forms/context/useSubmission';
import useGlobal from '@context/useGlobal';
import { requisitosPendientes, stepIncompleto, stepsConPendientes } from './completeness';
import { tieneCamposEditables } from './editableFields';

const FormRenderer = ({
    definicion, envio, catalogos,
    onSave, onSubmit, onUpload, isMobile = false,
    onMethodsReady,
}) => {
    const methods = useForm({
        defaultValues: envio?.datos ?? {},
        mode: 'onTouched',
        reValidateMode: 'onChange',
    });
    const { handleSubmit, reset, getValues, formState: { isDirty } } = methods;
    const { currentStep, goNext, goPrev, activeTab } = useWizard();
    const { openModal, closeModal } = useGlobal();
    const { marcarVisto } = useSubmission();

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
    const enviado = envio?.estado === 'enviado';
    const puedeActualizar = enviado && tieneCamposEditables(definicion);

    const cambiosPorStep = useMemo(() => {
        const map = new Map();
        (envio?.cambios_aplicados ?? []).forEach((c) => {
            const items = map.get(c.step_id) || [];
            items.push(c);
            map.set(c.step_id, items);
        });
        return map;
    }, [envio?.cambios_aplicados]);

    const valores = methods.watch();

    const pendienteMsg = !isReadOnly && step
        ? requisitosPendientes(step, { [step.id]: valores?.[step.id] })
        : null;

    const faltantesEnvio = !isReadOnly && isLast
        ? stepsConPendientes(steps, valores)
        : [];

    const bloqueoEnvio = faltantesEnvio.length
        ? `Faltan campos obligatorios en: ${faltantesEnvio.map(({ step: s }) => s.title || s.id).join(', ')}`
        : null;

    const handleSave = async (silent = false) => {
        const values = getValues();
        await onSave?.(values, currentStep, silent);
    };

    const avanzar = async (values) => {
        await onSave?.(values, currentStep, true);
        if (isLast) {
            await onSubmit?.(values);
        } else {
            goNext();
        }
    };

    const handleNext = handleSubmit(async (values) => {
        if (pendienteMsg || bloqueoEnvio) return;
        const notice = step?.incompleteNotice;
        if (notice && !isReadOnly && stepIncompleto(step, values)) {
            openModal(
                'warn',
                notice.title || 'Sección incompleta',
                notice.message || 'Aún hay campos sin llenar en esta sección. Puedes continuar de todos modos.',
                [
                    { label: 'Revisar', variant: 'secondary', onClick: closeModal },
                    {
                        label: isLast ? 'Enviar de todos modos' : 'Continuar de todos modos',
                        variant: 'primary',
                        onClick: () => {
                            closeModal();
                            avanzar(values);
                        },
                    },
                ],
            );
            return;
        }
        await avanzar(values);
    });

    const isLastTab = (() => {
        if (step?.type !== 'repeater') return true;
        const items = methods.getValues(step.id) || [];
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
                nextDisabled={!!pendienteMsg || !!bloqueoEnvio}
                nextTooltip={pendienteMsg || bloqueoEnvio}
                saveDisabled={isReadOnly || !isDirty}
                onPrev={goPrev}
                onSubmit={handleNext}
                onSave={isReadOnly ? null : handleSave}
            />

            <StepRenderer
                step={{
                    ...step,
                    allSteps: steps,
                    formNombre: definicion.nombre,
                    formDescripcion: definicion.descripcion,
                }}
                methods={methods}
                catalogos={catalogos}
                onUpload={onUpload}
                cambiosStep={cambiosPorStep.get(step.id) ?? []}
                marcarVisto={marcarVisto}
                envioId={enviado ? envio?.id : undefined}
                puedeActualizar={puedeActualizar}
            />
        </div>
    );
};

export default FormRenderer;
