"use client"

import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import InputField from "../InputField";

const schema = z.object({
    username: z
        .string()
        .min(3, {message: "Username must be at least 3 characters long"})
        .max(20, {message: "Username can be at most 20 characters long"}),
    email: z.string().email({message: "Invalid email address"}),
    password: z.string().min(8, {message: "Password must be at least 8 characters long"}),
    firstname: z.string().min(3, {message: "First name is required"}),
    lastname: z.string().min(3, {message: "Last name is required"}),
    phone: z.string().min(10, {message: "Phone number must be at least 10 characters long"}),
    address: z.string().min(10, {message: "Address is required"}),
    bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {message: "Blood group is required"}),
    birthdate: z.date({message: "Birthdate is required"}),
    sex: z.enum(["male", "female"], {message: "Sex is required"}),
    img: z.instanceof(File, {message: "Image is required"}),
});

type Inputs = z.infer<typeof schema>;

const StudentForm = ({
    type, 
    data,
}: {
    type: "create" | "update"; 
    data?:any;
}) => {
    const [formData, setFormData] = useState(data);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Inputs>({
        resolver: zodResolver(schema),
    });

    const onSubmit = handleSubmit((d) => 
        console.log(d)
    );

    return (
        <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">Create a new Student</h1>
            <span className="text-xs text-gray-400">
                Authentication information
            </span>
            <div className="flex justify-between flex-wrap gap-4">
                <InputField label="Username" name="username" defaultValue={data?.username} register={register} error={errors.username} />
                <InputField label="Email" name="email" type="email" defaultValue={data?.email} register={register} error={errors.email} />
                <InputField label="Password" name="password" type="password" defaultValue={data?.password} register={register} error={errors.password} />
            </div>
            <span className="text-xs text-gray-400">
                Personal information
            </span>
            <div className="flex justify-between flex-wrap gap-4">
                <InputField label="First name" name="firstname" defaultValue={data?.firstname} register={register} error={errors.firstname} />
                <InputField label="Last name" name="lastname" defaultValue={data?.lastname} register={register} error={errors.lastname} />
                <InputField label="Phone" name="phone" type="number" defaultValue={data?.phone} register={register} error={errors.phone} />
                <InputField label="Address" name="address" defaultValue={data?.address} register={register} error={errors.address} />
                <InputField label="Blood group" name="bloodGroup" defaultValue={data?.bloodGroup} register={register} error={errors.bloodGroup} />
                <InputField label="Birthdate" name="birthdate" type="date" defaultValue={data?.birthdate} register={register} error={errors.birthdate} />
                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-xs text-gray-500">Sex</label>
                    <select 
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" 
                        defaultValue={data?.sex}
                        {...register("sex")}
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                    {errors.sex?.message && <p className="text-red-400 text-xs">{errors.sex.message.toString()}</p>}
                </div>
                <div className="flex flex-col gap-2 w-full md:w-1/4 justify-center items-center">
                    <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer" htmlFor="img">
                        <Image src="/upload.png" alt="image" width={28} height={28} />
                        <span>Upload a photo</span>
                    </label>
                    <input type="file" id="img" className="hidden" {...register("img")} />
                    {errors.img?.message && <p className="text-red-400 text-xs">{errors.img.message.toString()}</p>}
                </div>
            </div>
            <button type="submit" className="bg-blue-400 text-white p-2 rounded-md">
                {type === "create" ? "Create" : "Update"}
            </button>
        </form>
    )
}

export default StudentForm;

