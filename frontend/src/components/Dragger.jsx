import React, { useState, useEffect } from 'react';
import { Controller, useFormState } from 'react-hook-form';
import useHome from '../context/useHome';
import icoDrag from '../assets/icons/ico_avance_guardado.svg';
import DynamicDiv from '../helpers/DynamicDiv';
import ErrorsRequired from '../helpers/ErrorsRequired';
import extractFileName from '../helpers/extractFileName';
import Label from './Label';

const Dragger = ({ 
    idItem, name, label, multiple, accept = 'image/*', maxSizeMB = 2, 
    required, tooltip, colSpan, wDiv, clean, methods, ...rest
}) => {
    const { onFile } = useHome();
    const { control, setValue, getValues } = methods;
    const { errors } = useFormState({ control, name });
    const [ fileList, setFileList ] = useState([]);

    const handleFiles = async (files, onChange) => {
        const validFiles = Array.from(files).filter(file => {
            if (file.size > maxSizeMB * 1024 * 1024) {
                alert(`El archivo "${file.name}" excede ${maxSizeMB}MB.`);
                return false;
            }
            return true;
        });

        try {
            if (validFiles.length) {
                const isMultiple = multiple ? [...fileList, ...validFiles] : validFiles;
                await onFile(isMultiple, idItem)
                setFileList(isMultiple);
                onChange(multiple ? validFiles : validFiles[0]);
            }
        } catch (error) {
            console.error('Problemas con subir el archivo.', error)
        }
    };

    const onDrop = (e, onChange) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files, onChange);
    };

    const removeFile = (index, onChange) => {
        const newFiles = [...fileList];
        newFiles.splice(index, 1);
        setFileList(newFiles);
        setValue(name, null);
        onChange(newFiles.length ? newFiles : null);
    };

    useEffect(() => {
        if (clean) {
            setValue(name, null);
            setFileList([]);
        }
    }, [clean, name, setValue]);

    useEffect(() => {
        const initialValue = getValues(name);
        if (initialValue) setFileList([initialValue]);
    }, [getValues, name]);

    return (
        <DynamicDiv colSpan={colSpan} wDiv={wDiv}>
            <Label labelName={label} tooltip={tooltip}/>
            <Controller
                name={name}
                control={control}
                defaultValue={multiple ? [] : null}
                rules={{ required: required ? 'Este campo es obligatorio' : false }}
                {...rest}
                render={({ field }) => (
                    <>
                        <label htmlFor={name}>
                            <div
                                className="
                                    mt-2 w-full max-h-[95px] gap-10 flex items-center justify-start
                                    border-1 border-dashed border-[#5C2472] bg-white px-8 py-5 rounded-2xl 
                                    cursor-pointer
                                    hover:bg-[#F8F8F8]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDrop(e, field.onChange)}
                                htmlFor={name}
                            >
                                <img src={icoDrag} alt="ico dragger" className="w-13 h-13" />
                                <div className="text-xl/6 font-garetbold text-[#5C2472] line-clamp-3"> 
                                    Sube tu archivo<br/>
                                    <span className="text-xs font-garetmedium text-[#465055]">
                                        Da clic o arrastra tu archivo dentro de este recuadro 
                                        <span className="text-[10px] font-garetmedium text-[#465055]">
                                            &nbsp;&nbsp;(Formato permitido csv, xlsx y pdf)
                                        </span>
                                    </span>
                                </div>
                                <input
                                    type="file"
                                    id={name}
                                    accept={accept}
                                    multiple={multiple}
                                    onChange={(e) => handleFiles(e.target.files, field.onChange)}
                                    className="hidden"
                                />
                            </div>
                        </label>

                        {fileList.length > 0 && (
                            <ul className="mt-2 space-y-2">
                                {fileList.map((file, index) => (
                                    <li key={index} className="h-[25px] flex items-center justify-between px-2 rounded-md hover:bg-[#F8F8F8]">
                                        <span className="text-xs font-garetmedium text-[#465055] line-clamp-1">
                                            { typeof file === 'string' ? extractFileName(file) : file.name }
                                        </span>
                                        <button
                                            type="button"
                                            className="ml-2 text-[#EA4335] hover:text-red-600"
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

            <ErrorsRequired name={name} errors={errors}/>
        </DynamicDiv>
    );
};

export default Dragger;