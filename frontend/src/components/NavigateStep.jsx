import React from 'react';
import { useGlobal } from '../context/GlobalContext';
import leftIcon from '../assets/icons/ico_left_arrow.svg';
import rigthIcon from '../assets/icons/ico_rigth_arrow.svg';
import saveIcon from '../assets/icons/ico_guardar_avance.svg';
import Typography from './Typography';  
import Button from './Button';

const NavigateStep = ({ onSubmit, onSave }) => {
    const { currentStep, steps, onPrev, isLast, isFirst, isLastTab, isMobile } = useGlobal();

    return (
        <div 
            className="
                sticky flex flex-col space-y-4 w-full py-4 top-0 bg-white z-9
                md:pt-10 md:pb-5 md:flex-row md:justify-between md:items-center
            "
        >
            <Typography as="h2" titleName={steps[currentStep].title} icon={!isMobile && steps[currentStep].icon}/>
            <div className="flex flex-col space-y-2 md:flex-row md:space-x-4">
                <Button 
                    label="Anterior" 
                    variant="secondary" 
                    onClick={async () => { 
                        onSave && await onSave(true);
                        onPrev();
                    }}
                    icon={leftIcon}
                    colSpan={isFirst && 0}
                    center
                />
                <Button 
                    label={isLast ? 'Confirmar y enviar' : (isLastTab ? 'Siguiente sección' : 'Siguiente')}
                    variant="primary" 
                    onClick={onSubmit}
                    sufIcon={rigthIcon}
                    center
                />
                <Button 
                    variant="primary" 
                    onClick={onSave && onSave}
                    tooltip="Guardar avance"
                    iconButton={saveIcon}
                    colSpan={isLast && 0}
                    center
                />
            </div>
        </div>
    );
};

export default NavigateStep;