import React from 'react';
import Typography from '@components/Typography';

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

const formatValor = (valor) => {
    if (valor === null || valor === undefined || valor === '') return '(vacío)';
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (Array.isArray(valor)) return valor.length ? valor.join(', ') : '(vacío)';
    if (typeof valor === 'object') {
        if (valor.filename || valor.filename_original) {
            return valor.filename || valor.filename_original;
        }
        if (valor.start || valor.end || valor.startOption || valor.endOption) {
            return `${valor.startOption || valor.start || ''} – ${valor.endOption || valor.end || ''}`;
        }
        return JSON.stringify(valor);
    }
    return String(valor);
};

const HistorialCampos = ({ items = [] }) => {
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
        <ol className="border-l-2 border-[#F0E2F5] pl-3 divide-y divide-[#EFEFEF]">
            {items.map((item, idx) => (
                <li
                    key={idx}
                    className="py-2 flex flex-col md:flex-row md:items-baseline md:justify-between gap-0.5 md:gap-4"
                >
                    <span className="flex flex-wrap items-baseline gap-2 text-[13px] font-garetregular min-w-0">
                        <span className="text-[#7C7C7C] line-through break-all">
                            {formatValor(item.valor_anterior)}
                        </span>
                        <span className="text-[#7C7C7C]" aria-hidden="true">→</span>
                        <span className="text-[#191919] break-all">
                            {formatValor(item.valor_nuevo)}
                        </span>
                    </span>
                    <span className="text-[11px] text-[#7C7C7C] font-garetregular shrink-0">
                        {formatFecha(item.cambiado_en)}
                    </span>
                </li>
            ))}
        </ol>
    );
};

export default HistorialCampos;
