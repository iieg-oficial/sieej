const formatText = (value, label, clean) => {
    if (typeof value === 'boolean') return value ? 'Si' : 'No';
    if (value === 'true') return 'Si';
    if (value === 'false') return 'No';
    if (!value && label && (label.startsWith('Descripcion') || label.startsWith('Descripción'))) {
        const parts = label.split(' ')[1] === "del" ? label.split(' del ') : label.split(' de ');
        return `Sin ${parts.length > 1 ? parts[1].trim() : ''}`;
    }
    return value || (clean ? '' : 'Sin datos');
};

export default formatText;