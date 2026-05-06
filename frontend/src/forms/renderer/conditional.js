export const evaluarShowWhen = (showWhen, scopeValues) => {
    if (!showWhen) return true;
    const { field, equals } = showWhen;
    if (!field) return true;
    let actual = scopeValues?.[field];
    if (typeof actual === 'boolean') actual = actual ? 'true' : 'false';
    return String(actual) === String(equals);
};
