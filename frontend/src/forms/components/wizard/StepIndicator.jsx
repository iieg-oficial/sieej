import React from 'react';
import Typography from '@components/Typography';
import Tabs from './Tabs';

const COLOR_TEXT = {
    Completada: 'text-[#34A853]',
    'En proceso': 'text-[#4285F4]',
    'No iniciada': 'text-[#7C7C7C]',
    default: 'text-[#7C7C7C]',
};

const ConectionPoints = ({ size = '10' }) => (
    <div className={`w-[2px] h-${size} bg-[#E2E2E2] mt-1`}></div>
);

const computeStatus = (idx, currentStep) => {
    if (idx < currentStep) return 'Completada';
    if (idx === currentStep) return 'En proceso';
    return 'No iniciada';
};

const StepIndicator = ({
    steps, currentStep,
    repeaterItems, activeTab, visitedTabs, sizeTabs,
    onTabClick, onTabRemove,
}) => {
    const isShowTabs = (index) =>
        index === currentStep && Array.isArray(repeaterItems) && repeaterItems.length > 0;

    return (
        <div className="flex flex-col mt-4 space-y-1">
            {steps.map((step, index) => {
                const status = computeStatus(index, currentStep);
                return (
                    <React.Fragment key={step.id || index}>
                        <div className="flex items-start space-x-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        flex items-center justify-center w-8 h-8 rounded-full
                                        text-sm font-garetbold
                                        ${index === currentStep ?
                        'bg-[#5C2473] text-white border border-[#5C2473] inset-ring-4 ring-white' :
                        'bg-[#F0E2F5] text-[#5C2472]'
                    }
                                    `}
                                >
                                    {status === 'Completada'
                                        ? <span aria-label="Completada">&#10004;</span>
                                        : index + 1}
                                </div>
                                {index < steps.length - 1 && <ConectionPoints />}
                            </div>
                            <div>
                                <Typography as="p" titleName={step.title} />
                                <p className={`text-xs font-garetbold ${COLOR_TEXT[status] || COLOR_TEXT.default}`}>
                                    {status}
                                </p>
                            </div>
                        </div>
                        {isShowTabs(index) && (
                            <div className="flex ml-[15px] -mt-[8px] space-x-7">
                                <ConectionPoints size={String(sizeTabs * 11)} />
                                <Tabs
                                    show
                                    vertical
                                    items={repeaterItems}
                                    activeTab={activeTab}
                                    visitedTabs={visitedTabs}
                                    onTabClick={onTabClick}
                                    onTabRemove={onTabRemove}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default StepIndicator;
