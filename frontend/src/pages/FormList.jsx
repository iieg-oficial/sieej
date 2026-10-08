import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import useForms from '@forms/context/useForms';
import useAuth from '@context/useAuth';
import { downloadEnvioPdf } from '@services/formulariosServices';
import Loading from '@components/Loading';
import Typography from '@components/Typography';
import AccessDenied from '@components/AccessDenied';
import DownloadIcon from '@components/icons/DownloadIcon';
import UpdateIcon from '@components/icons/UpdateIcon';

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

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const MessageIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
    </svg>
);

const SearchBox = ({ q, onQ }) => {
    const inputRef = useRef(null);

    return (
        <>
            <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="p-2 rounded transition text-[#7C7C7C] hover:text-[#5C2473] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2473]/40 shrink-0"
                aria-label="Buscar formularios"
                title="Buscar"
            >
                <SearchIcon />
            </button>
            <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => onQ(e.target.value)}
                placeholder="Buscar..."
                aria-label="Buscar formularios"
                className="transition-all duration-200 bg-transparent text-[13px] font-garetmedium text-[#191919] placeholder-[#6B6B6B] placeholder:font-garetregular focus:outline-none w-full pr-2"
            />
        </>
    );
};

const actionBtn = 'inline-flex shrink-0 items-center justify-center h-8 w-8 p-0! rounded-full transition text-[#7C7C7C] hover:text-[#5C2473] hover:bg-[#F0E2F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5C2473]/40';

const fmtDate = (iso) => (iso
    ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
    : '');

const FormCard = ({ formulario, onClick, onDownloadPdf, onUpdateFields, onContactAdmin }) => {
    const isEnviado = formulario.estado_envio === 'enviado';
    const puedeActualizar = isEnviado && formulario.tiene_campos_editables && formulario.envio_id;
    const periodicoCerrado = formulario.periodico && !formulario.abierto;

    return (
        <div className="rounded-[16px] border border-[#E2E2E2] bg-white shadow-sm hover:shadow-lg hover:border-[#5C2473] hover:-translate-y-px transition duration-200 flex flex-col overflow-hidden">
            <button type="button" onClick={onClick} className="text-left p-5 flex-1 flex flex-col justify-start">
                <Typography as="h2" className="!text-[#5C2473]" titleName={formulario.nombre} />
                {formulario.descripcion && <Typography as="p" className="text-[#7C7C7C] font-garetregular mt-1" titleName={formulario.descripcion} />}
                {formulario.periodico ? (
                    formulario.abierto
                        ? <p className="text-xs text-emerald-700 mt-2">Abierto hasta {fmtDate(formulario.ventana_cierre)}</p>
                        : <p className="text-xs text-[#7C7C7C] mt-2">Cerrado · próxima apertura {fmtDate(formulario.proxima_apertura)}</p>
                ) : (
                    formulario.vigencia_fin && <p className="text-xs text-[#7C7C7C] mt-2">Vigencia hasta {new Date(formulario.vigencia_fin).toLocaleDateString()}</p>
                )}
            </button>
            <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-2">
                    {periodicoCerrado ? (
                        <span className="text-xs font-garetbold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">
                            Cerrado
                        </span>
                    ) : (
                        <span className={`text-xs font-garetbold px-3 py-1 rounded-full ${ESTADO_COLOR[formulario.estado_envio] || ESTADO_COLOR.no_iniciado}`}>
                            {ESTADO_LABEL[formulario.estado_envio] || formulario.estado_envio}
                        </span>
                    )}
                    {formulario.actualizacion_disponible && (
                        <span className="text-xs font-garetbold px-3 py-1 rounded-full bg-[#FFE9CC] text-[#9E5200]">
                            Actualización
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 justify-end">
                    {puedeActualizar && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateFields(formulario); }} className={actionBtn} aria-label="Actualizar información" title="Actualizar información"><UpdateIcon size={16} /></button>
                    )}
                    {isEnviado && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); onDownloadPdf(formulario); }} className={actionBtn} aria-label="Descargar PDF" title="Descargar PDF"><DownloadIcon /></button>
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); onContactAdmin(formulario); }} className={actionBtn} aria-label="Contactar al administrador" title="Contactar al administrador"><MessageIcon /></button>
                </div>
            </div>
        </div>
    );
};

const FormList = () => {
    const { formularios, loading, error, errorStatus } = useForms();
    const { user, onFetch } = useAuth();
    const navigate = useNavigate();
    const [q, setQ] = useState('');

    const search = q.trim().toLowerCase();
    const filtered = search
        ? formularios.filter((f) => (
            `${f.nombre} ${f.descripcion || ''} ${f.slug}`.toLowerCase().includes(search)
        ))
        : formularios;

    const openForm = (f) => {
        if (f.estado_envio === 'enviado' && f.envio_id) {
            navigate(`/mis-envios/${f.envio_id}`);
            return;
        }
        navigate(`/${f.slug}`);
    };

    const handleDownloadPdf = async (f) => {
        try {
            await downloadEnvioPdf(onFetch, f.envio_id);
        } catch (e) {
            console.error('Error al descargar PDF:', e);
        }
    };

    const handleUpdateFields = (f) => {
        navigate(`/mis-envios/${f.envio_id}/actualizar`);
    };

    const handleContactAdmin = (f) => {
        if (typeof window === 'undefined' || !window.colibri?.openPanel) return;
        window.colibri.clearContext?.();
        window.colibri.identify?.({ id: user.id, email: user.email, name: user.nombre || user.name, role: user.role });
        window.colibri.setContext?.('envioId', f.envio_id);
        window.colibri.setContext?.('formulario', f.nombre);
        window.colibri.openPanel({ sourceApp: 'sieej', apiKey: import.meta.env.VITE_COLIBRI_API_KEY || '', tipoDefault: 'solicitud', tipos: 'solicitud' });
    };

    if (loading) return <div className="flex justify-center py-10"><Loading /></div>;

    if (errorStatus === 403) return <AccessDenied />;

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
            <div className="w-full flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <Typography
                        as="h1"
                        titleName="Mis formularios"
                        className="mt-2 md:mt-0 !mb-0"
                    />
                    {formularios.length > 0 && (
                        <div className="inline-flex items-center w-full md:w-auto rounded-lg border border-[#E2E2E2] p-1 bg-white">
                            <SearchBox q={q} onQ={setQ} />
                        </div>
                    )}
                </div>
                <Typography
                    as="p"
                    className="text-[#7C7C7C] font-garetregular"
                    titleName="Aquí encuentras los formularios asignados a tu dependencia. Da click en uno para empezar o continuar tu captura."
                />
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
                    <Typography as="h3" className="text-[#212121] font-garetbold mb-2" titleName="No hay formularios disponibles" />
                    <Typography as="p" className="text-[#7C7C7C] font-garetregular" titleName="Tu dependencia aún no tiene formularios asignados, o los formularios asignados están en preparación. Vuelve a revisar más tarde o ponte en contacto con tu enlace en el IIEG." />
                </div>
            ) : filtered.length === 0 ? (
                <div className="w-full mt-10 py-10 text-center">
                    <Typography as="p" className="text-[#7C7C7C] font-garetregular" titleName={`Sin resultados para "${q.trim()}".`} />
                </div>
            ) : (
                <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((f) => (
                        <FormCard
                            key={f.id}
                            formulario={f}
                            onClick={() => openForm(f)}
                            onDownloadPdf={handleDownloadPdf}
                            onUpdateFields={handleUpdateFields}
                            onContactAdmin={handleContactAdmin}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FormList;
