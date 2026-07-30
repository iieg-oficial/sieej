import React from 'react';

const BASE = `
    block w-full px-4 py-2 rounded-[8px] bg-[#F8F8F8] text-[#5C2472]
    font-garetmedium text-[13px] cursor-auto border border-transparent
    placeholder-[#8E8E8E] placeholder:font-garetregular
    hover:shadow-[0px_2px_24px_#B6A6BC98] hover:bg-white hover:border-[#5C2472]
    focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white
`;

const ALTO = {
    input: 'h-[40px] text-ellipsis',
    colapsado: 'h-[40px] resize-none overflow-hidden',
    expandido: 'resize-y leading-[20px]',
};

const ANCHO_ACCION = 26;
const MARGEN_ACCIONES = 12;
const ALTO_CONTROL = 40;
const ALTO_BORDES = 2;

const reservaDe = (total) => (
    total > 0 ? MARGEN_ACCIONES + (total * ANCHO_ACCION) + 6 : 0
);

const UNA_LINEA = {
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: `${ALTO_CONTROL - ALTO_BORDES}px`,
};

const TextControl = ({
    multiline, expandido, rows, error, acciones = [], reservas, className = '', style, ...props
}) => {
    const alto = multiline
        ? (expandido ? ALTO.expandido : ALTO.colapsado)
        : ALTO.input;
    const clases = `
        ${className}
        ${BASE}
        ${alto}
        ${error ? 'border-[#EA4336]! placeholder-[#EA4336] bg-white' : ''}
    `;

    const reserva = reservaDe(Math.max(reservas ?? 0, acciones.length));
    const estilo = {
        ...style,
        ...(reserva ? { paddingRight: reserva } : {}),
        ...(multiline && !expandido ? UNA_LINEA : {}),
    };

    return (
        <div className="relative mt-[12px] group/field">
            {multiline
                ? <textarea rows={rows} {...props} className={clases} style={estilo} />
                : <input {...props} className={clases} style={estilo} />}
            {acciones.length > 0 && (
                <div className="absolute right-3 top-0 h-[40px] flex items-center gap-1">
                    {acciones}
                </div>
            )}
        </div>
    );
};

export default TextControl;
