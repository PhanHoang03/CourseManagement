import type React from "react";
import { FieldError } from "react-hook-form";

type InputFieldProps = {
    label: string; 
    type?: string;
    register: any;
    name: string;
    defaultValue?: string;  
    error?: FieldError;
    required?: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

const InputField = ({ 
    label,
    type="text", 
    register, 
    name,
    defaultValue, 
    error,
    required,
    inputProps
}: InputFieldProps) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-gray-500">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </label>
            <input
                type={type} 
                {...register(name)} 
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
                defaultValue={defaultValue}
                required={required}
                {...inputProps}
            />
            {error?.message && <p className="text-red-400 text-xs">{error.message.toString()}</p>}
        </div>
    )
}

export default InputField;