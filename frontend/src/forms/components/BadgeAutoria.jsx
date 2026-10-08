import React from 'react';
import Tooltip from '@components/Tooltip';
import iniciales from '@helpers/iniciales';
import { formatFechaCorta, formatFechaHora } from '@helpers/dateFormat';

const CLASE = 'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] '
    + 'font-garetbold ml-2 bg-[#EDE7F1] text-[#5C2472] align-middle';

const BadgeAutoria = ({ autoria }) => {
    if (!autoria?.cambiado_en) return null;

    const nombre = autoria.actor_nombre;
    const texto = nombre
        ? `Modificado por ${nombre} · ${formatFechaHora(autoria.cambiado_en)}`
        : `Modificado el ${formatFechaHora(autoria.cambiado_en)}`;

    return (
        <Tooltip text={texto} showIcon={false} size="small">
            <span className={CLASE}>
                {nombre ? iniciales(nombre) : formatFechaCorta(autoria.cambiado_en)}
            </span>
        </Tooltip>
    );
};

export default BadgeAutoria;
