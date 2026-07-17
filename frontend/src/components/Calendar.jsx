import React, { useEffect, useRef, useState } from 'react';
import useGlobal from '@context/useGlobal';
import icoClose from '@assets/icons/ico_x_slow.svg';
import { buildDays, parseISO, toISO, todayISO } from '@helpers/dateFormat';

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

const Chevron = ({ direction }) => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
    >
        <path
            d={direction === 'left' ? 'M10 3 L5 8 L10 13' : 'M6 3 L11 8 L6 13'}
            stroke="#5C2472"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const dayClassName = ({ isSelected, disabled, isToday }) => {
    const base = 'w-9 h-9 p-0 flex items-center justify-center rounded-full font-garetmedium text-[13px] '
        + 'transition focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    if (isSelected) return `${base}bg-[#5C2472] text-white`;
    if (disabled) return `${base}text-[#CBCBCB] cursor-not-allowed`;
    if (isToday) return `${base}text-[#5C2472] border border-[#5C2472] hover:bg-[#F0E2F5]`;
    return `${base}text-[#191919] hover:bg-[#F0E2F5] hover:text-[#5C2472]`;
};

const chipClassName = (active) => {
    const base = 'px-2 py-2 rounded-[8px] font-garetmedium text-[13px] transition '
        + 'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    return active
        ? `${base}bg-[#5C2472] text-white`
        : `${base}text-[#191919] hover:bg-[#F0E2F5] hover:text-[#5C2472]`;
};

const headerButtonClassName = (active) => {
    const base = 'px-2 py-1 rounded-[8px] font-garetbold text-[14px] text-[#5C2472] transition '
        + 'focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472] ';
    return active ? `${base}bg-[#F0E2F5]` : `${base}hover:bg-[#F0E2F5]`;
};

const Calendar = ({ value, onSelect, onClose, min, max }) => {
    const { screenSize } = useGlobal();
    const fullscreen = screenSize.sm;
    const selected = parseISO(value);
    const [view, setView] = useState(() => {
        if (selected) return { year: selected.year, month: selected.month };
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [mode, setMode] = useState('days');
    const yearRef = useRef(null);

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

    const isDisabled = (iso) => (min && iso < min) || (max && iso > max);
    const today = todayISO();
    const days = buildDays(view.year, view.month);
    const showArrows = mode !== 'years';

    const body = (
        <>
            <div className="flex items-center justify-between mb-3">
                {showArrows ? (
                    <button
                        type="button"
                        onClick={goPrev}
                        aria-label="Anterior"
                        className="
                            w-8 h-8 !p-0 flex items-center justify-center rounded-full transition
                            hover:bg-[#F0E2F5] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472]"
                    >
                        <Chevron direction="left" />
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
                        aria-label="Siguiente"
                        className="
                            w-8 h-8 !p-0 flex items-center justify-center rounded-full transition
                            hover:bg-[#F0E2F5] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5C2472]"
                    >
                        <Chevron direction="right" />
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
                            const disabled = isDisabled(iso);
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
                    {MONTHS_SHORT.map((monthName, index) => (
                        <button
                            key={monthName}
                            type="button"
                            onClick={() => pickMonth(index)}
                            className={chipClassName(index === view.month)}
                        >
                            {monthName}
                        </button>
                    ))}
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
            role="dialog"
            aria-label="Selecciona una fecha"
            className="absolute left-0 top-full z-20 mt-2 w-[288px] p-3 bg-white rounded-[12px]
                border border-[#5C2472] shadow-[0px_2px_24px_#B6A6BC98]"
        >
            {body}
        </div>
    );
};

export default Calendar;
