import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { SubmissionProvider } from '@forms/context/SubmissionContext';
import useSubmission from '@forms/context/useSubmission';
import { WizardProvider } from '@forms/context/WizardContext';
import useWizard from '@forms/context/useWizard';
import FormRenderer from '@forms/renderer/FormRenderer';
import StepIndicator from '@forms/components/wizard/StepIndicator';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Button from '@components/Button';
import Modal from '@components/Modal';
import useGlobal from '@context/useGlobal';
import useCatalogos from '@forms/context/useCatalogos';

const construirMapaLabels = (definicion) => {
    const mapa = {};
    (definicion?.steps ?? []).forEach((step) => {
        mapa[step.id] = {
            title: step.title || step.id,
            fields: Object.fromEntries(
                (step.fields ?? []).map((f) => [f.name, f.label || f.name]),
            ),
        };
    });
    return mapa;
};

const formatearErrores = (errores, definicion) => {
    const mapa = construirMapaLabels(definicion);
    const lineas = errores.map(({ path, msg }) => {
        const match = String(path).match(/^([^.[]+)(?:\[(\d+)\])?(?:\.(.+))?$/);
        if (!match) return `${path}: ${msg}`;
        const [, stepId, idx, fieldName] = match;
        const step = mapa[stepId];
        if (!step) return `${path}: ${msg}`;
        const prefijo = idx !== undefined ? `${step.title} (#${Number(idx) + 1})` : step.title;
        if (fieldName) {
            return `${prefijo} › ${step.fields[fieldName] || fieldName}: ${msg}`;
        }
        return `${prefijo}: ${msg}`;
    });
    const MAX = 12;
    const extra = lineas.length - MAX;
    return lineas.slice(0, MAX).join(' · ') + (extra > 0 ? ` · (+${extra} más)` : '');
};

const FormularioContent = () => {
    const { definicion, envio, loading, error, guardar, enviar, subirArchivo } = useSubmission();
    const { currentStep, activeTab, visitedTabs, sizeTabs, onActiveTab } = useWizard();
    const { onMessage, isMobile, openModal } = useGlobal();
    const { catalogos } = useCatalogos();
    const navigate = useNavigate();
    const [methods, setMethods] = useState(null);

    if (loading) return <div className="flex justify-center py-10"><Loading /></div>;
    if (error) {
        return (
            <div className="rounded-[20px] bg-white p-7 text-center space-y-4">
                <Typography as="h2" titleName="Error" />
                <Typography as="p" titleName={error} />
                <Button label="Volver" variant="primary" onClick={() => navigate('/')} center />
            </div>
        );
    }
    if (!definicion) return null;

    const notificarError = (e, titulo) => {
        const errores = e?.data?.detail?.errores;
        const mensaje = Array.isArray(errores) && errores.length
            ? formatearErrores(errores, definicion)
            : e.message;
        openModal('error', titulo, mensaje);
    };

    const handleSave = async (values, paso, silent = false) => {
        try {
            await guardar(values, paso ?? currentStep);
            if (!silent) onMessage?.(false, 'Borrador guardado');
        } catch (e) {
            notificarError(e, 'No se pudo guardar el borrador');
        }
    };

    const handleSubmit = async (values) => {
        try {
            await enviar(values);
            onMessage?.(false, 'Enviado');
            navigate('/');
        } catch (e) {
            notificarError(e, 'Faltan datos por completar');
        }
    };

    const handleUpload = async (fieldPath, file) => {
        try {
            return await subirArchivo(fieldPath, file);
        } catch (e) {
            notificarError(e, 'No se pudo subir el archivo');
            throw e;
        }
    };

    const steps = definicion.steps ?? [];
    const showSidePanel = steps.length > 1;
    const currentStepData = steps[currentStep];
    const repeaterItems = currentStepData?.type === 'repeater' && methods
        ? (methods.watch(currentStepData.id) || []).map((item, idx) => ({
            id: `${currentStepData.id}-${idx}`,
            label: item?.nombre_bd || item?.nombres || item?.nombre || `Item ${idx + 1}`,
            ...item,
        }))
        : [];

    const handleTabRemove = (_item, idx) => {
        if (!methods) return;
        const list = methods.getValues(currentStepData.id) || [];
        list.splice(idx, 1);
        methods.setValue(currentStepData.id, list);
        const newActive = Math.max(0, Math.min(activeTab, list.length - 1));
        onActiveTab?.(newActive);
    };

    return (
        <React.Fragment>
            <div className="flex space-x-2 md:space-x-5">
                {showSidePanel && (
                    <div className="hidden xl:block w-[513px] rounded-[20px] bg-white p-7 sx:hidden lg:w-[670px] lg:p-10">
                        <div className="flex flex-col space-y-4 items-start justify-start sticky top-10">
                            <Typography
                                as="h1"
                                titleName={definicion.nombre || 'Formulario'}
                            />
                            {definicion.descripcion && (
                                <Typography
                                    as="h3"
                                    className="text-[#191919] font-garetregular"
                                    titleName={definicion.descripcion}
                                />
                            )}
                            <StepIndicator
                                steps={steps}
                                currentStep={currentStep}
                                repeaterItems={repeaterItems}
                                activeTab={activeTab}
                                visitedTabs={visitedTabs}
                                sizeTabs={sizeTabs}
                                onTabClick={onActiveTab}
                                onTabRemove={handleTabRemove}
                            />
                        </div>
                    </div>
                )}
                <div
                    className="
                        w-full flex flex-col items-start justify-start rounded-[20px]
                        bg-white shadow-xl-[#03222708] px-2 pb-2 md:px-10 md:pb-10 text-black
                    "
                >
                    <FormRenderer
                        definicion={definicion}
                        envio={envio}
                        catalogos={catalogos}
                        isMobile={isMobile}
                        onSave={handleSave}
                        onSubmit={handleSubmit}
                        onUpload={handleUpload}
                        onMethodsReady={setMethods}
                    />
                </div>
            </div>
            <Modal />
        </React.Fragment>
    );
};

const FormSizer = () => {
    const { definicion, loading } = useSubmission();
    if (loading || !definicion) return <div className="flex justify-center py-10"><Loading /></div>;
    return (
        <WizardProvider totalSteps={definicion.steps.length}>
            <FormularioContent />
        </WizardProvider>
    );
};

const FormPage = () => {
    const { slug } = useParams();
    return (
        <SubmissionProvider slug={slug}>
            <FormSizer />
        </SubmissionProvider>
    );
};

export default FormPage;
