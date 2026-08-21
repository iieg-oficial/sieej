import React from 'react';
import Typography from '@components/Typography';

const EVENT_LABEL = {
    iniciado: 'Iniciaste el formulario',
    guardado: 'Guardaste un avance',
    enviado: 'Enviaste el formulario',
    expirado: 'El formulario expiró',
    reabierto: 'El formulario fue reabierto',
    actualizado: 'Se corrigieron campos del envío',
};

const EVENT_COLOR = {
    iniciado: 'bg-neutral-200 text-neutral-700',
    guardado: 'bg-amber-100 text-amber-800',
    enviado: 'bg-emerald-100 text-emerald-800',
    expirado: 'bg-red-100 text-red-700',
    reabierto: 'bg-blue-100 text-blue-700',
    actualizado: 'bg-violet-100 text-violet-700',
};

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const EventTimeline = ({ eventos = [] }) => {
    if (!eventos.length) {
        return (
            <Typography
                as="p"
                className="text-[#7C7C7C]"
                titleName="Sin eventos registrados."
            />
        );
    }

    return (
        <ol className="relative ml-3 border-l border-[#E2E2E2]">
            {eventos.map((ev, idx) => (
                <li key={idx} className="ml-4 pb-4 last:pb-0">
                    <span
                        className={`
                            absolute -left-[7px] flex items-center justify-center
                            w-3 h-3 rounded-full ring-2 ring-white
                            ${EVENT_COLOR[ev.tipo] || EVENT_COLOR.iniciado}
                        `}
                        aria-hidden="true"
                    />
                    <p className="text-[13px] font-garetbold text-[#191919]">
                        {EVENT_LABEL[ev.tipo] || ev.tipo}
                    </p>
                    <p className="text-[11px] text-[#7C7C7C] font-garetregular">
                        {formatDate(ev.ocurrido_en)}
                    </p>
                </li>
            ))}
        </ol>
    );
};

export default EventTimeline;
