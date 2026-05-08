import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import useAuth from '@context/useAuth';
import useCatalogos from '@forms/context/useCatalogos';
import { getMiEnvioDetalle } from '@services/formulariosServices';
import SummaryStep from '@forms/renderer/SummaryStep';
import EventTimeline from '@forms/components/EventTimeline';
import EnvioAdjuntos from '@forms/components/EnvioAdjuntos';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Button from '@components/Button';

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

const EnvioDetalleContent = ({ envio }) => {
    const { catalogos } = useCatalogos();
    const navigate = useNavigate();
    const methods = useForm({ defaultValues: envio.datos || {} });

    const definicion = envio.definicion_snapshot || {};
    const summaryStep = (definicion.steps || []).find((s) => s.type === 'summary') || null;

    return (
        <FormProvider {...methods}>
            <div className="flex flex-col xl:flex-row gap-5">
                <main className="flex-1 min-w-0 rounded-[20px] bg-white px-2 pb-2 md:px-10 md:pb-10 md:pt-10">
                    <button
                        type="button"
                        onClick={() => navigate('/mis-envios')}
                        className="text-[12px] text-[#7C7C7C] hover:text-[#5C2472] font-garetmedium mb-4 flex items-center gap-1"
                        aria-label="Volver a mis envíos"
                    >
                        ← Volver a mis envíos
                    </button>
                    <div className="flex items-start justify-between gap-3 mb-4">
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
                    <div className="rounded-[16px] bg-[#F8F8F8] px-4 py-3 mb-6 border-l-4 border-[#5C2473]">
                        <Typography
                            as="p"
                            className="text-[12px] text-[#465055]"
                            titleName="Vista de revisión: este formulario es solo de lectura. Refleja la estructura del formulario al momento del envío, aunque el formulario haya cambiado después."
                        />
                    </div>
                    <SummaryStep
                        definicion={{
                            steps: definicion.steps || [],
                            nombre: envio.formulario.nombre,
                            descripcion: envio.formulario.descripcion,
                        }}
                        methods={methods}
                        catalogos={catalogos}
                        summaryStep={summaryStep}
                    />
                </main>
                <aside className="xl:w-[360px] xl:shrink-0 flex flex-col gap-5">
                    <section className="rounded-[20px] bg-white p-6">
                        <Typography as="h3" titleName="Línea de tiempo" />
                        <p className="text-[11px] text-[#7C7C7C] font-garetregular mb-3">
                            Iniciado el {formatDate(envio.iniciado_en)}
                            {envio.enviado_en && ` · Enviado el ${formatDate(envio.enviado_en)}`}
                        </p>
                        <EventTimeline eventos={envio.eventos || []} />
                    </section>
                    <section className="rounded-[20px] bg-white p-6">
                        <Typography as="h3" titleName="Archivos adjuntos" />
                        <div className="mt-3">
                            <EnvioAdjuntos archivos={envio.archivos || []} />
                        </div>
                    </section>
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
                <Button label="Volver a mis envíos" variant="primary"
                    onClick={() => navigate('/mis-envios')} center />
            </div>
        );
    }

    if (!envio) return null;
    return <EnvioDetalleContent envio={envio} />;
};

export default EnvioDetalle;
