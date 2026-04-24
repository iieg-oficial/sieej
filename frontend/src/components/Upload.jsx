import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import ErrorRequired from '../helpers/ErrorsRequired';
import DynamicDiv from "../helpers/DynamicDiv";
import Label from "./Label";

const Upload = ({ 
    name, label, multiple = false, accept = "image/*", tooltip,
    maxSizeMB = 2, required = false, colSpan, wDiv
}) => {
    const { control, formState: { errors } } = useFormContext();
    const [fileList, setFileList] = useState([]);

    const handleFileChange = (event, onChange) => {
        const files = event.target.files;
        
        if (!files) return;

        const validFiles = Array.from(files).filter(file => {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`El archivo "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB.`);
                return false;
            }
            return true;
        });

        if (validFiles.length) {
            setFileList(multiple ? [...fileList, ...validFiles] : validFiles);
            onChange(multiple ? files : files[0]);
        }
    };

    const removeFile = (index, onChange) => {
        const newFiles = [...fileList];
        newFiles.splice(index, 1);
        setFileList(newFiles);
        onChange(newFiles.length ? newFiles : null);
    };

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv}>
            <Label labelName={label} tooltip={tooltip}/>

            <Controller
                name={name}
                control={control}
                defaultValue={multiple ? [] : null}
                rules={{ required: required ? "Este campo es obligatorio" : false }}
                render={({ field }) => (
                    <>
                        <input
                            type="file"
                            id={name}
                            accept={accept}
                            multiple={multiple}
                            onChange={(e) => handleFileChange(e, field.onChange)}
                            className="hidden"
                        />
                        <label
                            htmlFor={name}
                            className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 px-4 py-6 text-gray-600 hover:bg-gray-200"
                        >
                            📁 Seleccionar archivo(s)
                        </label>

                        {fileList.length > 0 && (
                            <ul className="mt-2 space-y-2">
                                {fileList.map((file, index) => (
                                    <li key={index} className="flex items-center justify-between bg-gray-200 p-2 rounded">
                                        <span className="text-sm">{file.name}</span>
                                        <button
                                            type="button"
                                            className="ml-2 text-red-600 hover:text-red-800"
                                            onClick={() => removeFile(index, field.onChange)}
                                        >
                                        ❌
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            />

            <ErrorRequired name={name} errors={errors}/>
        </DynamicDiv>
    );
};

export default Upload;