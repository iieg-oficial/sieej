import React from 'react';
import Tooltip from '@components/Tooltip';
import iniciales from '@helpers/iniciales';

const COLORES = ['#5C2472', '#FF8300', '#1E7B7B', '#B23A6E', '#2F5FAF'];

const colorDe = (username) => {
    const suma = String(username || '')
        .split('')
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return COLORES[suma % COLORES.length];
};

const PresenciaEditores = ({ presentes = [], seccionActual, tituloSeccion }) => {
    if (!presentes.length) return null;

    const aqui = presentes.filter((e) => e.seccion && e.seccion === seccionActual);

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {presentes.slice(0, 4).map((editor) => (
                    <Tooltip
                        key={editor.username}
                        showIcon={false}
                        size="small"
                        text={editor.seccion === seccionActual
                            ? `${editor.name} está en esta sección`
                            : `${editor.name} está capturando`}
                    >
                        <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full
                                border-2 border-white text-[10px] font-garetbold text-white"
                            style={{ backgroundColor: colorDe(editor.username) }}
                        >
                            {iniciales(editor.name || editor.username)}
                        </span>
                    </Tooltip>
                ))}
            </div>
            {presentes.length > 4 && (
                <span className="text-[11px] font-garetmedium text-[#7C7C7C]">
                    +{presentes.length - 4}
                </span>
            )}
            {aqui.length > 0 && (
                <span className="rounded-full bg-[#FEDAB2] px-2 py-0.5 text-[10px] font-garetbold text-[#FF8300]">
                    {aqui.length === 1
                        ? `${aqui[0].name} en ${tituloSeccion || 'esta sección'}`
                        : `${aqui.length} personas en ${tituloSeccion || 'esta sección'}`}
                </span>
            )}
        </div>
    );
};

export default PresenciaEditores;
