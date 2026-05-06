import React from 'react';
import { useNavigate } from 'react-router';
import { FormsProvider } from '../forms/context/FormsContext';
import useForms from '../forms/context/useForms';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import Button from '@components/Button';

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
            <div className="rounded-[20px] bg-white p-7 text-center space-y-4">
                <Typography as="h2" titleName="Error al cargar formularios" />
                <Typography as="p" titleName={error} />
            </div>
        );
    }

    return (
        <div className="
            w-full flex flex-col items-start justify-start rounded-[20px]
            bg-white shadow-xl-[#03222708] px-2 pb-2 md:px-10 md:pb-10 md:pt-10 text-black
        ">
            <Typography
                as="h1"
                titleName="Sistema de Información Estratégica del Estado de Jalisco"
            />
            <Typography
                as="h3"
                className="text-[#191919] font-garetregular"
                titleName="Selecciona uno de los formularios disponibles para tu dependencia."
            />

            {formularios.length === 0 ? (
                <div className="w-full mt-8 py-8 text-center">
                    <Typography
                        as="p"
                        className="text-[#7C7C7C]"
                        titleName="No tienes formularios asignados por el momento."
                    />
                </div>
            ) : (
                <ul className="w-full mt-8 space-y-4">
                    {formularios.map((f) => (
                        <li key={f.id}>
                            <button
                                type="button"
                                onClick={() => navigate(`/${f.slug}`)}
                                className="
                                    w-full text-left rounded-[16px] border border-[#E2E2E2] p-5
                                    bg-white hover:border-[#5C2473] hover:shadow-md transition
                                    flex items-start justify-between gap-4
                                "
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography
                                        as="h2"
                                        className="!text-[#5C2473]"
                                        titleName={f.nombre}
                                    />
                                    {f.descripcion && (
                                        <Typography
                                            as="p"
                                            className="text-[#7C7C7C] font-garetregular mt-1"
                                            titleName={f.descripcion}
                                        />
                                    )}
                                    {f.vigencia_fin && (
                                        <p className="text-xs text-[#7C7C7C] mt-2">
                                            Vigencia hasta {new Date(f.vigencia_fin).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className={`shrink-0 text-xs font-garetbold px-3 py-1 rounded-full ${ESTADO_COLOR[f.estado_envio] || ESTADO_COLOR.no_iniciado}`}
                                >
                                    {ESTADO_LABEL[f.estado_envio] || f.estado_envio}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const FormList = () => (
    <FormsProvider>
        <Lista />
    </FormsProvider>
);

export default FormList;
