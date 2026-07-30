import { useCallback } from 'react';
import { useWatch } from 'react-hook-form';

const tieneValor = (value) => {
    if (value === null || value === undefined || value === '' || value === false) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.values(value).some(tieneValor);
    return true;
};

const useFieldClear = ({ methods, name, empty = '', onClear }) => {
    const value = useWatch({ control: methods.control, name });

    const clear = useCallback(() => {
        methods.setValue(name, empty, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
        onClear?.();
    }, [methods, name, empty, onClear]);

    return { hasValue: tieneValor(value), clear };
};

export default useFieldClear;
