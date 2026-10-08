import React from 'react';
import Typography from '@components/Typography';
import { formatFieldValue } from '@forms/renderer/fieldValue';
import rigthDarkIcon from '@icons/ico_rigth_arrow_dark.svg';

const formatFecha = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatValor = (valor, field, catalogos) => (
    formatFieldValue(field, valor, catalogos) || '(vacío)'
);

const HistorialCampos = ({ items = [], field, catalogos }) => {
    if (!items.length) {
        return (
            <Typography
                as="p"
                className="text-[#7C7C7C] text-xs"
                titleName="Sin cambios registrados."
            />
        );
    }

    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-[#A8A8A8] font-garetmedium mb-1">
                Historial
            </p>
            <ol className="space-y-1">
                {items.map((item, idx) => (
                    <li
                        key={idx}
                        className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-0.5 md:gap-4"
                    >
                        <span className="flex flex-wrap items-baseline gap-2 text-[13px] font-garetregular min-w-0">
                            <span className="text-[#FF8300] shrink-0" aria-hidden="true">–</span>
                            <span className="text-[#7C7C7C] line-through break-all">
                                {formatValor(item.valor_anterior, field, catalogos)}
                            </span>
                            <img src={rigthDarkIcon} alt="" className="w-[5px] h-[10px] shrink-0" />
                            <span className="text-[#191919] break-all">
                                {formatValor(item.valor_nuevo, field, catalogos)}
                            </span>
                        </span>
                        <span className="text-[11px] text-[#7C7C7C] font-garetregular shrink-0">
                            {item.actor_nombre
                                ? `${item.actor_nombre} · ${formatFecha(item.cambiado_en)}`
                                : formatFecha(item.cambiado_en)}
                        </span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default HistorialCampos;
