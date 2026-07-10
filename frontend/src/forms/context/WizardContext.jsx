import React, { createContext, useCallback, useState } from 'react';

export const WizardContext = createContext(null);

export const WizardProvider = ({ totalSteps, initialStep = 0, initialVisited, initialVisitedTabs, children }) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [visited, setVisited] = useState(() => initialVisited ?? new Set([initialStep]));
    const [activeTab, setActiveTab] = useState(0);
    const [visitedTabs, setVisitedTabs] = useState(() => initialVisitedTabs ?? new Set([0]));
    const [sizeTabs, setSizeTabs] = useState(0);

    const goNext = useCallback(() => {
        setCurrentStep((s) => {
            const next = Math.min(s + 1, totalSteps - 1);
            setVisited((v) => new Set(v).add(next));
            return next;
        });
    }, [totalSteps]);

    const goPrev = useCallback(() => {
        setCurrentStep((s) => Math.max(s - 1, 0));
    }, []);

    const goTo = useCallback((idx) => {
        if (idx < 0 || idx >= totalSteps) return;
        setCurrentStep(idx);
        setVisited((v) => new Set(v).add(idx));
    }, [totalSteps]);

    const onActiveTab = useCallback((idx) => {
        setActiveTab(idx);
        setVisitedTabs((v) => new Set(v).add(idx));
    }, []);

    const resetVisitedTabs = useCallback(() => {
        setVisitedTabs(new Set([0]));
        setActiveTab(0);
    }, []);

    return (
        <WizardContext.Provider value={{
            currentStep, visited, totalSteps, goNext, goPrev, goTo,
            activeTab, visitedTabs, sizeTabs,
            onActiveTab, onSizeTab: setSizeTabs, resetVisitedTabs,
        }}>
            {children}
        </WizardContext.Provider>
    );
};
