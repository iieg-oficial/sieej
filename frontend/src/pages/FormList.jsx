import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import useForms from '@forms/context/useForms';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import { TAB_KEYS, TAB_LABELS, filterByTab, filterBySearch, countByTab } from '@helpers/filterForms';

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
const TAB_KEY = 'sieej_form_list_tab';

const EMPTY_BY_TAB = {
    pendientes: '¡Estás al día! No tienes formularios pendientes por completar.',
    enviados: 'Aún no has enviado ningún formulario.',
    expirados: 'No tienes formularios expirados.',
};

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

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const ViewToggle = ({ view, onChange }) => {
    const baseBtn = 'p-2 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2473]/40';
    const activeStyle = 'bg-[#F0E2F5] text-[#5C2473]';
    const inactiveStyle = 'text-[#7C7C7C] hover:text-[#5C2473]';
    return (
        <div className="inline-flex items-center gap-1 rounded-lg border border-[#E2E2E2] p-1 bg-white">
            <button type="button" onClick={() => onChange('grid')}
                className={`${baseBtn} ${view === 'grid' ? activeStyle : inactiveStyle}`}
                aria-label="Vista en cuadricula" title="Vista en cuadricula">
                <GridIcon active={view === 'grid'} />
            </button>
            <button type="button" onClick={() => onChange('list')}
                className={`${baseBtn} ${view === 'list' ? activeStyle : inactiveStyle}`}
                aria-label="Vista en lista" title="Vista en lista">
                <ListIcon active={view === 'list'} />
            </button>
        </div>
    );
};

const TabBar = ({ tab, counts, onChange }) => (
    <div role="tablist" aria-label="Filtrar formularios" className="flex border-b border-[#E2E2E2]">
        {TAB_KEYS.map((key) => {
            const isActive = tab === key;
            return (
                <button
                    key={key}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => onChange(key)}
                    className={`
                        px-4 py-3 text-sm font-garetbold transition relative
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2473]/40
                        ${isActive ? 'text-[#5C2473]' : 'text-[#7C7C7C] hover:text-[#5C2473]'}
                    `}
                >
                    {TAB_LABELS[key]}
                    <span className={`
                        ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px]
                        ${isActive ? 'bg-[#5C2473] text-white' : 'bg-[#E2E2E2] text-[#465055]'}
                    `}>
                        {counts[key]}
                    </span>
                    {isActive && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#5C2473]" />}
                </button>
            );
        })}
    </div>
);

