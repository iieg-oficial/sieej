import React from 'react';
import leftIcon from '@icons/ico_left_arrow.svg';
import rigthIcon from '@icons/ico_rigth_arrow.svg';
import saveIcon from '@icons/ico_guardar_avance.svg';
import Typography from '@components/Typography';
import Button from '@components/Button';

const NavigateStep = ({
    step, isFirst, isLast, isLastTab, isMobile = false,
    nextDisabled = false, nextTooltip = null, saveDisabled = false,
    onPrev, onSubmit, onSave,
}) => {
    return (
        <div
            className="
                sticky flex flex-col space-y-4 w-full py-4 top-0 bg-white z-9
                md:pt-10 md:pb-5 md:flex-row md:justify-between md:items-center
            "
        >
            <Typography as="h2" titleName={step?.title || ''} icon={!isMobile && step?.icon} />
            <div className="flex flex-col space-y-2 md:flex-row md:space-x-4">
                <Button
                    label="Anterior"
                    variant="secondary"
                    onClick={async () => {
                        if (onSave) await onSave(true);
                        onPrev?.();
                    }}
                    icon={leftIcon}
                    colSpan={isFirst ? 0 : undefined}
                    center
                />
                <Button
                    label={isLast ? 'Confirmar y enviar' : (isLastTab ? 'Siguiente sección' : 'Siguiente')}
                    variant="primary"
                    onClick={onSubmit}
                    disabled={nextDisabled}
                    tooltip={nextDisabled ? nextTooltip : null}
                    sufIcon={rigthIcon}
                    center
                />
                <Button
                    variant="primary"
                    onClick={onSave}
                    disabled={saveDisabled}
                    tooltip={saveDisabled ? 'Sin cambios por guardar' : 'Guardar avance'}
                    iconButton={saveIcon}
                    colSpan={isLast ? 0 : undefined}
                    center
                />
            </div>
        </div>
    );
};

export default NavigateStep;
