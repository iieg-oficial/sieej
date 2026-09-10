import { camposEditables } from './editableFields';
import { CLAVE_ETIQUETA } from './repeaterItems';

const vacio = (valor) => valor === undefined || valor === null || valor === ''
    || (Array.isArray(valor) && valor.length === 0);

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const agruparActualizables = (definicion) => (definicion?.steps || [])
    .filter((step) => step.type !== 'summary')
    .map((step) => ({ step, fields: camposEditables({ steps: [step] }) }))
    .filter(({ fields }) => fields.length > 0);

const camposDelPaso = (step) => (step.fields || [])
    .filter((field) => field.type !== 'info' && field.type !== 'file');

export const armarPayload = ({ grupos, valores, original }) => {
    const campos = {};
    grupos.forEach(({ step, fields }) => {
        const editables = fields.filter((field) => field.type !== 'file');
        if (step.type !== 'repeater') {
            editables.forEach((field) => {
                campos[`${step.id}.${field.name}`] = valores?.[step.id]?.[field.name];
            });
            return;
        }
        const antes = Array.isArray(original?.[step.id]) ? original[step.id] : [];
        const ahora = Array.isArray(valores?.[step.id]) ? valores[step.id] : [];
        ahora.forEach((item, idx) => {
            const prefijo = `${step.id}[${idx}]`;
            const nuevo = idx >= antes.length;
            const etiqueta = item?.[CLAVE_ETIQUETA] || null;
            if (etiqueta !== (antes[idx]?.[CLAVE_ETIQUETA] || null)) {
                campos[`${prefijo}.${CLAVE_ETIQUETA}`] = etiqueta;
            }
            (nuevo ? camposDelPaso(step) : editables).forEach((field) => {
                const valor = item?.[field.name];
                if (nuevo && vacio(valor)) return;
                campos[`${prefijo}.${field.name}`] = valor;
            });
        });
    });
    return campos;
};

export const reindexarPendientes = (pendientes, stepId, quitado) => {
    const patron = new RegExp(`^${escaparRegex(stepId)}\\[(\\d+)\\]\\.(.+)$`);
    const entradas = [...pendientes.entries()];
    pendientes.clear();
    entradas.forEach(([ruta, archivo]) => {
        const partes = ruta.match(patron);
        if (!partes) {
            pendientes.set(ruta, archivo);
            return;
        }
        const idx = Number(partes[1]);
        if (idx === quitado) return;
        pendientes.set(`${stepId}[${idx > quitado ? idx - 1 : idx}].${partes[2]}`, archivo);
    });
    return pendientes;
};
