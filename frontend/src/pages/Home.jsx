import React, {  } from 'react';
import useGlobal from '../context/useGlobal';
import GeneralInformation from '../components/GeneralStep';
import LinksInformation from '../components/LinksStep';
import DatabaseInformation from '../components/DataBaseStep';
import ListDatabase from '../components/ListDatabaseStep';
import ResumeStep from '../components/ResumeStep.jsx';
import StepIndicator from '../components/StepIndicator';
import Typography from '../components/Typography';
import Modal from '../components/Modal';

const Home = () => {
    const { currentStep } = useGlobal();

    return (
        <React.Fragment>
            <div className="flex space-x-2 md:space-x-5">  
                <div className="hidden xl:block w-[513px] rounded-[20px] bg-white p-7 sx:hidden lg:w-[670px] lg:p-10">
                    <div className="flex flex-col space-y-4 items-start justify-start sticky top-10">
                        <Typography 
                            as="h1" 
                            titleName="Registro de enlaces para el Sistema de Información Estratégica del Estado de Jalisco" 
                        />
                        <Typography 
                            as="h3" 
                            className="text-[#191919] font-garetregular" 
                            titleName="Te invitamos a completar los siguientes pasos para el levantamiento de información acerca de tus bases de datos" 
                        />
                        
                        <StepIndicator />
                    </div>  
                </div>
                <div
                    className="
                        w-full flex flex-col items-start justify-start rounded-[20px] 
                        bg-white shadow-xl-[#03222708] px-2 pb-2 md:px-10 md:pb-10 text-black
                    "
                >
                    {currentStep === 0 && <GeneralInformation />}
                    {currentStep === 1 && <LinksInformation />}
                    {currentStep === 2 && <ListDatabase />}
                    {currentStep === 3 && <DatabaseInformation />}
                    {currentStep === 4 && <ResumeStep />}
                </div>  
            </div>
            <Modal />
        </React.Fragment>
    )
}

export default Home;