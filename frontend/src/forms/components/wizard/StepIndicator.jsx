import React from 'react';
import Typography from '@components/Typography';
import Tabs from './Tabs';

const COLOR_TEXT = {
    Completada: 'text-[#34A853]',
    'En proceso': 'text-[#4285F4]',
    'Datos incompletos': 'text-[#FF8300]',
    'No iniciada': 'text-[#7C7C7C]',
    default: 'text-[#7C7C7C]',
};

const CIRCLE_STYLE = {
    Completada: 'bg-[#EAF6ED] text-[#34A853]',
    'En proceso': 'bg-[#5C2473] text-white border border-[#5C2473] inset-ring-4 ring-white',
    'Datos incompletos': 'bg-[#FEDAB2] text-[#FF8300]',
    'No iniciada': 'bg-[#F0E2F5] text-[#5C2472]',
};

const computeStatus = (idx, currentStep, completeness) => {
    if (idx === currentStep) return 'En proceso';
    if (idx < currentStep) return 'Completada';
    if (completeness === 'completo') return 'Completada';
    if (completeness === 'incompleto') return 'Datos incompletos';
    return 'No iniciada';
};

const StepIndicator = ({
    steps, currentStep, visited, onStepClick,
    repeaterItems, activeTab, visitedTabs,
    onTabClick, onTabRemove, stepsCompleteness,
}) => {
    const isShowTabs = (index) =>
        index === currentStep && Array.isArray(repeaterItems) && repeaterItems.length > 0;

    return (
        <div className="flex flex-col mt-4">
            {steps.map((step, index) => {
                const status = computeStatus(index, currentStep, stepsCompleteness?.get(index));
                const isClickable = typeof onStepClick === 'function'
                    && index !== currentStep
                    && !!visited?.has(index);
                const isLastStep = index === steps.length - 1;
                const showTabs = isShowTabs(index);
                const hasBody = !isLastStep || showTabs;
                return (
                    <div key={step.id || index} className="flex flex-col">
                        <div
                            className={`flex items-center space-x-4 rounded-lg ${isClickable ? 'cursor-pointer' : ''}`}
                            role={isClickable ? 'button' : undefined}
                            tabIndex={isClickable ? 0 : undefined}
                            onClick={isClickable ? () => onStepClick(index) : undefined}
                            onKeyDown={isClickable
                                ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onStepClick(index))
                                : undefined}
                        >
                            <div
                                className={`
                                    flex items-center justify-center w-8 h-8 rounded-full shrink-0
                                    text-sm font-garetbold
                                    ${CIRCLE_STYLE[status] || CIRCLE_STYLE['No iniciada']}
                                `}
                            >
                                {status === 'Completada'
                                    ? <span aria-label="Completada">&#10004;</span>
                                    : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Typography as="p" titleName={step.title} className="break-words" />
                                <p className={`text-xs font-garetbold ${COLOR_TEXT[status] || COLOR_TEXT.default}`}>
                                    {status}
                                </p>
                            </div>
                        </div>
                        {hasBody && (
                            <div className="flex space-x-4">
                                <div className="flex flex-col w-8 shrink-0 items-center">
                                    {!isLastStep && (
                                        <div className="w-[2px] flex-1 min-h-[20px] bg-[#E2E2E2]" />
                                    )}
                                </div>
                                <div className={`flex-1 min-w-0 ${showTabs ? 'pt-2 pb-2' : 'pb-6'}`}>
                                    {showTabs && (
                                        <Tabs
                                            show
                                            vertical
                                            items={repeaterItems}
                                            activeTab={activeTab}
                                            visitedTabs={visitedTabs}
                                            onTabClick={onTabClick}
                                            onTabRemove={onTabRemove}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
