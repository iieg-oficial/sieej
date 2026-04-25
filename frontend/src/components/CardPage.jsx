import useGlobal from '../context/useGlobal';
import logoJal from '../assets/svg/logo_jal.svg';
import backgroundJal from '../assets/svg/img_back.svg';

const CardPage = ({ needTerms = true, needLogo = true , className, children }) => {
    const { linkPrivacity, onAnalytics } = useGlobal();
    
    const handleLinkClick = () => {
        onAnalytics('Aviso de privacidad', 'Se direcciona al aviso de privacidad');
    };

    return (
        <div 
            className="h-screen w-screen flex flex-col items-center justify-center bg-cover bg-center" 
            style={{ backgroundImage: `url(${backgroundJal})` }}
        >
            <div className={`${className} w-full max-w-[1088px] p-10 bg-white rounded-2xl shadow-lg`}>
                {children}
            </div>
            <div className="mt-5 md:mt-10 text-center text-white">
                <img src={logoJal} alt="Jalisco" className={`${needLogo ? 'block' : 'hidden'} mx-auto h-[52px]`} />
                <a 
                    href={linkPrivacity}
                    target="_blank" 
                    className={`${needTerms ? 'block' : 'hidden'} underline font-garetbold text-[10px] m-5`}
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                >
                    Aviso de privacidad
                </a>
            </div>
        </div>
    );
};

export default CardPage;