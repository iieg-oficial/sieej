import React from 'react';

const STATE_CLASS = {
    neutral: 'text-[#8E8E8E]',
    ok: 'text-[#34A853]',
    error: 'text-[#EA4336]',
    limite: 'text-[#FF8300]',
};

const FieldHints = ({ items = [] }) => {
    if (!items.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {items.map((hint) => (
                <span
                    key={hint.id}
                    className={`text-[11px] font-garetregular ${STATE_CLASS[hint.state] || STATE_CLASS.neutral}`}
                >
                    {hint.text}
                </span>
            ))}
        </div>
    );
};

export default FieldHints;
