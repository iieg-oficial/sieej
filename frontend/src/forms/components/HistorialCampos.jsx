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

const HistorialCampos = ({ items = [], loading = false }) => {
    if (loading) {
        return (
            <Typography as="p" className="text-[#7C7C7C]" titleName="Cargando historial..." />
        );
    }

    if (!items.length) {
        return (
            <Typography
                as="p"
                className="text-[#7C7C7C]"
                titleName="Todavía no has actualizado ningún campo."
            />
        );
    }

    return (
        <ol className="space-y-3">
            {items.map((item, idx) => (
                <li key={idx} className="rounded-[12px] border border-[#E2E2E2] px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[13px] font-garetbold text-[#191919]">
                            {item.field_label || item.field_path}
                        </p>
                        <span className="text-[11px] text-[#7C7C7C] font-garetregular">
                            {formatFecha(item.cambiado_en)}
                        </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] font-garetregular">
                        <span className="text-[#7C7C7C] line-through break-all">
                            {formatValor(item.valor_anterior)}
                        </span>
                        <span className="text-[#7C7C7C]" aria-hidden="true">→</span>
                        <span className="text-[#191919] break-all">
                            {formatValor(item.valor_nuevo)}
                        </span>
                    </div>
                </li>
            ))}
        </ol>
    );
};

export default HistorialCampos;