const SearchInput = ({ value, onChange }) => (
    <div className="relative w-full md:w-72">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7C7C]">
            <SearchIcon />
        </span>
        <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            aria-label="Buscar formularios"
            className="
                w-full h-10 pl-9 pr-3 rounded-lg bg-[#F8F8F8] text-[#191919] text-[13px] font-garetmedium
                placeholder-[#8E8E8E] placeholder:font-garetregular
                hover:bg-white hover:border-[#5C2472] hover:border focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white
            "
        />
    </div>
);

const FormCard = ({ formulario, onClick, view }) => {
    const isGrid = view === 'grid';
    return (
        <button type="button" onClick={onClick}
            className={`
                w-full text-left rounded-[16px] border border-[#E2E2E2] p-5
                bg-white shadow-sm hover:shadow-lg hover:border-[#5C2473] hover:-translate-y-0.5
                transition duration-200
                ${isGrid ? 'h-full flex flex-col gap-3' : 'flex items-start justify-between gap-4'}
            `}>
            <div className={`min-w-0 ${isGrid ? '' : 'flex-1'}`}>
                <Typography as="h2" className="!text-[#5C2473]" titleName={formulario.nombre} />
                {formulario.descripcion && (
                    <Typography as="p" className="text-[#7C7C7C] font-garetregular mt-1" titleName={formulario.descripcion} />
                )}
                {formulario.estado_envio === 'enviado' && formulario.enviado_en && (
                    <p className="text-xs text-[#7C7C7C] mt-2">
                        Enviado el {new Date(formulario.enviado_en).toLocaleDateString()}
                    </p>
                )}
                {formulario.estado_envio !== 'enviado' && formulario.vigencia_fin && (
                    <p className="text-xs text-[#7C7C7C] mt-2">
                        Vigencia hasta {new Date(formulario.vigencia_fin).toLocaleDateString()}
                    </p>
                )}
            </div>
            <span className={`
                shrink-0 text-xs font-garetbold px-3 py-1 rounded-full
                ${ESTADO_COLOR[formulario.estado_envio] || ESTADO_COLOR.no_iniciado}
                ${isGrid ? 'self-start' : ''}
            `}>
                {ESTADO_LABEL[formulario.estado_envio] || formulario.estado_envio}
            </span>
        </button>
    );
};

const EmptyState = ({ message }) => (
    <div className="w-full mt-8 py-12 text-center">
        <Typography as="p" className="text-[#7C7C7C]" titleName={message} />
    </div>
);

const FormList = () => {
    const { formularios, loading, error } = useForms();
    const navigate = useNavigate();

    const [view, setView] = useState(() => {
        if (typeof window === 'undefined') return 'grid';
        return window.localStorage.getItem(VIEW_KEY) || 'grid';
    });
    const [tab, setTab] = useState(() => {
        if (typeof window === 'undefined') return 'pendientes';
        const stored = window.localStorage.getItem(TAB_KEY);
        return TAB_KEYS.includes(stored) ? stored : 'pendientes';
    });
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') window.localStorage.setItem(VIEW_KEY, view);
    }, [view]);

    useEffect(() => {
        if (typeof window !== 'undefined') window.localStorage.setItem(TAB_KEY, tab);
    }, [tab]);

    const counts = useMemo(() => countByTab(formularios || []), [formularios]);
    const visible = useMemo(() => {
        const byTab = filterByTab(formularios || [], tab);
        return filterBySearch(byTab, query);
    }, [formularios, tab, query]);

    if (loading) return <div className="flex justify-center py-10"><Loading /></div>;

    if (error) {
        return (
            <div className="rounded-[20px] bg-white p-7 text-center space-y-4">
                <Typography as="h2" titleName="Error al cargar formularios" />
                <Typography as="p" titleName={error} />
            </div>
        );
    }

    const totalAsignados = formularios?.length ?? 0;
    const sinFormularios = totalAsignados === 0;
    const sinResultados = !sinFormularios && visible.length === 0;
    const emptyMsg = query ? `Sin resultados para "${query}".` : EMPTY_BY_TAB[tab];

    return (
        <div className="
            w-full flex flex-col items-start justify-start rounded-[20px]
            bg-white shadow-xl-[#03222708] px-2 pb-2 md:px-10 md:pb-10 md:pt-10 text-black
        ">
            <div className="w-full flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <Typography as="h1" titleName="Mis formularios" />
                    <Typography
                        as="p"
                        className="text-[#7C7C7C] font-garetregular mt-1"
                        titleName="Aquí encuentras los formularios asignados a tu dependencia. Da click en uno para empezar, continuar o revisar tu captura."
                    />
                </div>
                {totalAsignados > 0 && (
                    <div className="shrink-0 self-start md:mt-2">
                        <ViewToggle view={view} onChange={setView} />
                    </div>
                )}
            </div>

            {sinFormularios ? (
                <EmptyState message="No tienes formularios asignados por el momento." />
            ) : (
                <>
                    <div className="w-full mt-6">
                        <TabBar tab={tab} counts={counts} onChange={setTab} />
                    </div>
                    <div className="w-full mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <SearchInput value={query} onChange={setQuery} />
                        <p className="text-[12px] text-[#7C7C7C] font-garetmedium">
                            {visible.length} de {counts[tab]} {TAB_LABELS[tab].toLowerCase()}
                        </p>
                    </div>

                    {sinResultados ? (
                        <EmptyState message={emptyMsg} />
                    ) : view === 'grid' ? (
                        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {visible.map((f) => (
                                <FormCard key={f.id} formulario={f} view="grid"
                                    onClick={() => navigate(`/${f.slug}`)} />
                            ))}
                        </div>
                    ) : (
                        <ul className="w-full mt-6 space-y-4">
                            {visible.map((f) => (
                                <li key={f.id}>
                                    <FormCard formulario={f} view="list"
                                        onClick={() => navigate(`/${f.slug}`)} />
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
};

export default FormList;
