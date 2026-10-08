import React from 'react';
import leftIcon from '@icons/ico_left_arrow.svg';
import rigthIcon from '@icons/ico_rigth_arrow.svg';
import rigthDarkIcon from '@icons/ico_rigth_arrow_dark.svg';
import saveIcon from '@icons/ico_guardar_avance.svg';
import Typography from '@components/Typography';
import Button from '@components/Button';
import useGlobal from '@context/useGlobal';

const NavigateStep = ({
    step, isFirst, isLast, isLastTab, tieneCambios = false,
    nextDisabled = false, nextTooltip = null, saveDisabled = false, saveTooltip = null,
    onPrev, onSubmit, onSave,
}) => {
    const { screenSize } = useGlobal();
    const isSmall = screenSize.sm;
    const isFull = screenSize.xxl;

    const nextIcon = nextDisabled ? rigthDarkIcon : rigthIcon;
    const prevLabel = isFull ? 'Anterior sección' : 'Anterior';
    const nextLabel = isLast
        ? (isFull ? 'Confirmar y enviar' : 'Enviar')
        : (isLastTab && isFull ? 'Siguiente sección' : 'Siguiente');

    return (
        <div
            className="
                sticky flex flex-col space-y-4 w-full py-4 top-0 bg-white z-9
                md:space-y-0 md:gap-4 md:py-6 xl:pt-[37px]
                md:flex-row md:justify-between md:items-center
            "
        >
            <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-2">
                <Typography
                    as="h2"
                    titleName={step?.title || ''}
                    icon={!isSmall && step?.icon}
                    tooltip={step?.tooltip}
                    tooltipPlacement="bottom"
                    className="md:text-[26px]/[36px] lg:text-[30px]/[36px]"
                />
                {tieneCambios && (
                    <div className="w-full md:w-auto">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-garetbold bg-[#FFE9CC] text-[#9E5200]">
                            Actualizado
                        </span>
                    </div>
                )}
            </div>
            <div className="flex flex-row items-center justify-center md:justify-end space-x-3 md:space-x-4 shrink-0">
                <Button
                    label={prevLabel}
                    variant="secondary"
                    onClick={async () => {
                        if (onSave) await onSave(true);
                        onPrev?.();
                    }}
                    icon={leftIcon}
                    colSpan={isFirst ? 0 : undefined}
                    fit
                    center
                />
                <Button
                    label={nextLabel}
                    variant="primary"
                    onClick={onSubmit}
                    disabled={nextDisabled}
                    tooltip={nextDisabled ? nextTooltip : null}
                    sufIcon={nextIcon}
                    fit
                    center
                />
                <Button
                    variant="primary"
                    onClick={() => onSave?.()}
                    disabled={saveDisabled}
                    tooltip={saveDisabled
                        ? 'Sin cambios por guardar'
                        : (saveTooltip || 'Guardar avance')}
                    iconButton={saveIcon}
                    colSpan={isLast ? 0 : undefined}
                    fit
                    center
                />
            </div>
        </div>
    );
};

export default NavigateStep;
