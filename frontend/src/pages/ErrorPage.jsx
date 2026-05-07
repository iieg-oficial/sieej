import { useRouteError, Link } from 'react-router';
import errorImg from '@assets/svg/404.svg';

const ErrorPage = ({ title: titleProp, description, error: errorProp, resetError }) => {
    const routeError = useRouteError();
    const error = errorProp ?? routeError;

    if (error) {
        console.error('Error capturado:', error);
    }

    const is404 = !titleProp && error?.status === 404;

    const title = titleProp ?? (is404
        ? 'No encontramos la página\nque estás buscando...'
        : 'Algo salió mal...');

    const handleReload = () => {
        if (resetError) resetError();
        window.location.reload();
    };

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen text-center px-4"
            style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F0FA 100%)' }}
        >
            <img src={errorImg} alt="Error" className="w-64 md:w-80 mb-8" />
            <h1 className="font-garetbold text-[28px]/[40px] md:text-[40px]/[56px] text-[#5C2472] tracking-[0px] mb-4 whitespace-pre-line">
                {title}
            </h1>
            {description && (
                <p className="font-garetregular text-[16px]/[24px] md:text-[18px]/[28px] text-[#5C2472] max-w-xl mb-4 whitespace-pre-line">
                    {description}
                </p>
            )}
            {error?.message && !is404 && (
                <p className="font-garetregular text-[12px] text-[#7B5588] max-w-xl mb-4 italic">
                    {error.message}
                </p>
            )}
            <div className="flex flex-col w-full md:w-auto md:flex-row gap-4 mt-4">
                <Link
                    to="/"
                    className="px-10 py-3 bg-[#703089] text-white rounded-[30px] hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234] transition font-garetbold text-[14px]"
                    onClick={resetError}
                >
                    Regresar al inicio
                </Link>
                {!is404 && (
                    <button
                        onClick={handleReload}
                        className="px-10 py-3 border border-[#703089] text-[#703089] rounded-[30px] hover:bg-[#703089] hover:text-white transition font-garetbold text-[14px]"
                    >
                        Recargar página
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorPage;
