import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import Tabs from '@forms/components/wizard/Tabs';
import useAuth from '@context/useAuth';
import useCatalogos from '@forms/context/useCatalogos';
import { getMiEnvioDetalle } from '@services/formulariosServices';
import SummaryStep from '@forms/renderer/SummaryStep';
import SummaryPdfButton from '@forms/renderer/pdf/SummaryPdfButton';
import Tooltip from '@components/Tooltip';
import UpdateIcon from '@components/icons/UpdateIcon';
import EventTimeline from '@forms/components/EventTimeline';
import EnvioAdjuntos from '@forms/components/EnvioAdjuntos';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Button from '@components/Button';
import BackLink from '@components/BackLink';

const ESTADO_LABEL = {
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    expirado: 'Expirado',
};

const ESTADO_COLOR = {
    en_proceso: 'bg-amber-100 text-amber-800',
    enviado: 'bg-emerald-100 text-emerald-800',
    expirado: 'bg-red-100 text-red-700',
};

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const MOBILE_TABS = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'adjuntos', label: 'Adjuntos' },
    { id: 'actividad', label: 'Actividad' },
];

const tieneCamposEditables = (definicion) => (definicion.steps || []).some(
    (s) => s.type !== 'summary' && s.type !== 'repeater'
        && (s.fields || []).some(
            (f) => f.editableAfterSubmit && f.type !== 'info' && f.type !== 'file',
        ),
);

const EnvioDetalleContent = ({ envio }) => {
    const { catalogos } = useCatalogos();
    const navigate = useNavigate();
    const methods = useForm({ defaultValues: envio.datos || {} });
    const [activeTab, setActiveTab] = useState(0);

    const definicion = envio.definicion_snapshot || {};
    const summaryStep = (definicion.steps || []).find((s) => s.type === 'summary') || null;
    const puedeActualizar = envio.estado === 'enviado' && tieneCamposEditables(definicion);
    const summaryDefinicion = {
        steps: definicion.steps || [],
        nombre: envio.formulario.nombre,
        descripcion: envio.formulario.descripcion,
    };

    return (
        <FormProvider {...methods}>
            <div className="flex flex-col xl:flex-row gap-5 pb-5">
                <main className="flex-1 min-w-0 rounded-[20px] bg-white px-2 pb-2 md:px-10 md:pb-10 md:pt-10">
                    <div className="sticky top-0 z-10 bg-white pb-4 space-y-4">
                        <div className="flex items-center justify-between gap-3 mt-2 md:mt-0">
                            <BackLink to="/" />
                            <div className="flex items-center gap-2 shrink-0">
                                {puedeActualizar && (
                                    <Tooltip text="Actualizar información" showIcon={false} size="small">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/mis-envios/${envio.id}/actualizar`)}
                                            aria-label="Actualizar información"
                                            className="inline-flex shrink-0 items-center justify-center w-10 h-10 rounded-full transition
                                                bg-[#5C2472] text-white hover:shadow-[0px_8px_16px_#4615524D]"
                                        >
                                            <UpdateIcon />
                                        </button>
                                    </Tooltip>
                                )}
                                {summaryStep && (
                                    <SummaryPdfButton
                                        step={summaryStep}
                                        envioId={envio.id}
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-start md:flex-row md:justify-between gap-3">
                            <div className="min-w-0">
                                <Typography as="h1" titleName={envio.formulario.nombre} />
                                {envio.formulario.descripcion && (
                                    <Typography
                                        as="p"
                                        className="text-[#7C7C7C] font-garetregular mt-1"
                                        titleName={envio.formulario.descripcion}
                                    />
                                )}
                            </div>
                            <span className={`
                                shrink-0 text-xs font-garetbold px-3 py-1 rounded-full
                                ${ESTADO_COLOR[envio.estado] || 'bg-neutral-100 text-neutral-700'}
                            `}>
                                {ESTADO_LABEL[envio.estado] || envio.estado}
                            </span>
                        </div>
                        <div className="xl:hidden">
                            <Tabs
                                show
                                numbered={false}
                                items={MOBILE_TABS}
                                activeTab={activeTab}
                                onTabClick={setActiveTab}
                            />
                        </div>
                    </div>
                    <div className={`${activeTab === 0 ? 'block' : 'hidden'} xl:block`}>
                        <SummaryStep
                            definicion={summaryDefinicion}
                            methods={methods}
                            catalogos={catalogos}
                            summaryStep={summaryStep}
                            showPdfButton={false}
                            envioId={envio.id}
                        />
                    </div>
                </main>
                <aside className={`xl:w-[360px] xl:shrink-0 ${activeTab === 0 ? 'hidden xl:block' : ''}`}>
                    <div className="flex flex-col gap-5 xl:sticky xl:top-0 xl:max-h-[calc(100dvh-160px)]">
                        <section className={`${activeTab === 1 ? 'block' : 'hidden'} xl:block rounded-[20px] bg-white p-6 shrink-0`}>
                            <Typography as="h3" titleName="Archivos adjuntos" />
                            <div className="mt-3">
                                <EnvioAdjuntos archivos={envio.archivos || []} />
                            </div>
                        </section>
                        <section className={`${activeTab === 2 ? 'flex' : 'hidden'} xl:flex rounded-[20px] bg-white p-6 flex-col xl:min-h-0`}>
                            <Typography as="h3" titleName="Línea de tiempo" />
                            <p className="text-[11px] text-[#7C7C7C] font-garetregular mb-3">
                                Iniciado el {formatDate(envio.iniciado_en)}
                                {envio.enviado_en && ` · Enviado el ${formatDate(envio.enviado_en)}`}
                            </p>
                            <div className="xl:flex-1 xl:min-h-0 xl:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <EventTimeline eventos={envio.eventos || []} />
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </FormProvider>
    );
};

const EnvioDetalle = () => {
    const { id } = useParams();
    const { onFetch } = useAuth();
    const navigate = useNavigate();
    const [envio, setEnvio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getMiEnvioDetalle(onFetch, id)
            .then((data) => { if (!cancelled) setEnvio(data); })
            .catch((err) => {
                if (cancelled) return;
                if (err.status === 403 || err.status === 404) {
                    setError('Este envío no existe o no te pertenece.');
                } else {
                    setError(err.message || 'Error al cargar el envío');
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [onFetch, id]);

    if (loading) return <div className="flex justify-center py-10"><Loading /></div>;

    if (error) {
        return (
            <div className="w-full rounded-[20px] bg-white p-7 text-center space-y-4">
                <Typography as="h2" titleName="No pudimos cargar este envío" />
                <Typography as="p" titleName={error} />
                <Button label="Volver a mis formularios" variant="primary"
                    onClick={() => navigate('/')} center />
            </div>
        );
    }

    if (!envio) return null;
    return <EnvioDetalleContent envio={envio} />;
};

export default EnvioDetalle;
