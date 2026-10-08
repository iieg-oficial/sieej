import React from 'react';
import Typography from '@components/Typography';

const formatBytes = (n) => {
    if (!n && n !== 0) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const EnvioAdjuntos = ({ archivos = [] }) => {
    if (!archivos.length) {
        return (
            <Typography
                as="p"
                className="text-[#7C7C7C]"
                titleName="Sin archivos adjuntos."
            />
        );
    }
    return (
        <ul className="space-y-2">
            {archivos.map((a) => (
                <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#F8F8F8] hover:bg-white hover:shadow-sm transition"
                >
                    <div className="min-w-0 flex-1">
                        <a
                            href={a.url_publica || '#'}
                            download={a.url_publica ? a.filename_original || true : undefined}
                            rel="noopener noreferrer"
                            className="text-[13px] font-garetbold text-[#5C2472] hover:underline line-clamp-1"
                            aria-disabled={!a.url_publica}
                        >
                            {a.filename_original}
                        </a>
                        <p className="text-[11px] text-[#7C7C7C] font-garetregular">
                            {a.mime} · {formatBytes(a.size_bytes)}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default EnvioAdjuntos;
