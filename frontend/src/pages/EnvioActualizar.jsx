import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import useAuth from '@context/useAuth';
import useGlobal from '@context/useGlobal';
import useCatalogos from '@forms/context/useCatalogos';
import { actualizarCamposEnvio, getMiEnvioDetalle } from '@services/formulariosServices';
import FieldRenderer from '@forms/renderer/FieldRenderer';
import { evaluarShowWhen } from '@forms/renderer/conditional';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Button from '@components/Button';
import BackLink from '@components/BackLink';

const collectEditableFields = (definicion) => {
    const grupos = [];
    (definicion?.steps || []).forEach((step) => {
        if (step.type === 'summary' || step.type === 'repeater') return;
        const fields = (step.fields || []).filter(
            (f) => f.editableAfterSubmit && f.type !== 'info' && f.type !== 'file',
        );
        if (fields.length) grupos.push({ step, fields });
    });
    return grupos;
};

const StepGrupo = ({ step, fields, methods, catalogos }) => {
    const stepValues = methods.watch(step.id) || {};
    return (
        <section className="space-y-4">
            {step.title && <Typography as="h3" titleName={step.title} />}
            <div className="grid grid-cols-1 md:grid-cols-6 grid-flow-row-dense gap-4">
                {fields.map((field) => {
                    if (!evaluarShowWhen(field.showWhen, stepValues)) return null;
                    const fullName = `${step.id}.${field.name}`;
                    return (
                        <FieldRenderer
                            key={fullName}
                            field={{ ...field, name: fullName }}
                            methods={methods}
                            catalogos={catalogos}
                        />
                    );
                })}
            </div>
        </section>
    );
};

const EnvioActualizarContent = ({ envio }) => {
    const { onFetch } = useAuth();
    const { onMessage } = useGlobal();
    const { catalogos } = useCatalogos();
    const navigate = useNavigate();
    const methods = useForm({ defaultValues: envio.datos || {} });
    const [saving, setSaving] = useState(false);

    const grupos = useMemo(
        () => collectEditableFields(envio.definicion_snapshot || {}),
        [envio.definicion_snapshot],
    );

    const volver = () => navigate(`/mis-envios/${envio.id}`);

    const onSubmit = methods.handleSubmit(async () => {
        const campos = {};
        grupos.forEach(({ step, fields }) => {
            fields.forEach((field) => {
                const path = `${step.id}.${field.name}`;
                campos[path] = methods.getValues(path);
            });
        });
        setSaving(true);
        try {
            await actualizarCamposEnvio(onFetch, envio.id, campos);
            onMessage?.(false, 'Información actualizada');
            volver();
        } catch (err) {
            onMessage?.(true, err.message || 'No se pudo actualizar la información');
        } finally {
            setSaving(false);
        }
    });

    return (
        <FormProvider {...methods}>
            <form onSubmit={onSubmit} className="pb-5">
                <main className="rounded-[20px] bg-white px-2 pb-2 md:px-10 md:pb-10 md:pt-10">
                    <div className="sticky top-0 z-10 bg-white pb-4 space-y-4">
                        <BackLink to={`/mis-envios/${envio.id}`} />
                        <div className="min-w-0">
                            <Typography as="h1" titleName="Actualizar información" />
                            <Typography
                                as="p"
                                className="text-[#7C7C7C] font-garetregular mt-1"
                                titleName={envio.formulario.nombre}
                            />
                        </div>
                    </div>

                    {grupos.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <Typography as="h3" titleName="No hay campos actualizables" />
                            <Typography
                                as="p"
                                className="text-[#7C7C7C] font-garetregular"
                                titleName="Este formulario no tiene campos habilitados para actualizarse tras el envío."
                            />
                        </div>
                    ) : (
                        <>
                            <p className="text-[13px] text-[#7C7C7C] font-garetregular mb-6">
                                Edita solo los campos habilitados. El resto del envío no cambia y
                                cada modificación queda registrada en el historial.
                            </p>
                            <div className="space-y-8">
                                {grupos.map(({ step, fields }) => (
                                    <StepGrupo
                                        key={step.id}
                                        step={step}
                                        fields={fields}
                                        methods={methods}
                                        catalogos={catalogos}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 mt-10">
                                <Button
                                    type="button"
                                    label="Cancelar"
                                    variant="secondary"
                                    onClick={volver}
                                    fit
                                />
                                <Button
                                    type="submit"
                                    label="Guardar cambios"
                                    variant="primary"
                                    loading={saving}
                                    fit
                                />
                            </div>
                        </>
                    )}
                </main>
            </form>
        </FormProvider>
    );
};

const EnvioActualizar = () => {
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

    if (envio.estado !== 'enviado') {
        return (
            <div className="w-full rounded-[20px] bg-white p-7 text-center space-y-4">
                <Typography as="h2" titleName="Este envío no se puede actualizar" />
                <Typography
                    as="p"
                    titleName="Solo los envíos ya enviados admiten la actualización de campos."
                />
                <Button label="Volver al envío" variant="primary"
                    onClick={() => navigate(`/mis-envios/${id}`)} center />
            </div>
        );
    }

    return <EnvioActualizarContent envio={envio} />;
};

export default EnvioActualizar;
