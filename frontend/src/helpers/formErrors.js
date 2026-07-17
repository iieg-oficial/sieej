const parseNameToFields = (name) => {
    const regex = /([^[.\]]+)|\[(\d+)\]/g;
    const fields = [];
    let match;

    while ((match = regex.exec(name)) !== null) {
        if (match[1] !== undefined) {
            fields.push(match[1]);
        } else if (match[2] !== undefined) {
            fields.push(Number(match[2]));
        }
    }

    return fields;
};

export const getErrorMessage = (errors, name) => {
    const fields = parseNameToFields(name);
    let errorObj = errors;

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        if (
            errorObj === undefined ||
            errorObj === null ||
            !(field in errorObj)
        ) {
            return null;
        }

        errorObj = errorObj[field];
    }

    return errorObj?.message || null;
};
