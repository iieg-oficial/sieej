import { useContext } from 'react';
import { CatalogosContext } from './CatalogosContext';

const useCatalogos = () => {
    const ctx = useContext(CatalogosContext);
    if (!ctx) throw new Error('useCatalogos debe usarse dentro de CatalogosProvider');
    return ctx;
};

export default useCatalogos;
