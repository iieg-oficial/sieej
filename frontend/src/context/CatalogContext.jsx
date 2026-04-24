import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useGlobal } from './GlobalContext';

const CatalogContext = createContext();

const yesOrNot = [
    { label: 'Sí', value: true },
    { label: 'No', value: false }
];

const toOptions = (items = []) =>
    items.map((item) => ({ label: item.value, value: item.value }));

const CatalogProvider = ({ children }) => {
    const { hostBackend } = useGlobal();
    const { isAuthenticated, onFetch } = useAuth();
    const [catalogs, setCatalogs] = useState({
        unidadesAdministrativas: [],
        informationCategories: [],
        jaliscoAreas: [],
        periodicity: [],
        managementSystem: [],
        verificationMethods: [],
        generationSources: [],
        usesInformation: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const response = await onFetch(`${hostBackend}/formularios/catalogos`, { method: 'GET' });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (cancelled) return;

                setCatalogs({
                    unidadesAdministrativas: toOptions(data.unidades_admin),
                    informationCategories: toOptions(data.categoria_datos),
                    jaliscoAreas: toOptions(data.ejes_estrategicos),
                    periodicity: toOptions(data.periodicidad),
                    managementSystem: toOptions(data.herramientas_gestion),
                    verificationMethods: toOptions(data.calidad_datos),
                    generationSources: toOptions(data.usuarios_datos),
                    usesInformation: toOptions(data.objetivo_uso),
                });
            } catch (err) {
                if (!cancelled) setError(err.message || 'Error al cargar catálogos');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isAuthenticated, hostBackend, onFetch]);

    const value = {
        ...catalogs,
        yesOrNot,
        catalogsLoading: loading,
        catalogsError: error,
    };

    return (
        <CatalogContext.Provider value={value}>
            {children}
        </CatalogContext.Provider>
    );
};

CatalogContext.displayName = 'CatalogContext';

const useCatalog = () => {
    const context = useContext(CatalogContext);
    if (!context) {
        throw new Error('useCatalog debe usarse dentro de un CatalogContext');
    }
    return context;
};

export { CatalogProvider, useCatalog };
