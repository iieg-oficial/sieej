const objectsToStrings = (objectsArray, conditionParam = 'value') => {
    if (!Array.isArray(objectsArray) || objectsArray.length === 0) return [];
    if (!objectsArray.every(obj => typeof obj === 'object' && obj !== null)) return objectsArray;
    if (objectsArray.every(obj => typeof obj === 'string')) return objectsArray;

    return objectsArray.map(obj => obj?.[conditionParam]);
}

export default objectsToStrings;