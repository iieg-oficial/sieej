export const evaluarShowWhen = (showWhen, scopeValues) => {
    if (!showWhen) return true;
    const { field, equals } = showWhen;
    if (!field) return true;
    const expected = (Array.isArray(equals) ? equals : [equals]).map(String);
    let actual = scopeValues?.[field];
    if (Array.isArray(actual)) {
        return actual.some((v) => expected.includes(String(v)));
    }
    if (typeof actual === 'boolean') actual = actual ? 'true' : 'false';
    return expected.includes(String(actual));
};
