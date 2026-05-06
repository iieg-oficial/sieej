import React from 'react';
import { useNavigate } from 'react-router';
import { FormsProvider } from '../forms/context/FormsContext';
import useForms from '../forms/context/useForms';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import CardPage from '@components/CardPage';

const ESTADO_LABEL = {
    no_iniciado: 'Sin iniciar',
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    expirado: 'Expirado',
};

const ESTADO_COLOR = {
    no_iniciado: 'bg-neutral-100 text-neutral-700',
    en_proceso: 'bg-amber-100 text-amber-800',
    enviado: 'bg-emerald-100 text-emerald-800',
    expirado: 'bg-red-100 text-red-700',
};

const Lista = () => {
    const { formularios, loading, error } = useForms();
    const navigate = useNavigate();

    if (loading) return <div className="flex justify-center py-10"><Loading /></div>;
    if (error) {
        return (
            <CardPage>
                <Typography variant="heading">Error al cargar formularios</Typography>
                <Typography variant="body">{error}</Typography>
            </CardPage>
        );
    }

    if (!formularios.length) {
        return (
            <CardPage>
                <Typography variant="heading">Sin formularios asignados</Typography>
                <Typography variant="body">
                    Cuando tu dependencia tenga un formulario asignado, aparecera aqui.
                </Typography>
            </CardPage>
        );
    }

    return (
        <CardPage>
            <Typography variant="heading">Formularios disponibles</Typography>
            <ul className="mt-4 space-y-3">
                {formularios.map((f) => (
                    <li
                        key={f.id}
                        className="rounded border border-neutral-200 p-4 hover:border-primary cursor-pointer transition"
                        onClick={() => navigate(`/formularios/${f.slug}`)}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Typography variant="subheading">{f.nombre}</Typography>
                                {f.descripcion && (
                                    <Typography variant="body" className="text-neutral-600">
                                        {f.descripcion}
                                    </Typography>
                                )}
                                {f.vigencia_fin && (
                                    <Typography variant="caption" className="text-neutral-500">
                                        Vigencia: hasta {new Date(f.vigencia_fin).toLocaleDateString()}
                                    </Typography>
                                )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${ESTADO_COLOR[f.estado_envio]}`}>
                                {ESTADO_LABEL[f.estado_envio]}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </CardPage>
    );
};

const FormList = () => (
    <FormsProvider>
        <Lista />
    </FormsProvider>
);

export default FormList;
