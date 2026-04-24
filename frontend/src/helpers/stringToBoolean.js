const stringToBoolean = (data) => {
    return Object.keys(data).reduce((acc, key) => {
        if (data[key] === 'true') {
            acc[key] = true;
        } else if (data[key] === 'false') {
            acc[key] = false;
        } else {
            acc[key] = data[key];
        }
        return acc;
    }, {});
};

export default stringToBoolean;