import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import useAuth from '@context/useAuth';
import { listMisEnvios } from '@services/formulariosServices';
import Loading from '@components/Loading';
import Typography from '@components/Typography';

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

const SORT_OPTIONS = [
    { value: '-actualizado_en', label: 'Más recientes' },
    { value: '-enviado_en', label: 'Por fecha de envío' },
    { value: 'nombre', label: 'Por nombre A-Z' },
];

const PAGE_SIZE = 12;

const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
};

const SearchIcon = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const Filters = ({ estado, onEstado, q, onQ, sort, onSort }) => (
    <div className="w-full flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7C7C]">
                <SearchIcon />
            </span>
            <input
                type="search"
                value={q}
                onChange={(e) => onQ(e.target.value)}
                placeholder="Buscar por nombre o slug..."
                aria-label="Buscar mis envíos"
                className="
                    w-full h-10 pl-9 pr-3 rounded-lg bg-[#F8F8F8] text-[#191919] text-[13px] font-garetmedium
                    placeholder-[#8E8E8E] placeholder:font-garetregular
                    hover:bg-white hover:border-[#5C2472] hover:border focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white
                "
            />
        </div>
        <select
            value={estado}
            onChange={(e) => onEstado(e.target.value)}
            aria-label="Filtrar por estado"
            className="h-10 px-3 rounded-lg bg-[#F8F8F8] text-[13px] font-garetmedium text-[#191919] cursor-pointer hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#5C2472]"
        >
            <option value="">Todos los estados</option>
            <option value="en_proceso">En proceso</option>
            <option value="enviado">Enviados</option>
            <option value="expirado">Expirados</option>
        </select>
        <select
            value={sort}
            onChange={(e) => onSort(e.target.value)}
            aria-label="Ordenar"
            className="h-10 px-3 rounded-lg bg-[#F8F8F8] text-[13px] font-garetmedium text-[#191919] cursor-pointer hover:bg-white focus:outline-none focus:ring-1 focus:ring-[#5C2472]"
        >
            {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    </div>
);

const EnvioCard = ({ envio, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="
            w-full text-left rounded-[16px] border border-[#E2E2E2] p-5 bg-white
            shadow-sm hover:shadow-lg hover:border-[#5C2473] hover:-translate-y-0.5
            transition duration-200 flex items-start justify-between gap-4
        "
    >
        <div className="min-w-0 flex-1">
            <Typography as="h2" className="!text-[#5C2473]" titleName={envio.formulario.nombre} />
            {envio.formulario.descripcion && (
                <Typography
                    as="p"
                    className="text-[#7C7C7C] font-garetregular mt-1"
                    titleName={envio.formulario.descripcion}
                />
            )}
            <p className="text-xs text-[#7C7C7C] mt-2">
                {envio.estado === 'enviado'
                    ? `Enviado el ${formatDate(envio.enviado_en)}`
                    : `Última actualización ${formatDate(envio.actualizado_en)}`}
            </p>
        </div>
        <span className={`
            shrink-0 text-xs font-garetbold px-3 py-1 rounded-full
            ${ESTADO_COLOR[envio.estado] || 'bg-neutral-100 text-neutral-700'}
        `}>
            {ESTADO_LABEL[envio.estado] || envio.estado}
        </span>
    </button>
);

const Pagination = ({ page, pageSize, total, onPage }) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages === 1) return null;
    return (
        <div className="w-full flex items-center justify-between gap-3 mt-6">
            <p className="text-[12px] text-[#7C7C7C] font-garetmedium">
                Página {page} de {totalPages} · {total} envío{total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E2E2] text-[13px] font-garetbold text-[#5C2473] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0E2F5]"
                >
                    Anterior
                </button>
                <button
                    type="button"
                    onClick={() => onPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E2E2] text-[13px] font-garetbold text-[#5C2473] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F0E2F5]"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};

const MisEnvios = () => {
    const { onFetch } = useAuth();
    const navigate = useNavigate();

    const [estado, setEstado] = useState('');
    const [q, setQ] = useState('');
    const [sort, setSort] = useState('-actualizado_en');
    const [page, setPage] = useState(1);

    const [data, setData] = useState({ total: 0, items: [], page: 1, page_size: PAGE_SIZE });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { setPage(1); }, [estado, q, sort]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        listMisEnvios(onFetch, { estado, q, sort, page, page_size: PAGE_SIZE })
            .then((res) => { if (!cancelled) setData(res); })
            .catch((err) => { if (!cancelled) setError(err.message || 'Error al cargar mis envíos'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [onFetch, estado, q, sort, page]);

    return (
        <div className="
            w-full flex flex-col items-start justify-start rounded-[20px]
            bg-white shadow-xl-[#03222708] px-2 pb-2 md:px-10 md:pb-10 md:pt-10 text-black
        ">
            <div className="w-full">
                <Typography as="h1" titleName="Mis envíos" />
                <Typography
                    as="p"
                    className="text-[#7C7C7C] font-garetregular mt-1"
                    titleName="Histórico de tus formularios. Da click en uno para ver el detalle, descargar el PDF o ver los archivos adjuntos."
                />
            </div>

            <div className="w-full mt-6">
                <Filters
                    estado={estado} onEstado={setEstado}
                    q={q} onQ={setQ}
                    sort={sort} onSort={setSort}
                />
            </div>

            {loading ? (
                <div className="w-full flex justify-center py-10"><Loading /></div>
            ) : error ? (
                <div className="w-full mt-6 rounded-[16px] bg-red-50 border border-red-100 p-4">
                    <Typography as="p" className="text-red-700" titleName={error} />
                </div>
            ) : data.items.length === 0 ? (
                <div className="w-full mt-8 py-12 text-center">
                    <Typography
                        as="p"
                        className="text-[#7C7C7C]"
                        titleName={q || estado
                            ? 'Sin resultados con los filtros actuales.'
                            : 'Aún no tienes envíos. Cuando empieces o envíes formularios aparecerán aquí.'}
                    />
                </div>
            ) : (
                <>
                    <ul className="w-full mt-6 space-y-4">
                        {data.items.map((e) => (
                            <li key={e.id}>
                                <EnvioCard envio={e} onClick={() => navigate(`/mis-envios/${e.id}`)} />
                            </li>
                        ))}
                    </ul>
                    <Pagination
                        page={data.page}
                        pageSize={data.page_size}
                        total={data.total}
                        onPage={setPage}
                    />
                </>
            )}
        </div>
    );
};

export default MisEnvios;
