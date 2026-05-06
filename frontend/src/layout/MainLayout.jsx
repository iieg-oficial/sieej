import { useEffect, useCallback, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import useGlobal from '../context/useGlobal';
import useAuth from '../context/useAuth';
import useUser from '../context/useUser';
import iconMenu from '../assets/icons/arrow_contorno.svg';
import logoSIEEJ from '../assets/svg/logo_sieej_header.svg';
import logoIIEG from '../assets/svg/logo_iieg_header.svg';
import logoJal from '../assets/svg/logo_jal_header.svg';
import Loading from '../components/Loading';
import Button from '../components/Button';
import EnvBadge from '../components/EnvBadge';
import IncompleteBadge from '../components/IncompleteBadge';
import ClosePage from '../pages/ClosePage';
import { FormsProvider } from '../forms/context/FormsContext';
import useForms from '../forms/context/useForms';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { onLogout } = useAuth();
    const { userForms, onUser, userIsLoading } = useUser();
    const { formularios } = useForms();
    const [ menuOpen, setMenuOpen ] = useState(false);
    const dropdownRef = useRef(null);

    const incompleteCount = (formularios || []).filter(
        (f) => f.estado_envio === 'en_proceso'
    ).length;
    const isOnList = location.pathname === '/';

    const initial = (userForms?.nombre?.charAt(0)?.toUpperCase() || 'A') + (userForms?.apellido?.charAt(0)?.toUpperCase() || 'A');

    const handleMenuToggle = () => {
        setMenuOpen(!menuOpen);
    };

    const handleClickOutside = useCallback((event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setMenuOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    useEffect(() => {
        onUser();
    }, [onUser]);

    return (
        <header 
            ref={dropdownRef}
            className="
                bg-[#5C2472] justify-between items-center md:rounded-[10px]
                flex p-4 lg:pl-13 lg:py-4 w-sceen h-[100px] md:m-5
            "
        >
            <div className="flex items-center justify-center md:gap-4 lg:gap-18">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="relative h-11 p-0 m-0 border-0 bg-transparent cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded"
                    aria-label="Ir al inicio"
                    title="Ir al inicio"
                >
                    <img src={logoSIEEJ} alt="Logo SIEEJM header" className="h-11 block" />
                    <EnvBadge />
                </button>
                <img src={logoIIEG} alt="Logo IIEG" className="h-11 hidden lg:block" />
                <img src={logoJal} alt="Logo Jalisco" className="h-11 hidden lg:block" />
            </div>
            <div className="flex items-center gap-3">
                <div className="text-[#C39AD3] text-[14px] text-right font-bold leading-none hidden md:block">
                    {userForms?.nombre} {userForms?.apellido}<br />
                    <span className="opacity-75 text-[10px]">{userForms?.email}</span>
                </div>
                <div className="relative flex items-center gap-2">
                    <div
                        onClick={handleMenuToggle}
                        className="relative rounded-full bg-emerald-200 flex items-center justify-center cursor-pointer p-2"
                    >
                        <span className="text-emerald-700 text-2xl font-garetbold">
                            {userIsLoading ? <Loading /> : initial}
                        </span>
                        <IncompleteBadge count={incompleteCount} corner="bottom-right" />
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleMenuToggle}
                        tooltip="Menú de usuario"
                        iconButton={iconMenu}
                        className='hidden md:block'
                        center
                    />
                    {menuOpen && (
                        <div
                            className="
                                absolute top-full right-0 mt-2 w-56 bg-white shadow-lg shadow-[#B6A6BC99] rounded-md
                                text-sm z-50 overflow-hidden
                            "
                        >
                            {!isOnList && (
                                <button
                                    onClick={() => { setMenuOpen(false); navigate('/'); }}
                                    className="
                                        flex flex-col items-start w-full text-left
                                        px-4 py-2 hover:bg-gray-100 text-black border-b border-gray-100
                                    "
                                >
                                    <span>Mis formularios</span>
                                    {incompleteCount > 0 && (
                                        <span className="text-[11px] text-orange-500 font-garetbold mt-0.5">
                                            {incompleteCount} por completar
                                        </span>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={onLogout}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

const Body = () => {
    const { isDisabledEdition } = useGlobal();

    return (
        <main className="overflow-y-scroll w-sceen grow md:mx-5">
            <div className="mx-auto">
                {isDisabledEdition ? <ClosePage/> : <Outlet/>}
            </div>
        </main>
    );
};

const MainLayout = () => {
    const { isDisabledEdition } = useGlobal();

    return (
        <FormsProvider>
            <div className={`
                flex flex-col h-screen overflow-x-hidden bg-white
                ${isDisabledEdition ? 'bg-white' : 'md:bg-[#F4F4F4]'}
            `}>
                <Header />
                <Body />
            </div>
        </FormsProvider>
    );
};

export default MainLayout;