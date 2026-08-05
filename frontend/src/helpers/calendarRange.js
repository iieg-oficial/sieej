import { toISO } from './dateFormat';

const ultimoDiaDe = (year, month) => new Date(year, month + 1, 0).getDate();

export const buildRangeGuards = (min, max) => {
    const tramoFuera = (desde, hasta) => (!!min && hasta < min) || (!!max && desde > max);

    return {
        diaFuera: (iso) => (!!min && iso < min) || (!!max && iso > max),
        mesFuera: (year, month) => tramoFuera(
            toISO(year, month, 1),
            toISO(year, month, ultimoDiaDe(year, month)),
        ),
        anioFuera: (year) => tramoFuera(toISO(year, 0, 1), toISO(year, 11, 31)),
    };
};

export const saltoDeVista = ({ year, month }, paso, porAnio) => {
    if (porAnio) return { year: year + paso, month };
    const total = year * 12 + month + paso;
    return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
};
