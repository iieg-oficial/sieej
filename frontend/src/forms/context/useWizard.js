import { useContext } from 'react';
import { WizardContext } from './WizardContext';

const useWizard = () => {
    const ctx = useContext(WizardContext);
    if (!ctx) throw new Error('useWizard debe usarse dentro de WizardProvider');
    return ctx;
};

export default useWizard;
