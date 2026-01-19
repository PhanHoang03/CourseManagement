"use client"
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useEffect, ReactNode } from 'react';
import { usersApi, organizationsApi, departmentsApi, coursesApi, modulesApi, contentsApi, enrollmentsApi, assignmentsApi, assessmentsApi } from '@/lib/api';

// Dynamic form imports
const UserForm = dynamic(() => import('./forms/UserForm'), {
    loading: () => <h1>Loading...</h1>,
});
const OrganizationForm = dynamic(() => import('./forms/OrganizationForm'), {
    loading: () => <h1>Loading...</h1>,
});
const DepartmentForm = dynamic(() => import('./forms/DepartmentForm'), {
    loading: () => <h1>Loading...</h1>,
});
const CourseForm = dynamic(() => import('./forms/CourseForm'), {
    loading: () => <h1>Loading...</h1>,
});
const TeacherForm = dynamic(() => import('./forms/TeacherForm'), {
    loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import('./forms/StudentForm'), {
    loading: () => <h1>Loading...</h1>,
});
const ModuleForm = dynamic(() => import('./forms/ModuleForm'), {
    loading: () => <h1>Loading...</h1>,
});
const ContentForm = dynamic(() => import('./forms/ContentForm'), {
    loading: () => <h1>Loading...</h1>,
});
const AssignmentForm = dynamic(() => import('./forms/AssignmentForm'), {
    loading: () => <h1>Loading...</h1>,
});
const AssessmentForm = dynamic(() => import('./forms/AssessmentForm'), {
    loading: () => <h1>Loading...</h1>,
});

// API mapping for built-in entities
const apiMap: {
    [key: string]: {
        getById?: (id: string) => Promise<any>;
        delete?: (id: string) => Promise<any>;
    };
} = {
    user: {
        getById: (id: string) => usersApi.getById(id),
        delete: (id: string) => usersApi.delete(id),
    },
    organization: {
        getById: (id: string) => organizationsApi.getById(id),
        delete: (id: string) => organizationsApi.delete(id),
    },
    department: {
        getById: (id: string) => departmentsApi.getById(id),
        delete: (id: string) => departmentsApi.delete(id),
    },
    course: {
        getById: (id: string) => coursesApi.getById(id),
        delete: (id: string) => coursesApi.delete(id),
    },
    module: {
        getById: (id: string) => modulesApi.getById(id),
        delete: (id: string) => modulesApi.delete(id),
    },
    content: {
        getById: (id: string) => contentsApi.getById(id),
        delete: (id: string) => contentsApi.delete(id),
    },
    enrollment: {
        getById: (id: string) => enrollmentsApi.getById(id),
        // Note: enrollmentsApi doesn't have delete, use drop instead if needed
    },
    assignment: {
        getById: (id: string) => assignmentsApi.getById(id),
        delete: (id: string) => assignmentsApi.delete(id),
    },
    assessment: {
        getById: (id: string) => assessmentsApi.getById(id),
        delete: (id: string) => assessmentsApi.delete(id),
    },
};

// Form component mapping for built-in entities
const formsMap: {
    [key: string]: (type: "create" | "update", data?: any, onSuccess?: () => void) => ReactNode;
} = {
    user: (type, data, onSuccess) => <UserForm type={type} data={data} onSuccess={onSuccess} />,
    organization: (type, data, onSuccess) => <OrganizationForm type={type} data={data} onSuccess={onSuccess} />,
    department: (type, data, onSuccess) => <DepartmentForm type={type} data={data} onSuccess={onSuccess} />,
    course: (type, data, onSuccess) => <CourseForm type={type} data={data} onSuccess={onSuccess} />,
    module: (type, data, onSuccess) => <ModuleForm type={type} data={data} onSuccess={onSuccess} />,
    content: (type, data, onSuccess) => <ContentForm type={type} data={data} onSuccess={onSuccess} />,
    assignment: (type, data, onSuccess) => <AssignmentForm type={type} data={data} onSuccess={onSuccess} />,
    assessment: (type, data, onSuccess) => <AssessmentForm type={type} data={data} onSuccess={onSuccess} />,
    teacher: (type, data, onSuccess) => <TeacherForm type={type} data={data} />,
    student: (type, data, onSuccess) => <StudentForm type={type} data={data} />,
};

interface FormModalProps {
    // Entity type (for built-in forms) or custom identifier
    table?: 
        | "user"
        | "teacher" 
        | "student" 
        | "parent"
        | "organization"
        | "department"
        | "course"
        | "module"
        | "content"
        | "subject"
        | "class" 
        | "result" 
        | "assignment" 
        | "assessment"
        | "exam" 
        | "lesson" 
        | "attendance"
        | "event"
        | "announcement"
        | string; // Allow any string for custom entities
    type: "create" | "update" | "delete";
    data?: any;
    id?: string | number;
    onSuccess?: () => void;
    
    // Optional: Custom API functions (overrides built-in)
    api?: {
        getById?: (id: string) => Promise<any>;
        delete?: (id: string) => Promise<any>;
    };
    
    // Optional: Custom form component (overrides built-in)
    form?: React.ComponentType<{
        type: "create" | "update";
        data?: any;
        onSuccess?: () => void;
    }> | React.ComponentType<{
        type: "create" | "update";
        data?: any;
    }>;
    
    // Optional: Custom delete confirmation message
    deleteMessage?: string;
    
    // Optional: Custom button styling
    buttonSize?: string;
    buttonColor?: string;
}

const FormModal = ({ 
    table = "",
    type, 
    data, 
    id,
    onSuccess,
    api,
    form: CustomForm,
    deleteMessage,
    buttonSize,
    buttonColor,
}: FormModalProps) => {

    const size = buttonSize || (type === "create" ? "w-8 h-8" : "w-7 h-7");
    const bgColor = buttonColor || (
        type === "create" 
        ? "bg-lamaYellow" 
        : type === "update" 
        ? "bg-lamaSky" 
        : "bg-lamaPurple"
    );

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState(data);
    const [loading, setLoading] = useState(false);

    // Get API functions (custom props override built-in)
    const getApi = () => {
        if (api) return api;
        if (table && apiMap[table]) return apiMap[table];
        return {};
    };

        // Get form component (custom prop overrides built-in)
        const getFormComponent = () => {
            if (CustomForm) {
                return (type: "create" | "update", data?: any, onSuccess?: () => void) => {
                    // Check if component accepts onSuccess prop by checking its type
                    const props: any = { type, data };
                    if (onSuccess) {
                        props.onSuccess = onSuccess;
                    }
                    return <CustomForm {...props} />;
                };
            }
            if (table && formsMap[table]) {
                return formsMap[table];
            }
            return null;
        };

    useEffect(() => {
        const fetchData = async () => {
            if (type === "update" && id && !data) {
                setLoading(true);
                try {
                    const apiFunctions = getApi();
                    if (apiFunctions.getById) {
                        const response = await apiFunctions.getById(id as string);
                        if (response?.success && response?.data) {
                            setFormData(response.data);
                        } else if (response?.data) {
                            // Handle case where response is the data directly
                            setFormData(response.data);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [type, id, table, data, api]);

    const handleDelete = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const apiFunctions = getApi();
            if (apiFunctions.delete) {
                await apiFunctions.delete(id as string);
            } else {
                alert("Delete function not provided for this entity");
                setLoading(false);
                return;
            }
            
            if (onSuccess) {
                onSuccess();
            } else {
                window.location.reload();
            }
            setOpen(false);
        } catch (error: any) {
            alert(error.message || "Failed to delete");
        } finally {
            setLoading(false);
        }
    };

    const Form = () => {
        if (loading) {
            return <div className="flex items-center justify-center p-8">Loading...</div>;
        }

        const handleFormSuccess = () => {
            if (onSuccess) {
                onSuccess();
            } else {
                window.location.reload();
            }
            setOpen(false);
        };

        // Delete confirmation
        if (type === "delete" && id) {
            return (
                <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }} className="flex flex-col gap-4">
                    <span className="text-center font-medium">
                        {deleteMessage || `Are you sure you want to delete this ${table || "item"}?`}
                    </span>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="bg-red-700 text-white px-4 py-2 rounded-md border-none w-max self-center disabled:opacity-50"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </form>
            );
        }

        // Create or Update form
        if (type === "create" || type === "update") {
            const formComponent = getFormComponent();
            if (formComponent) {
                return formComponent(type, formData || data, handleFormSuccess);
            }
            return (
                <div className="p-4">
                    Form for {table || "this entity"} not yet implemented. 
                    {!table && " Please provide a 'form' prop or 'table' prop."}
                </div>
            );
        }

        return <div className="p-4">Form type not recognized</div>;
    };

    return (
        <div>
            <button 
                className={`${size} ${bgColor} rounded-full flex items-center justify-center`}
                onClick={() => setOpen(true)}
            >
                <Image src={`/${type}.png`} alt="" width={16} height={16} />
            </button>
            {open && (
                <div 
                    className="h-screen w-screen absolute top-0 left-0 bg-black bg-opacity-60 z-50 flex items-center justify-center"
                    onClick={() => setOpen(false)}
                >
                    <div 
                        className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%] max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Form />
                        <div className="absolute top-4 right-4 cursor-pointer" onClick={() => setOpen(false)}>
                            <Image src="/close.png" alt="" width={14} height={14} />
                        </div>
                    </div>
                </div>
            )} 
        </div>
    );
};

export default FormModal;
