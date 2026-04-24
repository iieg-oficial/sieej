const extractFileName = (filePath) => {
    const fileName = filePath.split('/').pop();
    return fileName.replace(/\d{14}(?=\.\w+$)/, '');
};

export default extractFileName;