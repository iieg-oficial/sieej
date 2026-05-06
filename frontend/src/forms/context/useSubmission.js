import { useContext } from 'react';
import { SubmissionContext } from './SubmissionContext';

const useSubmission = () => {
    const ctx = useContext(SubmissionContext);
    if (!ctx) throw new Error('useSubmission debe usarse dentro de SubmissionProvider');
    return ctx;
};

export default useSubmission;
