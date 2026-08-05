import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useGlobal from '@context/useGlobal';
import icoClose from '@assets/icons/ico_x_slow.svg';
import { buildDays, parseISO, toISO, todayISO } from '@helpers/dateFormat';
import { buildRangeGuards, saltoDeVista } from '@helpers/calendarRange';
import ChevronIcon from './icons/ChevronIcon';
import CalendarOptions from './CalendarOptions';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTHS_SHORT = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
const YEAR_SPAN_BACK = 100;
const YEAR_SPAN_FWD = 10;

const dayClassName = ({ isSelected, disabled, isToday }) => {
    const base = 'w-9 h-9 p-0 flex items-center justify-center rounded-full font-garetmedium text-[13px] '
        + 'transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    if (isSelected) return `${base}bg-[#5C2472] text-white`;
    if (disabled) return `${base}text-[#CBCBCB] cursor-not-allowed`;
    if (isToday) return `${base}text-[#5C2472] border border-[#5C2472] hover:bg-[#F0E2F5]`;
    return `${base}text-[#191919] hover:bg-[#F0E2F5] hover:text-[#5C2472]`;
};

const chipClassName = (active, disabled) => {
    const base = 'px-2 py-2 rounded-[8px] font-garetmedium text-[13px] transition '
        + 'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    if (disabled) return `${base}text-[#CBCBCB] cursor-not-allowed`;
    return active
        ? `${base}bg-[#5C2472] text-white`
        : `${base}text-[#191919] hover:bg-[#F0E2F5] hover:text-[#5C2472]`;
};

const arrowClassName = (disabled) => {
    const base = 'w-8 h-8 !p-0 flex items-center justify-center rounded-full transition '
        + 'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    return disabled
        ? `${base}opacity-30 cursor-not-allowed`
        : `${base}hover:bg-[#F0E2F5]`;
};

const headerButtonClassName = (active) => {
    const base = 'px-2 py-1 rounded-[8px] font-garetbold text-[14px] text-[#5C2472] transition '
        + 'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    return active ? `${base}bg-[#F0E2F5]` : `${base}hover:bg-[#F0E2F5]`;
};

