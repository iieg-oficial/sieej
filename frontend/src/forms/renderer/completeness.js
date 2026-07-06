import { evaluarShowWhen } from './conditional';

const sinValor = (valor) => (
    valor === undefined
    || valor === null
    || valor === ''
    || valor === false
    || (Array.isArray(valor) && valor.length === 0)
);

const faltanRequeridos = (fields, item) => (fields ?? []).some((field) => {
    if (field.type === 'info' || !field.required) return false;
    if (!evaluarShowWhen(field.showWhen, item)) return false;
    return sinValor(item?.[field.name]);
});

export const requisitosPendientes = (step, values) => {
    if (!step || step.type === 'summary') return null;
    const scope = values?.[step.id];
    if (step.type === 'repeater') {
        const items = Array.isArray(scope) ? scope : [];
        const min = step.minItems ?? 0;
        if (items.length < min) {
            return min === 1
                ? 'Agrega al menos un elemento para continuar.'
                : `Agrega al menos ${min} elementos para continuar.`;
        }
        return items.some((item) => faltanRequeridos(step.fields, item ?? {}))
            ? 'Completa los campos obligatorios para continuar.'
            : null;
    }
    return faltanRequeridos(step.fields, scope ?? {})
        ? 'Completa los campos obligatorios para continuar.'
        : null;
};

export const stepIncompleto = (step, values) => {
    const fields = step?.fields ?? [];
    if (!fields.length) return false;
    const scope = values?.[step.id];
    const items = step.type === 'repeater'
        ? (Array.isArray(scope) ? scope : [])
        : [scope ?? {}];
    if (step.type === 'repeater' && !items.length) return true;
    return items.some((item) => fields.some((field) => {
        if (field.type === 'info') return false;
        if (!evaluarShowWhen(field.showWhen, item)) return false;
        return sinValor(item?.[field.name]);
    }));
};
