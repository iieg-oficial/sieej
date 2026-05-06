import { useContext } from 'react';
import { FormsContext } from './FormsContext';

const useForms = () => {
    const ctx = useContext(FormsContext);
    if (!ctx) throw new Error('useForms debe usarse dentro de FormsProvider');
    return ctx;
};

export default useForms;
