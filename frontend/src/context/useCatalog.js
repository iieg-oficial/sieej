import { useContext } from 'react';
import { CatalogContext } from './CatalogContext';

const useCatalog = () => {
    const context = useContext(CatalogContext);
    if (!context) {
        throw new Error('useCatalog debe usarse dentro de un CatalogProvider');
    }
    return context;
};

export default useCatalog;
