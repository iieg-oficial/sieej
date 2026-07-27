import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { SubmissionProvider } from '@forms/context/SubmissionContext';
import useSubmission from '@forms/context/useSubmission';
import { WizardProvider } from '@forms/context/WizardContext';
import useWizard from '@forms/context/useWizard';
import FormRenderer from '@forms/renderer/FormRenderer';
import StepIndicator from '@forms/components/wizard/StepIndicator';
import UpdateBanner from '@forms/components/wizard/UpdateBanner';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import BackLink from '@components/BackLink';
import Button from '@components/Button';
import Modal from '@components/Modal';
import useGlobal from '@context/useGlobal';
import useCatalogos from '@forms/context/useCatalogos';
import { buildRepeaterItems } from '@forms/renderer/repeaterItems';
import { stepCompleteness } from '@forms/renderer/completeness';

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

const MSG_AMIGABLE = {
    'telefono invalido': 'Teléfono inválido: deben ser 10 dígitos',
    'email invalido': 'Correo electrónico con formato inválido',
    'formato invalido': 'Formato inválido',
    'requerido': 'Este campo es obligatorio',
    'fecha invalida (YYYY-MM-DD)': 'Fecha inválida',
};

const formatearErrores = (errores, definicion) => {
    const mapa = construirMapaLabels(definicion);
    const lineas = errores.map(({ path, msg }) => {
        const texto = MSG_AMIGABLE[msg] || msg;
        const match = String(path).match(/^([^.[]+)(?:\[(\d+)\])?(?:\.(.+))?$/);
        if (!match) return `${path}: ${texto}`;
        const [, stepId, idx, fieldName] = match;
        const step = mapa[stepId];
        if (!step) return `${path}: ${texto}`;
        const prefijo = idx !== undefined ? `${step.title} (#${Number(idx) + 1})` : step.title;
        if (fieldName) {
            return `${prefijo} › ${step.fields[fieldName] || fieldName}: ${texto}`;
        }
        return `${prefijo}: ${texto}`;
    });
    const MAX = 12;
    const extra = lineas.length - MAX;
    return lineas.slice(0, MAX).join(' · ') + (extra > 0 ? ` · (+${extra} más)` : '');
};

const FormularioContent = () => {
    const { definicion, nombre, descripcion, envio, loading, error, guardar, enviar, subirArchivo, marcarVisto } = useSubmission();
    const { currentStep, visited, goTo, activeTab, visitedTabs, sizeTabs, onActiveTab } = useWizard();
    const { onMessage, isMobile, openModal } = useGlobal();
    const { catalogos } = useCatalogos();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [methods, setMethods] = useState(null);
    const [avisoOculto, setAvisoOculto] = useState(false);

    useEffect(() => {
        const actual = searchParams.get('paso');
        const deseado = currentStep > 0 ? String(currentStep) : null;
        if (actual === deseado) return;
        const next = new URLSearchParams(searchParams);
        if (deseado) next.set('paso', deseado);
        else next.delete('paso');
        setSearchParams(next, { replace: true });
    }, [currentStep, searchParams, setSearchParams]);

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
        ? buildRepeaterItems(currentStepData, methods.watch(currentStepData.id))
        : [];

    const formValues = methods?.watch();
    const stepsCompleteness = new Map();
    steps.forEach((step, idx) => {
        stepsCompleteness.set(idx, stepCompleteness(step, formValues ?? envio?.datos));
    });

    const handleStepClick = (idx) => {
        if (idx === currentStep || !visited?.has(idx)) return;
        if (methods) handleSave(methods.getValues(), currentStep, true);
        goTo(idx);
    };

    const handleTabRemove = (_item, idx) => {
        if (!methods) return;
        const list = methods.getValues(currentStepData.id) || [];
        list.splice(idx, 1);
        methods.setValue(currentStepData.id, list);
        const newActive = Math.max(0, Math.min(activeTab, list.length - 1));
        onActiveTab?.(newActive);
    };

    const cambiosAplicados = envio?.cambios_aplicados ?? [];
    const showAviso = !avisoOculto && cambiosAplicados.length > 0 && envio?.estado === 'en_proceso';

    const handleAvisoEntendido = () => {
        setAvisoOculto(true);
        [...new Set(cambiosAplicados.map((c) => c.step_id))].forEach(marcarVisto);
        if (methods) handleSave(methods.getValues(), currentStep, true);
    };

    return (
        <React.Fragment>
            <div className="flex space-x-2 md:space-x-5">
                {showSidePanel && (
                    <div className="hidden xl:block w-[513px] rounded-[20px] bg-white p-7 sx:hidden lg:w-[670px] lg:p-10 lg:pt-[22px]">
                        <div className="flex flex-col space-y-2 items-start justify-start sticky top-[22px]">
                            <div>
                                <BackLink to="/" />
                                <Typography as="h1" className="!mb-0" titleName={nombre || 'Formulario'} />
                                {descripcion && (
                                    <Typography
                                        as="h3"
                                        className="text-[#191919] font-garetregular mt-2"
                                        titleName={descripcion}
                                    />
                                )}
                            </div>
                            {showAviso && (
                                <UpdateBanner
                                    cambios={cambiosAplicados}
                                    definicion={definicion}
                                    onEntendido={handleAvisoEntendido}
                                />
                            )}
                            <StepIndicator
                                steps={steps}
                                currentStep={currentStep}
                                visited={visited}
                                onStepClick={handleStepClick}
                                repeaterItems={repeaterItems}
                                activeTab={activeTab}
                                visitedTabs={visitedTabs}
                                sizeTabs={sizeTabs}
                                onTabClick={onActiveTab}
                                onTabRemove={handleTabRemove}
                                stepsCompleteness={stepsCompleteness}
                                cambiosAplicados={envio?.cambios_aplicados}
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
                    <div className="xl:hidden w-full pt-6 pb-3">
                        <BackLink to="/" />
                        <Typography as="h2" className="mt-1" titleName={nombre || 'Formulario'} />
                        {showAviso && (
                            <div className="mt-3">
                                <UpdateBanner
                                    cambios={cambiosAplicados}
                                    definicion={definicion}
                                    onEntendido={handleAvisoEntendido}
                                />
                            </div>
                        )}
                    </div>
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

const stepHasData = (step, datos) => {
    const value = datos?.[step.id];
    if (!value) return false;
    if (step.type === 'repeater') return Array.isArray(value) && value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
};

const FormSizer = () => {
    const { definicion, envio, loading } = useSubmission();
    const [searchParams] = useSearchParams();
    if (loading || !definicion) return <div className="flex justify-center py-10"><Loading /></div>;

    const steps = definicion.steps ?? [];
    const pasoParam = Number.parseInt(searchParams.get('paso'), 10);
    const initialStep = Number.isInteger(pasoParam) && pasoParam > 0 && pasoParam < steps.length
        ? pasoParam
        : 0;
    const initialVisited = new Set([0]);
    for (let i = 1; i <= initialStep; i++) initialVisited.add(i);
    steps.forEach((step, idx) => {
        if (idx > 0 && stepHasData(step, envio?.datos)) {
            initialVisited.add(idx);
        }
    });

    const initialVisitedTabs = (() => {
        const data = envio?.datos;
        if (!data) return null;
        const s = new Set([0]);
        for (const step of steps) {
            if (step.type === 'repeater' && Array.isArray(data[step.id])) {
                for (let i = 1; i < data[step.id].length; i++) s.add(i);
            }
        }
        return s.size > 1 ? s : null;
    })();

    return (
        <WizardProvider totalSteps={steps.length} initialStep={initialStep} initialVisited={initialVisited} initialVisitedTabs={initialVisitedTabs}>
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
