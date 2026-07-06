import { pdf } from '@react-pdf/renderer';
import React from 'react';
import PdfForm from './PdfForm';

const stringToBoolean = (v) => {
    if (typeof v === 'boolean') return v;
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
};

const adaptItem = (item) => {
    if (!item || typeof item !== 'object') return item;
    const result = {};
    for (const [k, v] of Object.entries(item)) {
        if (v === 'true' || v === 'false') {
            result[k] = stringToBoolean(v);
        } else if (Array.isArray(v)) {
            result[k] = v;
        } else if (v && typeof v === 'object' && v.url_publica) {
            result[k] = v.url_publica;
        } else {
            result[k] = v;
        }
    }
    return result;
};

const adaptDatosToFormData = (datos) => ({
    informacion_general: adaptItem(datos.general),
    informacion_enlaces: Array.isArray(datos.enlaces)
        ? datos.enlaces.map(adaptItem)
        : datos.enlaces,
    informacion_basesdatos: Array.isArray(datos.bases_datos)
        ? datos.bases_datos.map(adaptItem)
        : datos.bases_datos,
});

export const downloadSieejLevantamientoPdf = async (datos, nombre, filename) => {
    const formData = adaptDatosToFormData(datos);
    const blob = await pdf(<PdfForm formData={formData} nombre={nombre} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${nombre || 'formulario'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
