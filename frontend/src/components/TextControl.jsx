import React from 'react';

const BASE = `
    block w-full px-4 py-2 rounded-[8px] bg-[#F8F8F8] text-[#5C2472]
    font-garetmedium text-[13px] cursor-auto
    placeholder-[#8E8E8E] placeholder:font-garetregular
    hover:shadow-[0px_2px_24px_#B6A6BC98] hover:bg-white hover:border-[#5C2472] hover:border
    focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white
`;

const PADDING_ACCIONES = {
    0: '',
    1: 'pr-[44px]',
    2: 'pr-[72px]',
    3: 'pr-[100px]',
};

const TextControl = ({
    multiline, rows, error, acciones = [], className = '', ...props
}) => {
    const clases = `
        ${className}
        ${BASE}
        ${PADDING_ACCIONES[acciones.length] ?? PADDING_ACCIONES[3]}
        ${multiline ? 'resize-y leading-[20px]' : 'h-[40px] text-ellipsis'}
        ${error ? 'border border-[#EA4336] placeholder-[#EA4336] bg-white' : ''}
    `;

    return (
        <div className="relative mt-[12px] group/field">
            {multiline
                ? <textarea rows={rows} {...props} className={clases} />
                : <input {...props} className={clases} />}
            {acciones.length > 0 && (
                <div className="absolute right-3 top-0 h-[40px] flex items-center gap-1">
                    {acciones}
                </div>
            )}
        </div>
    );
};

export default TextControl;
