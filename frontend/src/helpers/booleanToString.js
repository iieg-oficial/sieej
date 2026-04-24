const booleanToString = (data) => {
    return Object.keys(data).reduce((acc, key) => {
        if (typeof data[key] === 'boolean') {
            acc[key] = data[key] ? 'true' : 'false'; 
        } else {
            acc[key] = data[key];
        }
        return acc;
    }, {});
};

export default booleanToString;