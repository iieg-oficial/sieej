import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm, FormProvider } from 'react-hook-form';
import useAuth from '@context/useAuth';
import useGlobal from '@context/useGlobal';
import useCatalogos from '@forms/context/useCatalogos';
import {
    actualizarArchivoEnvio,
    actualizarCamposEnvio,
    getMiEnvioDetalle,
    getMiEnvioHistorial,
} from '@services/formulariosServices';
import FieldRenderer from '@forms/renderer/FieldRenderer';
import { evaluarShowWhen } from '@forms/renderer/conditional';
import { camposEditables } from '@forms/renderer/editableFields';
import HistorialCampos from '@forms/components/HistorialCampos';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Tooltip from '@components/Tooltip';
import Button from '@components/Button';
import BackLink from '@components/BackLink';

const AYUDA = 'Edita solo los campos habilitados. El resto del envío no cambia y cada '
    + 'modificación queda registrada en el historial. Los archivos se reemplazan en '
    + 'cuanto los subes; el resto se guarda con el botón.';

const itemLabel = (step, idx) => (step.itemLabel || `Elemento ${idx + 1}`)
    .replace('{{index}}', String(idx + 1));

const collectEditableFields = (definicion, datos) => {
    const grupos = [];
    (definicion?.steps || []).forEach((step) => {
        const fields = camposEditables({ steps: [step] });
        if (!fields.length) return;
        if (step.type !== 'repeater') {
            grupos.push({ step, fields, prefix: step.id, title: step.title });
            return;
        }
        const items = Array.isArray(datos?.[step.id]) ? datos[step.id] : [];
        items.forEach((_, idx) => {
            grupos.push({
                step,
                fields,
                prefix: `${step.id}[${idx}]`,
                title: `${step.title} · ${itemLabel(step, idx)}`,
                itemIndex: idx,
            });
        });
    });
    return grupos;
};

const StepGrupo = ({ step, fields, prefix, title, itemIndex, methods, catalogos, onUpload }) => {
    const scopeValues = methods.watch(
        itemIndex === undefined ? step.id : `${step.id}[${itemIndex}]`,
    ) || {};
    return (
        <section className="space-y-4">
            {title && <Typography as="h3" titleName={title} />}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {fields.map((field) => {
                    if (!evaluarShowWhen(field.showWhen, scopeValues)) return null;
                    const fullName = `${prefix}.${field.name}`;
                    return (
                        <FieldRenderer
                            key={fullName}
                            field={{ ...field, name: fullName }}
                            methods={methods}
                            catalogos={catalogos}
                            onUpload={onUpload}
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

    const [historial, setHistorial] = useState([]);
    const [historialLoading, setHistorialLoading] = useState(true);

    const grupos = useMemo(
        () => collectEditableFields(envio.definicion_snapshot || {}, envio.datos || {}),
        [envio.definicion_snapshot, envio.datos],
    );

    const soloArchivos = grupos.every(
        ({ fields }) => fields.every((f) => f.type === 'file'),
    );

    const cargarHistorial = useCallback(async () => {
        setHistorialLoading(true);
        try {
            setHistorial(await getMiEnvioHistorial(onFetch, envio.id));
        } catch {
            setHistorial([]);
        } finally {
            setHistorialLoading(false);
        }
    }, [onFetch, envio.id]);

    useEffect(() => { cargarHistorial(); }, [cargarHistorial]);

    const volver = () => navigate(`/mis-envios/${envio.id}`);

    const handleUpload = async (fieldPath, file) => {
        try {
            const archivo = await actualizarArchivoEnvio(onFetch, envio.id, fieldPath, file);
            onMessage?.(false, 'Archivo actualizado');
            cargarHistorial();
            return archivo;
        } catch (err) {
            onMessage?.(true, err.message || 'No se pudo actualizar el archivo');
            throw err;
        }
    };

    const onSubmit = methods.handleSubmit(async () => {
        const campos = {};
        grupos.forEach(({ fields, prefix }) => {
            fields.forEach((field) => {
                if (field.type === 'file') return;
                const path = `${prefix}.${field.name}`;
                campos[path] = methods.getValues(path);
            });
        });
        if (!Object.keys(campos).length) {
            volver();
            return;
        }
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
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Typography as="h1" titleName="Actualizar información" />
                                    <Tooltip text={AYUDA} />
                                </div>
                                <Typography
                                    as="p"
                                    className="text-[#7C7C7C] font-garetregular mt-1"
                                    titleName={envio.formulario.nombre}
                                />
                            </div>
                            {grupos.length > 0 && (
                                <div className="shrink-0">
                                    <Button
                                        type="submit"
                                        label={soloArchivos ? 'Listo' : 'Guardar cambios'}
                                        variant="primary"
                                        loading={saving}
                                        fit
                                    />
                                </div>
                            )}
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
                        <div className="space-y-8">
                            {grupos.map(({ step, fields, prefix, title, itemIndex }) => (
                                <StepGrupo
                                    key={prefix}
                                    step={step}
                                    fields={fields}
                                    prefix={prefix}
                                    title={title}
                                    itemIndex={itemIndex}
                                    methods={methods}
                                    catalogos={catalogos}
                                    onUpload={handleUpload}
                                />
                            ))}
                        </div>
                    )}

                    <section className="mt-12 border-t border-[#E2E2E2] pt-6">
                        <Typography as="h3" titleName="Historial de cambios" />
                        <p className="text-[11px] text-[#7C7C7C] font-garetregular mb-3">
                            Registro de lo que has actualizado en este envío. No se puede modificar.
                        </p>
                        <HistorialCampos items={historial} loading={historialLoading} />
                    </section>
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
