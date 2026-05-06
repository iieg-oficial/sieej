import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { SubmissionProvider } from '../forms/context/SubmissionContext';
import useSubmission from '../forms/context/useSubmission';
import { WizardProvider } from '../forms/context/WizardContext';
import useWizard from '../forms/context/useWizard';
import FormRenderer from '../forms/renderer/FormRenderer';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Button from '@components/Button';
import CardPage from '@components/CardPage';
import useGlobal from '@context/useGlobal';
import useCatalog from '@context/useCatalog';

const ESTADO_LABEL = {
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    expirado: 'Expirado',
};

const FormularioContent = () => {
    const { definicion, envio, loading, error, guardar, enviar, subirArchivo } = useSubmission();
    const { currentStep, goNext, goPrev } = useWizard();
    const { onMessage } = useGlobal();
    const { catalogos } = useCatalog();
    const navigate = useNavigate();

    if (loading) return <div className="flex justify-center py-10"><Loading /></div>;
    if (error) {
        return (
            <CardPage>
                <Typography variant="heading">Error</Typography>
                <Typography variant="body">{error}</Typography>
                <Button type="button" onClick={() => navigate('/formularios')}>
                    Volver a la lista
                </Button>
            </CardPage>
        );
    }
    if (!definicion) return null;

    const handleSave = async (values, paso) => {
        try {
            await guardar(values, paso ?? currentStep);
            onMessage?.(false, 'Borrador guardado');
        } catch (e) {
            onMessage?.(true, e.message);
        }
    };

    const handleSubmit = async (values) => {
        try {
            await enviar(values);
            onMessage?.(false, 'Enviado');
            navigate('/formularios');
        } catch (e) {
            onMessage?.(true, e.message);
        }
    };

    const handleUpload = async (fieldPath, file) => {
        try {
            return await subirArchivo(fieldPath, file);
        } catch (e) {
            onMessage?.(true, e.message);
            throw e;
        }
    };

    return (
        <CardPage>
            <header className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-200">
                <div>
                    <Typography variant="heading">{definicion.nombre || 'Formulario'}</Typography>
                    {envio?.estado && (
                        <Typography variant="caption">Estado: {ESTADO_LABEL[envio.estado]}</Typography>
                    )}
                </div>
                <Button type="button" variant="link" onClick={() => navigate('/formularios')}>
                    Volver
                </Button>
            </header>

            <div className="mt-6">
                <FormRenderer
                    definicion={definicion}
                    envio={envio}
                    catalogos={catalogos}
                    currentStepIdx={currentStep}
                    onSave={handleSave}
                    onSubmit={handleSubmit}
                    onUpload={handleUpload}
                    onPrev={goPrev}
                    onNext={goNext}
                />
            </div>
        </CardPage>
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

const FormSizer = () => {
    const { definicion, loading } = useSubmission();
    if (loading || !definicion) return <div className="flex justify-center py-10"><Loading /></div>;
    return (
        <WizardProvider totalSteps={definicion.steps.length}>
            <FormularioContent />
        </WizardProvider>
    );
};

export default FormPage;
