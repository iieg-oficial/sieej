export const GRID_COLUMNS = 6;

const SPAN_CLASS = {
    0: 'hidden',
    1: 'md:col-span-1',
    2: 'md:col-span-2',
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    5: 'md:col-span-5',
    6: 'md:col-span-6'
};

const START_CLASS = {
    1: 'md:col-start-1',
    2: 'md:col-start-2',
    3: 'md:col-start-3',
    4: 'md:col-start-4',
    5: 'md:col-start-5',
    6: 'md:col-start-6'
};

export const startColOf = ({ col, newRow, colSpan = 1 }) => {
    if (Number.isInteger(col) && col >= 1 && col + colSpan <= GRID_COLUMNS + 1) return col;
    return newRow ? 1 : null;
};

export function placementClasses({ colSpan = 1, col, newRow, alone }) {
    const start = startColOf({ col, newRow, colSpan });

    if (!alone || colSpan >= GRID_COLUMNS) {
        return [SPAN_CLASS[colSpan] || '', start ? START_CLASS[start] : '']
            .filter(Boolean)
            .join(' ');
    }

    const from = start ?? 1;
    const ratio = (GRID_COLUMNS + 1 - from) / colSpan;
    let maxWidth = '';
    if (ratio >= 3) maxWidth = 'md:max-w-[33.3333%]';
    else if (ratio >= 2) maxWidth = 'md:max-w-[50%]';

    return [START_CLASS[from], 'md:col-end-7', maxWidth].filter(Boolean).join(' ');
}
