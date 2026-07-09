import React from 'react';
import leftIcon from '@icons/ico_left_arrow.svg';
import rigthIcon from '@icons/ico_rigth_arrow.svg';
import rigthDarkIcon from '@icons/ico_rigth_arrow_dark.svg';
import saveIcon from '@icons/ico_guardar_avance.svg';
import Typography from '@components/Typography';
import Button from '@components/Button';

const NavigateStep = ({
    step, isFirst, isLast, isLastTab, isMobile = false,
    nextDisabled = false, nextTooltip = null, saveDisabled = false,
    onPrev, onSubmit, onSave,
}) => {
    const nextLabel = isLast ? 'Confirmar y enviar' : (isLastTab ? 'Siguiente sección' : 'Siguiente');
    const nextIcon = nextDisabled ? rigthDarkIcon : rigthIcon;
    return (
        <div
            className="
                sticky flex flex-col space-y-4 w-full py-4 top-0 bg-white z-9
                md:pt-10 md:pb-5 md:flex-row md:justify-between md:items-center
            "
        >
            <Typography as="h2" titleName={step?.title || ''} icon={!isMobile && step?.icon} />
            <div className="flex flex-row items-center justify-end space-x-3 md:space-x-4">
                <Button
                    label={isMobile ? undefined : 'Anterior'}
                    variant="secondary"
                    onClick={async () => {
                        if (onSave) await onSave(true);
                        onPrev?.();
                    }}
                    icon={isMobile ? undefined : leftIcon}
                    iconButton={isMobile ? leftIcon : undefined}
                    tooltip={isMobile ? 'Anterior' : null}
                    colSpan={isFirst ? 0 : undefined}
                    center
                />
                <Button
                    label={isMobile ? undefined : nextLabel}
                    variant="primary"
                    onClick={onSubmit}
                    disabled={nextDisabled}
                    tooltip={nextDisabled ? nextTooltip : (isMobile ? nextLabel : null)}
                    sufIcon={isMobile ? undefined : nextIcon}
                    iconButton={isMobile ? nextIcon : undefined}
                    center
                />
                <Button
                    variant="primary"
                    onClick={() => onSave?.()}
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
