export const renderItemLabel = (template, index) => {
    if (!template) return `Item ${index + 1}`;
    return template.replace('{{index}}', String(index + 1));
};

export const buildRepeaterItems = (step, list) => (Array.isArray(list) ? list : [])
    .map((item, idx) => ({
        ...item,
        id: `${step.id}-${idx}`,
        label: item?.nombre_bd || item?.nombres || item?.nombre || renderItemLabel(step.itemLabel, idx),
    }));
