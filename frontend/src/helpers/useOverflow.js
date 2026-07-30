import { useEffect, useState } from 'react';

const useOverflow = (ref, value, axis = 'x') => {
    const [desbordado, setDesbordado] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const medir = () => setDesbordado(axis === 'y'
            ? el.scrollHeight > el.clientHeight + 1
            : el.scrollWidth > el.clientWidth + 1);

        medir();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(medir);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, value, axis]);

    return desbordado;
};

export default useOverflow;
