import { useLocation } from 'react-router';
import useAuth from '@context/useAuth';

const SOURCE_APP = import.meta.env.VITE_COLIBRI_SOURCE_APP || 'sieej';
const API_KEY = import.meta.env.VITE_COLIBRI_API_KEY || '';

if (typeof window !== 'undefined' && import.meta.env.DEV && !API_KEY) {
    console.warn('[colibri] VITE_COLIBRI_API_KEY no esta seteada — ver .env');
}


const buildContext = ({ pathname, user }) => ({
    auto: {
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        lang: typeof navigator !== 'undefined' ? navigator.language : null,
        timestamp: new Date().toISOString(),
        viewport: typeof window !== 'undefined' ? {
            width: window.innerWidth,
            height: window.innerHeight,
            dpr: window.devicePixelRatio ?? 1,
        } : null,
    },
    user: user ? {
        id: user.id,
        email: user.email,
        name: user.nombre || user.name,
        role: user.role,
    } : null,
    custom: { sourceRoute: pathname },
});


const ColibriReportButton = ({ label = 'Reportar problema o sugerencia' }) => {
    const location = useLocation();
    const { user } = useAuth();

    const handleClick = () => {
        if (typeof window === 'undefined') return;
        if (!window.colibri || typeof window.colibri.openPanel !== 'function') {
            console.warn('Colibri widget no esta cargado');
            return;
        }
        const ctx = buildContext({ pathname: location.pathname, user });
        window.colibri.clearContext?.();
        if (ctx.user) window.colibri.identify?.(ctx.user);
        if (ctx.auto) window.colibri.setContext?.('auto', ctx.auto);
        if (ctx.custom) {
            for (const [k, v] of Object.entries(ctx.custom)) {
                window.colibri.setContext?.(k, v);
            }
        }
        window.colibri.openPanel({ sourceApp: SOURCE_APP, apiKey: API_KEY });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={label}
            title={label}
            style={{ padding: 0, border: 0 }}
            className="fixed bottom-4 right-4 z-50 w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center text-[#6E7477] hover:text-[#8936AB] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] transition-colors"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 md:w-3 md:h-3"
                aria-hidden="true"
            >
                <path d="M16 7h.01" />
                <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
                <path d="m20 7 2 .5-2 .5" />
                <path d="M10 18v3" />
                <path d="M14 17.75V21" />
                <path d="M7 18a6 6 0 0 0 3.84-10.61" />
            </svg>
        </button>
    );
};

export default ColibriReportButton;
