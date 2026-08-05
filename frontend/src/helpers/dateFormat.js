const pad = (n) => String(n).padStart(2, '0');

export const toISO = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;

export const parseISO = (value) => {
    if (!value || typeof value !== 'string') return null;
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month: month - 1, day };
};

export const formatDisplay = (value) => {
    const parsed = parseISO(value);
    if (!parsed) return '';
    return `${pad(parsed.day)}/${pad(parsed.month + 1)}/${parsed.year}`;
};

export const todayISO = () => {
    const now = new Date();
    return toISO(now.getFullYear(), now.getMonth(), now.getDate());
};

export const LIMITE_HOY = 'hoy';

export const resolveDateLimit = (limite) => {
    if (typeof limite !== 'string' || !limite) return undefined;
    if (limite === LIMITE_HOY) return todayISO();
    return parseISO(limite) ? limite.slice(0, 10) : undefined;
};

export const buildDays = (year, month) => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array(firstWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};
