export const CLAVE_ETIQUETA = '__etiqueta';

export const renderItemLabel = (template, index) => {
    if (!template) return `Item ${index + 1}`;
    return template.replace('{{index}}', String(index + 1));
};

export const buildRepeaterItems = (step, list) => (Array.isArray(list) ? list : [])
    .map((item, idx) => ({
        ...item,
        id: `${step.id}-${idx}`,
        label: item?.[CLAVE_ETIQUETA] || item?.nombre_bd || item?.nombres || item?.nombre
            || renderItemLabel(step.itemLabel, idx),
        etiquetaBase: renderItemLabel(step.itemLabel, idx),
    }));

export const resolverTabDeCampo = (field, tabs) => {
    if (!Array.isArray(tabs) || tabs.length === 0) return undefined;
    return tabs.some((t) => t.id === field?.tab) ? field.tab : tabs[0]?.id;
};
