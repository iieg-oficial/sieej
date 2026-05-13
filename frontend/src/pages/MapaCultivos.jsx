import { useEffect } from 'react';


const API_KEY = 'mk_pub_kRrt--DdlbJCIsKchwZGJK6fzchJ6j2odYd5YH0rPVQ';
const WIDGET_SRC = '/mapalab/widget/v1/mapalab.js';
const MAPALAB_BASE_URL = '/mapalab';


const EJEMPLOS = [
    {
        titulo: 'Ejemplo 1 — Una sola capa: clasificador de cultivos',
        descripcion: 'Muestra la clasificación de cultivos del IIEG en Jalisco (agave, maíz, caña, aguacate, plátano, mango, cítricos y otros).',
        layers: 'economia:cultivos',
        height: 500,
    },
    {
        titulo: 'Ejemplo 2 — Múltiples capas: indicadores sociales',
        descripcion: 'Combina rezago educativo, carencia por acceso a servicios de salud y límites municipales para visualizar desigualdades territoriales.',
        layers: 'general:limite_municipal,desarrollo:rezago_educativo,desarrollo:carencia_acceso_servicios_salud',
        height: 500,
    },
    {
        titulo: 'Ejemplo 3 — Share precompilado (hash): combinación lista para embeber',
        descripcion: 'En lugar de listar capas y filtros uno por uno, el usuario puede compartir un mapa desde el visor full (botón "Compartir") y obtener un hash corto. El widget acepta ese hash con el atributo "share" y recrea exactamente el mismo estado: capas, opacidades, filtros CQL, vista y simbología.',
        share: '4bs4bk4bg4',
        height: 500,
    },
];


const MapaCultivos = () => {
    useEffect(() => {
        if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) return;
        const script = document.createElement('script');
        script.src = WIDGET_SRC;
        script.defer = true;
        document.head.appendChild(script);
    }, []);

    return (
        <div className="min-h-dvh bg-gray-50 px-4 py-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Mapas embebidos del IIEG
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Demostración del Web Component <code className="bg-gray-200 px-1 rounded">{`<iieg-mapalab>`}</code> que permite embeber el visor MapaLab en cualquier sitio con una API key.
                    </p>
                </header>

                {EJEMPLOS.map((e) => {
                    const id = e.share || e.layers;
                    const snippetAttr = e.share
                        ? `    share="${e.share}"`
                        : `    layers="${e.layers}"`;
                    return (
                        <section key={id} className="mb-10">
                            <h2 className="text-lg font-medium text-gray-800 mb-1">{e.titulo}</h2>
                            <p className="text-sm text-gray-600 mb-3">{e.descripcion}</p>
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <iieg-mapalab
                                    api-key={API_KEY}
                                    {...(e.share ? { share: e.share } : { layers: e.layers })}
                                    base-url={MAPALAB_BASE_URL}
                                    height={String(e.height)}
                                    title={e.titulo}
                                />
                            </div>
                            <details className="mt-2 text-xs text-gray-500">
                                <summary className="cursor-pointer">Ver snippet</summary>
                                <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">{`<script src="https://iieg.gob.mx/mapalab/widget/v1/mapalab.js" defer></script>

<iieg-mapalab
    api-key="${API_KEY.slice(0, 12)}…"
${snippetAttr}
    height="${e.height}">
</iieg-mapalab>`}</pre>
                            </details>
                        </section>
                    );
                })}

                <footer className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500">
                    <p>
                        Fuente: IIEG. Las API keys se administran desde el panel admin en{' '}
                        <code className="bg-gray-200 px-1 rounded">/administrador/mapalab/api-keys</code>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default MapaCultivos;
