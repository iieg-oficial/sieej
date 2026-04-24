const objectToFormData = (object) => {
    if(!object) return null;
    
    const formData = new FormData();

    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            formData.append(key, object[key]);
        }
    }
    return formData;
}

export default objectToFormData;