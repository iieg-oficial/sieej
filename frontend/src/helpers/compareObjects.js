const compareObjects = (prevArray, newArray) => {
    return newArray.filter(newItem => {
        const prevItem = prevArray.find(prev => prev.id === newItem.id);
        return prevItem && JSON.stringify(prevItem) !== JSON.stringify(newItem);
    });
};

export default compareObjects;
