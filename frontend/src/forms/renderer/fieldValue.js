import { resolveOptions } from './catalogResolver';

const BOOLEANOS = { true: 'Sí', false: 'No' };

const esBooleano = (valor) => (
    typeof valor === 'boolean' || valor === 'true' || valor === 'false'
);

const labelBooleano = (valor) => BOOLEANOS[String(valor)];

const labelDeOpcion = (field, valor, catalogos) => {
    const opciones = resolveOptions(field, catalogos);
    const opcion = opciones.find((o) => String(o.value) === String(valor));
    if (opcion) return opcion.label;
    return esBooleano(valor) ? labelBooleano(valor) : null;
};

const formatObjeto = (valor) => {
    const archivo = valor.filename_original || valor.filename || valor.url_publica;
    if (archivo) return archivo;
    const inicio = valor.startOption || valor.start || '';
    const fin = valor.endOption || valor.end || '';
    if (inicio || fin) return `${inicio} – ${fin}`;
    return Object.keys(valor).length ? JSON.stringify(valor) : '';
};

export const formatFieldValue = (field, value, catalogos) => {
    if (value === null || value === undefined || value === '') return '';
    const tipo = field?.type;

    if (tipo === 'checkbox') return value ? 'Sí' : 'No';

    if (tipo === 'radio' || tipo === 'select') {
        return labelDeOpcion(field, value, catalogos) ?? String(value);
    }

    if (tipo === 'select_multiple' || Array.isArray(value)) {
        if (!Array.isArray(value)) return '';
        return value
            .map((v) => labelDeOpcion(field ?? {}, v, catalogos) ?? String(v))
            .join(', ');
    }

    if (tipo === 'date_range' || (typeof value === 'object' && tipo !== 'file')) {
        if (typeof value !== 'object') return String(value);
        return formatObjeto(value);
    }

    if (tipo === 'file') {
        return typeof value === 'object' ? formatObjeto(value) : String(value);
    }

    if (esBooleano(value)) return labelBooleano(value);

    return String(value);
};
