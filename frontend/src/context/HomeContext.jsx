import React, { createContext, useContext, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useGlobal } from './GlobalContext';
import { useAuth } from './AuthContext';
import defaultDatabase from '../helpers/initDatabase';
import objectsToStrings from '../helpers/objectsToStrings';
import cleanObject from '../helpers/cleanObject';
import stringToBoolean from '../helpers/stringToBoolean';
import booleanToString from '../helpers/booleanToString';
import { pushAnalyticsEvent } from '../helpers/analytics';

const NAME_TABLE_DB = 'informacion_basesdatos';

const HomeContext = createContext();

const HomeProvider = ({ children }) => {
    const { hostBackend, openModal, closeModal, onPrev, onActiveTab } = useGlobal();
    const [ formData, setFormData ] = useState({});
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState(null);
    const { onFetch } = useAuth();

    const formAnalyticsEvent = (action, label) => {
        pushAnalyticsEvent('Formulario', action, label);
    };

    const methodsDatabase = useForm({
        defaultValues: { [NAME_TABLE_DB]: [defaultDatabase] }
    });
    const { control } = methodsDatabase;
    const { fields: fieldsDatabase, remove, append: appendDatabase } = useFieldArray({
        keyName: '_id', control, name: NAME_TABLE_DB
    });

    const handleUpdateFormData = (data) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const onRemoveDatabase = async (database, index, isLabel) => {
        try {
            database?.id && await handleDeleteDatabase(database?.id);
            const updatedDatabases = formData[NAME_TABLE_DB]?.filter((_, i) => i !== index) || [];
            handleUpdateFormData({ [NAME_TABLE_DB]: updatedDatabases });
            remove(index);
            closeModal();
            isLabel && onActiveTab(0);
            isLabel && (fieldsDatabase.length === 1) && onPrev();
        } catch (err) {
            setError(err.message || 'Problemas con remover la información de base de datos.');
            openModal(
                'error',
                null,
                err.message || 'Problemas con remover la información de base de datos.',
                [{
                    label: 'Cerrar',
                    variant: 'secondary',
                    onClick: () => closeModal()
                }]
            );
            throw err;
        }
    };

    const fetchData = async (url, options) => {
        setLoading(true);
        setError(null);
        try {
            const response = await onFetch(url, options);
            const text = await response.text();
            const result = text ? JSON.parse(text) : null;
            if (!response.ok) {
                const detail = typeof result?.detail === 'string' ? result.detail : `HTTP ${response.status}`;
                throw new Error(detail);
            }
            return result;
        } catch (err) {
            setError(err.message || 'Ocurrió un error inesperado.');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Información general
    const handlePostGeneral = async (data) =>
        fetchData(`${hostBackend}/formularios/general`, { method: 'POST', body: data });

    const handlePutGeneral = async (data, id) => {
        let cleanData = cleanObject(data);
        cleanData = stringToBoolean(cleanData);
        const result = await fetchData(`${hostBackend}/formularios/general/${id}`, {
            method: 'PUT', body: cleanData,
        });
        return result?.id ? booleanToString(result) : undefined;
    };

    const handleGetGeneral = async () => {
        try {
            const result = await fetchData(`${hostBackend}/formularios/general`, { method: 'GET' });
            return result?.id ? booleanToString(result) : undefined;
        } catch (err) {
            // 404 = sin registro previo
            if (err.message?.includes('404')) return undefined;
            throw err;
        }
    };

    // Enlaces
    const handlePostLink = async (data) =>
        fetchData(`${hostBackend}/formularios/enlaces`, { method: 'POST', body: data });

    const handlePutLink = async (data, id = 1) =>
        fetchData(`${hostBackend}/formularios/enlaces/${id}`, { method: 'PUT', body: data });

    const handleDeleteLink = async (id) =>
        fetchData(`${hostBackend}/formularios/enlaces/${id}`, { method: 'DELETE' });

    const handleGetLink = async () =>
        fetchData(`${hostBackend}/formularios/enlaces`, { method: 'GET' });

    // Bases de datos
    const handlePostDatabase = async (data) =>
        fetchData(`${hostBackend}/formularios/bases-datos`, { method: 'POST', body: data });

    const handlePutDatabase = async (data, id) => {
        try {
            let cleanData = cleanObject(data);
            cleanData = stringToBoolean(cleanData);
            let result = await fetchData(`${hostBackend}/formularios/bases-datos/${id}`, {
                method: 'PUT', body: cleanData,
            });
            result = booleanToString(result);
            result.ejes_estrategicos = objectsToStrings(result?.ejes_estrategicos);
            return result;
        } catch (err) {
            setError(err.message || 'Error al actualizar la base de datos.');
            throw new Error(err.message || 'Error al actualizar la base de datos.');
        }
    };

    const handlePostFile = async (files, id) => {
        const file = files[0];
        if (!file) {
            console.error('No se seleccionó ningún archivo.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        const result = await fetchData(`${hostBackend}/formularios/bases-datos/${id}/diccionario`, {
            method: 'POST', body: formData,
        });
        if (!result?.detail) formAnalyticsEvent('Subir base de datos', 'Se subió base de datos como archivo.');
        return result;
    };

    const handleDeleteDatabase = async (id) => {
        const result = await fetchData(`${hostBackend}/formularios/bases-datos/${id}`, {
            method: 'DELETE'
        });
        if (!result?.detail) formAnalyticsEvent('Eliminar base de datos', `Eliminar base de datos con id: ${id}`);
        return result;
    };

    const handleGetDatabase = async (id = null) => {
        const url = id
            ? `${hostBackend}/formularios/bases-datos/${id}`
            : `${hostBackend}/formularios/bases-datos`;
        const results = await fetchData(url, { method: 'GET' });

        if (id) {
            const transform = booleanToString(results);
            transform.ejes_estrategicos = objectsToStrings(transform?.ejes_estrategicos);
            return transform;
        }

        const transformToString = (results || []).map((row) => {
            const transform = booleanToString(row);
            transform.ejes_estrategicos = objectsToStrings(transform?.ejes_estrategicos);
            return transform;
        });

        return transformToString.slice().sort((a, b) => a.id - b.id);
    };

    const value = {
        formData, error, homeLoading: loading,
        methodsDatabase, nameTableDatabase: NAME_TABLE_DB,
        onRemoveDatabase, fieldsDatabase, appendDatabase,
        onUpdateForm: handleUpdateFormData,
        onGeneral: handlePostGeneral,
        onPutGeneral: handlePutGeneral,
        onFetchGeneral: handleGetGeneral,
        onLink: handlePostLink,
        onPutLink: handlePutLink,
        onDeleteLink: handleDeleteLink,
        onFetchLink: handleGetLink,
        onDatabase: handlePostDatabase,
        onPutDatabase: handlePutDatabase,
        onDeleteDatabase: handleDeleteDatabase,
        onFetchDatabase: handleGetDatabase,
        onFile: handlePostFile,
        onAnalytics: formAnalyticsEvent,
    };

    return (
        <HomeContext.Provider value={value}>
            {children}
        </HomeContext.Provider>
    );
};

HomeContext.displayName = 'HomeContext';

const useHome = () => {
    const context = useContext(HomeContext);
    if (!context) {
        throw new Error('useHome debe usarse dentro de un HomeContext');
    }
    return context;
};

export { HomeProvider, useHome };
