import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import useAuth from '@context/useAuth';
import {
    getEnvio,
    getFormularioDetalle,
    putEnvio,
    uploadArchivo,
    actualizarVersionEnvio,
} from '@services/formulariosServices';

export const SubmissionContext = createContext(null);

export const SubmissionProvider = ({ slug, children }) => {
    const { onFetch } = useAuth();
    const [definicion, setDefinicion] = useState(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [envio, setEnvio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const cambiosVistosRef = useRef([]);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const detalle = await getFormularioDetalle(onFetch, slug);
            setDefinicion(detalle.definicion);
            setNombre(detalle.nombre || '');
            setDescripcion(detalle.descripcion || '');
            let e = detalle.envio ?? await getEnvio(onFetch, slug);
            if (e?.actualizacion_disponible) {
                e = await actualizarVersionEnvio(onFetch, slug).catch(() => e);
            }
            setEnvio(e);
            cambiosVistosRef.current = [];
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [onFetch, slug]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const guardar = useCallback(async (datos, pasoActual) => {
        setSaving(true);
        try {
            const vistos = cambiosVistosRef.current;
            cambiosVistosRef.current = [];
            const e = await putEnvio(onFetch, slug, {
                datos,
                paso_actual: pasoActual ?? 0,
                enviar: false,
                cambios_vistos: vistos,
            });
            if (e?.actualizacion_disponible) {
                await actualizarVersionEnvio(onFetch, slug).catch(() => null);
                await cargar();
                return e;
            }
            setEnvio(e);
            return e;
        } finally {
            setSaving(false);
        }
    }, [onFetch, slug, cargar]);

    const enviar = useCallback(async (datos) => {
        setSaving(true);
        try {
            const lastStep = (definicion?.steps?.length ?? 1) - 1;
            const vistos = cambiosVistosRef.current;
            cambiosVistosRef.current = [];
            const e = await putEnvio(onFetch, slug, {
                datos,
                paso_actual: lastStep,
                enviar: true,
                cambios_vistos: vistos,
            });
            setEnvio(e);
            return e;
        } finally {
            setSaving(false);
        }
    }, [onFetch, slug, definicion]);

    const subirArchivo = useCallback(async (fieldPath, file) => {
        return uploadArchivo(onFetch, slug, fieldPath, file);
    }, [onFetch, slug]);

    const marcarVisto = useCallback((key) => {
        cambiosVistosRef.current = [...cambiosVistosRef.current, key];
    }, []);

    return (
        <SubmissionContext.Provider value={{
            definicion, nombre, descripcion, envio, loading, error, saving,
            guardar, enviar, subirArchivo, recargar: cargar,
            marcarVisto,
        }}>
            {children}
        </SubmissionContext.Provider>
    );
};
