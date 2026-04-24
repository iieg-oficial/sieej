const cleanObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        const cleanedArray = obj.map(cleanObject).filter(item => item !== null && item !== undefined);
        return cleanedArray.length > 0 ? cleanedArray : undefined;
    }

    const cleanedObj = Object.entries(obj)
        .reduce((acc, [key, value]) => {
            const cleanedValue = cleanObject(value);
            if (cleanedValue !== null && cleanedValue !== undefined) {
                acc[key] = cleanedValue;
            }
            return acc;
        }, {});

    return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
}

export default cleanObject