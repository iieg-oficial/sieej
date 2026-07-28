export const GRID_COLUMNS = 6;

export const COLSPAN_UNITS = { 1: 6, 2: 3, 3: 2 };

export const unitsOfColSpan = (colSpan) => COLSPAN_UNITS[colSpan] ?? GRID_COLUMNS;

export const unitsOfField = (field) => unitsOfColSpan(field?.layout?.colSpan ?? 1);

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

export function placementClasses({ colSpan = 1, col, newRow }) {
    const start = startColOf({ col, newRow, colSpan });

    return [SPAN_CLASS[colSpan] || '', start ? START_CLASS[start] : '']
        .filter(Boolean)
        .join(' ');
}

export const spacerClass = (units) => `hidden md:block ${SPAN_CLASS[units] || ''}`.trim();

const explicitColOf = (field) => {
    const col = field?.layout?.col;
    if (Number.isInteger(col) && col >= 1 && col <= GRID_COLUMNS) return col;
    return field?.layout?.newRow ? 1 : null;
};

export const groupIntoRows = (fields) => {
    const rows = [];
    let items = [];
    let cursor = 1;

    const flush = () => {
        if (items.length === 0) return;
        rows.push({ items });
        items = [];
        cursor = 1;
    };

    fields.forEach((field, idx) => {
        const units = unitsOfField(field);
        const wanted = explicitColOf(field);
        const alone = !!field?.layout?.alone;
        let col;
        if (alone) {
            flush();
            col = Math.min(wanted ?? 1, GRID_COLUMNS + 1 - units);
        } else if (wanted == null) {
            if (items.length > 0 && cursor + units > GRID_COLUMNS + 1) flush();
            col = cursor;
        } else {
            if (items.length > 0 && wanted < cursor) flush();
            col = Math.min(wanted, GRID_COLUMNS + 1 - units);
        }
        items.push({ idx, col, units });
        cursor = col + units;
        if (alone || cursor > GRID_COLUMNS) flush();
    });
    flush();

    return rows;
};

export const layoutSlots = (fields) => {
    const slots = [];

    groupIntoRows(fields).forEach((row) => {
        let cursor = 1;
        row.items.forEach((item) => {
            if (item.col > cursor) slots.push({ kind: 'spacer', units: item.col - cursor });
            slots.push({ kind: 'field', idx: item.idx, col: item.col, units: item.units });
            cursor = item.col + item.units;
        });
        if (cursor <= GRID_COLUMNS) slots.push({ kind: 'spacer', units: GRID_COLUMNS + 1 - cursor });
    });

    return slots;
};
