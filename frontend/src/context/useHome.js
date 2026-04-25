import { useContext } from 'react';
import { HomeContext } from './HomeContext';

const useHome = () => {
    const context = useContext(HomeContext);
    if (!context) {
        throw new Error('useHome debe usarse dentro de un HomeProvider');
    }
    return context;
};

export default useHome;