const Calendar = ({
    value, onSelect, onClose, min, max,
    options = [], optionValue, onSelectOption,
}) => {
    const { screenSize } = useGlobal();
    const fullscreen = screenSize.sm;
    const selected = parseISO(value);
    const [view, setView] = useState(() => {
        if (selected) return { year: selected.year, month: selected.month };
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [mode, setMode] = useState('days');
    const [dropUp, setDropUp] = useState(false);
    const yearRef = useRef(null);
    const panelRef = useRef(null);

    const currentYear = new Date().getFullYear();
    const minYear = parseISO(min)?.year ?? currentYear - YEAR_SPAN_BACK;
    const maxYear = parseISO(max)?.year ?? currentYear + YEAR_SPAN_FWD;
    const years = [];
    for (let year = minYear; year <= maxYear; year += 1) years.push(year);

    useEffect(() => {
        if (mode === 'years' && yearRef.current) {
            yearRef.current.scrollIntoView({ block: 'center' });
        }
    }, [mode]);

    useEffect(() => {
        if (!fullscreen) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [fullscreen]);

    useLayoutEffect(() => {
        if (fullscreen) return undefined;
        const ajustarPosicion = () => {
            const panel = panelRef.current;
            const anchor = panel?.offsetParent?.getBoundingClientRect?.();
            if (!panel || !anchor) return;
            const espacioAbajo = window.innerHeight - anchor.bottom;
            const espacioArriba = anchor.top;
            const alto = panel.offsetHeight + 8;
            setDropUp(espacioAbajo < alto && espacioArriba > espacioAbajo);
        };
        ajustarPosicion();
        window.addEventListener('resize', ajustarPosicion);
        window.addEventListener('scroll', ajustarPosicion, true);
        return () => {
            window.removeEventListener('resize', ajustarPosicion);
            window.removeEventListener('scroll', ajustarPosicion, true);
        };
    }, [fullscreen, mode]);

    const goPrev = () => setView(({ year, month }) => {
        if (mode === 'months') return { year: year - 1, month };
        return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
    });
    const goNext = () => setView(({ year, month }) => {
        if (mode === 'months') return { year: year + 1, month };
        return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
    });

    const pickMonth = (month) => {
        setView((prev) => ({ ...prev, month }));
        setMode('days');
    };
    const pickYear = (year) => {
        setView((prev) => ({ ...prev, year }));
        setMode('days');
    };

    const { diaFuera, mesFuera, anioFuera } = buildRangeGuards(min, max);
    const porAnio = mode === 'months';
    const destinoFuera = (paso) => {
        const { year, month } = saltoDeVista(view, paso, porAnio);
        return porAnio ? anioFuera(year) : mesFuera(year, month);
    };

    const today = todayISO();
    const days = buildDays(view.year, view.month);
    const showArrows = mode !== 'years';
    const prevFuera = destinoFuera(-1);
    const nextFuera = destinoFuera(1);

    const body = (
        <>
            <div className="flex items-center justify-between mb-3">
                {showArrows ? (
                    <button
                        type="button"
                        onClick={goPrev}
                        disabled={prevFuera}
                        aria-label="Anterior"
                        className={arrowClassName(prevFuera)}
                    >
                        <ChevronIcon direction="left" />
                    </button>
                ) : <span className="w-8 h-8" />}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'months' ? 'days' : 'months')}
                        className={headerButtonClassName(mode === 'months')}
                    >
                        {MONTHS[view.month]}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode(mode === 'years' ? 'days' : 'years')}
                        className={headerButtonClassName(mode === 'years')}
                    >
                        {view.year}
                    </button>
                </div>
                {showArrows ? (
                    <button
                        type="button"
                        onClick={goNext}
                        disabled={nextFuera}
                        aria-label="Siguiente"
                        className={arrowClassName(nextFuera)}
                    >
                        <ChevronIcon direction="right" />
                    </button>
                ) : <span className="w-8 h-8" />}
            </div>

            {mode === 'days' && (
                <>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {WEEKDAYS.map((weekday) => (
                            <span
                                key={weekday}
                                className="h-8 flex items-center justify-center font-garetmedium text-[11px] text-[#8E8E8E]"
                            >
                                {weekday}
                            </span>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1 justify-items-center">
                        {days.map((day, index) => {
                            if (!day) return <span key={`empty-${index}`} className="w-9 h-9" />;
                            const iso = toISO(view.year, view.month, day);
                            const isSelected = iso === value;
                            const disabled = diaFuera(iso);
                            const isToday = iso === today;
                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    disabled={disabled}
                                    aria-pressed={isSelected}
                                    onClick={() => onSelect(iso)}
                                    className={dayClassName({ isSelected, disabled, isToday })}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {mode === 'months' && (
                <div className="grid grid-cols-3 gap-2">
                    {MONTHS_SHORT.map((monthName, index) => {
                        const fuera = mesFuera(view.year, index);
                        return (
                            <button
                                key={monthName}
                                type="button"
                                disabled={fuera}
                                onClick={() => pickMonth(index)}
                                className={chipClassName(index === view.month, fuera)}
                            >
                                {monthName}
                            </button>
                        );
                    })}
                </div>
            )}

            {mode === 'years' && (
                <div className="grid grid-cols-3 gap-2 max-h-[228px] overflow-y-auto pr-1">
                    {years.map((year) => (
                        <button
                            key={year}
                            ref={year === view.year ? yearRef : null}
                            type="button"
                            onClick={() => pickYear(year)}
                            className={chipClassName(year === view.year)}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}

            <CalendarOptions
                options={options}
                optionValue={optionValue}
                onSelectOption={onSelectOption}
            />
        </>
    );

    if (fullscreen) {
        return (
            <>
                <div
                    className="fixed inset-0 z-40 bg-black/30"
                    aria-hidden="true"
                    onClick={onClose}
                />
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Selecciona una fecha"
                    className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[20px] px-4 pt-3 pb-6
                        shadow-[0px_-4px_24px_#B6A6BC66]"
                >
                    <div className="max-w-[400px] mx-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-garetbold text-[15px] text-[#5C2472]">
                                Selecciona una fecha
                            </span>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="w-9 h-9 p-0 flex items-center justify-center rounded-full transition
                                    hover:bg-[#F0E2F5] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472]"
                            >
                                <img src={icoClose} alt="" className="w-4 h-4" />
                            </button>
                        </div>
                        {body}
                    </div>
                </div>
            </>
        );
    }

    return (
        <div
            ref={panelRef}
            role="dialog"
            aria-label="Selecciona una fecha"
            className={`absolute left-0 z-20 w-[288px] p-3 bg-white rounded-[12px]
                border border-[#5C2472] shadow-[0px_2px_24px_#B6A6BC98]
                ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
        >
            {body}
        </div>
    );
};

export default Calendar;
