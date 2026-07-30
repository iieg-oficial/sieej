import { useEffect, useState } from 'react';

const ENTRA = 2;
const SALE = -4;

const useOverflow = (ref, value, axis = 'x') => {
    const [desbordado, setDesbordado] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;

        const medir = () => setDesbordado((previo) => {
            const exceso = axis === 'y'
                ? el.scrollHeight - el.clientHeight
                : el.scrollWidth - el.clientWidth;
            return previo ? exceso > SALE : exceso > ENTRA;
        });

        medir();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(medir);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, value, axis]);

    return desbordado;
};

export default useOverflow;
