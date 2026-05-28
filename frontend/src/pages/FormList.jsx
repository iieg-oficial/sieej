import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import useForms from '@forms/context/useForms';
import Loading from '@components/Loading';
import Typography from '@components/Typography';

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

const VIEW_KEY = 'sieej_form_list_view';

const GridIcon = ({ active }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="6" height="6" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
    </svg>
);

const ListIcon = ({ active }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round"/>
        <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round"/>
        <line x1="2" y1="12.5" x2="14" y2="12.5" stroke="currentColor" strokeWidth={active ? 2.5 : 1.5} strokeLinecap="round"/>
    </svg>
);

const ViewToggle = ({ view, onChange }) => {
    const baseBtn = 'p-2 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2473]/40';
    const activeStyle = 'bg-[#F0E2F5] text-[#5C2473]';
    const inactiveStyle = 'text-[#7C7C7C] hover:text-[#5C2473]';
    return (
        <div className="inline-flex items-center gap-1 rounded-lg border border-[#E2E2E2] p-1 bg-white">
            <button
                type="button"
                onClick={() => onChange('grid')}
                className={`${baseBtn} ${view === 'grid' ? activeStyle : inactiveStyle}`}
                aria-label="Vista en cuadricula"
                title="Vista en cuadricula"
            >
                <GridIcon active={view === 'grid'} />
            </button>
            <button
                type="button"
                onClick={() => onChange('list')}
                className={`${baseBtn} ${view === 'list' ? activeStyle : inactiveStyle}`}
                aria-label="Vista en lista"
                title="Vista en lista"
            >
                <ListIcon active={view === 'list'} />
            </button>
        </div>
    );
};

const FormCard = ({ formulario, onClick, view }) => {
    const isGrid = view === 'grid';
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                w-full text-left rounded-[16px] border border-[#E2E2E2] p-5
                bg-white shadow-sm hover:shadow-lg hover:border-[#5C2473] hover:-translate-y-0.5
                transition duration-200
                ${isGrid ? 'h-full flex flex-col gap-3' : 'flex items-start justify-between gap-4'}
            `}
        >
            <div className={`min-w-0 ${isGrid ? '' : 'flex-1'}`}>
                <Typography
                    as="h2"
                    className="!text-[#5C2473]"
                    titleName={formulario.nombre}
                />
                {formulario.descripcion && (
                    <Typography
                        as="p"
                        className="text-[#7C7C7C] font-garetregular mt-1"
                        titleName={formulario.descripcion}
                    />
                )}
                {formulario.vigencia_fin && (
                    <p className="text-xs text-[#7C7C7C] mt-2">
                        Vigencia hasta {new Date(formulario.vigencia_fin).toLocaleDateString()}
                    </p>
                )}
            </div>
            <span
                className={`
                    shrink-0 text-xs font-garetbold px-3 py-1 rounded-full
                    ${ESTADO_COLOR[formulario.estado_envio] || ESTADO_COLOR.no_iniciado}
                    ${isGrid ? 'self-start' : ''}
                `}
            >
                {ESTADO_LABEL[formulario.estado_envio] || formulario.estado_envio}
            </span>
        </button>
    );
};

const FormList = () => {
    const { formularios, loading, error } = useForms();
    const navigate = useNavigate();
    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return 'grid';
        return window.localStorage.getItem(VIEW_KEY) || 'grid';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(VIEW_KEY, view);
        }
    }, [view]);

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
            <div className="w-full flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <Typography
                        as="h1"
                        titleName="Mis formularios"
                    />
                    <Typography
                        as="p"
                        className="text-[#7C7C7C] font-garetregular mt-1"
                        titleName="Aquí encuentras los formularios asignados a tu dependencia. Da click en uno para empezar o continuar tu captura."
                    />
                </div>
                {formularios.length > 0 && (
                    <div className="shrink-0 self-start md:mt-2">
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                )}
            </div>

            {formularios.length === 0 ? (
                <div className="w-full mt-10 py-10 flex flex-col items-center text-center max-w-[420px] mx-auto">
                    <div className="w-16 h-16 rounded-full bg-[#F0E2F5] flex items-center justify-center mb-5">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5C2473" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="9" y1="13" x2="15" y2="13"/>
                            <line x1="9" y1="17" x2="13" y2="17"/>
                        </svg>
                    </div>
                    <Typography
                        as="h3"
                        className="text-[#212121] font-garetbold mb-2"
                        titleName="No hay formularios disponibles"
                    />
                    <Typography
                        as="p"
                        className="text-[#7C7C7C] font-garetregular"
                        titleName="Tu dependencia aún no tiene formularios asignados, o los formularios asignados están en preparación. Vuelve a revisar más tarde o ponte en contacto con tu enlace en el IIEG."
                    />
                </div>
            ) : view === 'grid' ? (
                <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {formularios.map((f) => (
                        <FormCard
                            key={f.id}
                            formulario={f}
                            view="grid"
                            onClick={() => navigate(`/${f.slug}`)}
                        />
                    ))}
                </div>
            ) : (
                <ul className="w-full mt-8 space-y-4">
                    {formularios.map((f) => (
                        <li key={f.id}>
                            <FormCard
                                formulario={f}
                                view="list"
                                onClick={() => navigate(`/${f.slug}`)}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FormList;
