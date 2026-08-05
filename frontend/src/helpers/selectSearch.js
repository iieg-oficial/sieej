export const SEARCH_MIN_OPTIONS = 8;

export const shouldSearch = (options = []) => options.length >= SEARCH_MIN_OPTIONS;

export const filterOptions = (options = [], term = '') => {
    const query = term.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
        (option) => String(option.label ?? option.value ?? '').toLowerCase().includes(query),
    );
};
