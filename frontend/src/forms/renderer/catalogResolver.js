export const resolveOptions = (field, catalogos) => {
    if (Array.isArray(field.options) && field.options.length > 0) {
        return field.options.map((o) => ({ value: o.value, label: o.label }));
    }
    if (field.catalog && catalogos) {
        const items = catalogos[field.catalog];
        if (Array.isArray(items)) {
            return items.map((it) => {
                if (typeof it === 'string') return { value: it, label: it };
                if (typeof it === 'object' && it !== null) {
                    const value = it.value ?? it.id ?? it.label;
                    const label = it.label ?? it.value ?? String(value);
                    return { value: String(value), label };
                }
                return { value: String(it), label: String(it) };
            });
        }
    }
    return [];
};
