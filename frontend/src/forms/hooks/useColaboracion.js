import { useCallback, useEffect, useRef, useState } from 'react';
import {
    aNombreRHF,
    aplanarDatos,
    camposCambiados,
    pathsDeArchivo,
} from '@helpers/fieldPath';

const RETRASO_MS = 1500;
const CADENCIA_ACOMPANADO_MS = 10000;
const CADENCIA_SOLO_MS = 30000;
const JITTER_MS = 2000;

const mismoValor = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const useColaboracion = (methods, {
    activo, definicion, capturar, sincronizar, seccion, onError,
}) => {
    const [presentes, setPresentes] = useState([]);
    const enviadosRef = useRef(null);
    const timerRef = useRef(null);
    const enVueloRef = useRef(false);
    const archivosRef = useRef(new Set());
    const seccionRef = useRef(seccion);

    useEffect(() => { seccionRef.current = seccion; }, [seccion]);
    useEffect(() => { archivosRef.current = pathsDeArchivo(definicion); }, [definicion]);

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

    const aplicarDelta = useCallback((cambios) => {
        if (!methods || !cambios?.length) return;
        const enfocado = document.activeElement?.name;
        cambios.forEach(({ field_path: path, valor_nuevo: valor }) => {
            const nombre = aNombreRHF(path);
            if (nombre === enfocado) return;
            if (!mismoValor(methods.getValues(nombre), enviadosRef.current?.[path])) return;
            methods.setValue(nombre, valor, { shouldDirty: false });
            enviadosRef.current = { ...(enviadosRef.current ?? {}), [path]: valor };
        });
    }, [methods]);

    useEffect(() => {
        if (!activo || !sincronizar) return undefined;
        let vivo = true;
        let solo = true;
        let timer = null;

        const programar = () => {
            if (!vivo) return;
            const base = solo ? CADENCIA_SOLO_MS : CADENCIA_ACOMPANADO_MS;
            timer = setTimeout(latir, base + Math.random() * JITTER_MS);
        };

        const latir = async () => {
            if (!vivo) return;
            if (document.hidden) { programar(); return; }
            try {
                const r = await sincronizar(seccionRef.current);
                if (!vivo) return;
                aplicarDelta(r?.cambios);
                setPresentes(r?.presentes ?? []);
                solo = (r?.presentes ?? []).length === 0;
            } catch {
                /* la presencia es un aviso: un latido perdido no interrumpe la captura */
            }
            programar();
        };

        const alVolver = () => {
            if (document.hidden) return;
            clearTimeout(timer);
            latir();
        };

        latir();
        document.addEventListener('visibilitychange', alVolver);
        return () => {
            vivo = false;
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', alVolver);
        };
    }, [activo, sincronizar, aplicarDelta]);

    useEffect(() => {
        if (!activo || !sincronizar) return undefined;
        const despedirse = () => {
            sincronizar(seccionRef.current, { salir: true, keepalive: true })
                .catch(() => null);
        };
        window.addEventListener('pagehide', despedirse);
        return () => window.removeEventListener('pagehide', despedirse);
    }, [activo, sincronizar]);

    return { presentes };
};

export default useColaboracion;
