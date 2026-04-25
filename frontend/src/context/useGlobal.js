import { useContext } from 'react';
import { GlobalContext } from './GlobalContext';

const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal debe usarse dentro de un GlobalProvider');
    }
    return context;
};

export default useGlobal;
