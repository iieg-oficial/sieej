import { useCallback, useEffect, useRef } from 'react';
import { aplanarDatos, camposCambiados, pathsDeArchivo } from '@helpers/fieldPath';

const RETRASO_MS = 1500;

const useColaboracion = (methods, { activo, definicion, capturar, onError }) => {
    const enviadosRef = useRef(null);
    const timerRef = useRef(null);
    const enVueloRef = useRef(false);
    const archivosRef = useRef(new Set());

    useEffect(() => {
        archivosRef.current = pathsDeArchivo(definicion);
    }, [definicion]);

    const mandarLote = useCallback(async (valores) => {
        if (enVueloRef.current) return;
        const actuales = aplanarDatos(valores);
        const cambios = camposCambiados(
            enviadosRef.current ?? {}, actuales, archivosRef.current,
        );
        if (!Object.keys(cambios).length) return;
        enVueloRef.current = true;
        try {
            await capturar(cambios);
            enviadosRef.current = { ...(enviadosRef.current ?? {}), ...cambios };
        } catch (e) {
            onError?.(e, cambios);
        } finally {
            enVueloRef.current = false;
        }
    }, [capturar, onError]);

    useEffect(() => {
        if (!activo || !methods) return undefined;
        if (enviadosRef.current === null) {
            enviadosRef.current = aplanarDatos(methods.getValues());
        }
        const sub = methods.watch((valores) => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => { mandarLote(valores); }, RETRASO_MS);
        });
        return () => {
            sub.unsubscribe();
            clearTimeout(timerRef.current);
        };
    }, [activo, methods, mandarLote]);

    const marcarSincronizado = useCallback((campos) => {
        enviadosRef.current = { ...(enviadosRef.current ?? {}), ...campos };
    }, []);

    return { marcarSincronizado };
};

export default useColaboracion;
