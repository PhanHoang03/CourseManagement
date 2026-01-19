"use client"

import { useForm, Path } from "react-hook-form";
import { useState, useRef, useCallback } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import InputField from "../InputField";
import { contentsApi } from "@/lib/api";
// Quiz removed - use Assessment instead

// Base schema with common fields
const baseSchema = z.object({
  title: z.string().min(2, { message: "Content title must be at least 2 characters" }),
  description: z.string().optional(),
  contentType: z.enum(['video', 'document', 'text', 'link', 'assignment']),
  contentUrl: z.string().url().optional().or(z.literal('')),
  fileUrl: z.string().url().optional().or(z.literal('')),
  fileSize: z.number().int().positive().optional(),
  order: z.number().int().positive().optional(),
  duration: z.number().int().positive().optional(),
  isRequired: z.boolean().default(true),
});

// Create schema (moduleId required)
const createSchema = baseSchema.extend({
  moduleId: z.string().uuid({ message: "Module ID is required" }),
});

// Update schema (all fields optional)
const updateSchema = baseSchema.partial();

type CreateInputs = z.infer<typeof createSchema>;
type UpdateInputs = z.infer<typeof updateSchema>;

type UploadMode = 'upload' | 'link';

const ContentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formSchema = type === "create" ? createSchema : updateSchema;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateInputs | UpdateInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: data ? {
      title: data.title,
      description: data.description,
      contentType: data.contentType || 'text',
      contentUrl: (data.contentData as any)?.url || data.contentUrl || '',
      fileUrl: data.fileUrl || '',
      fileSize: data.fileSize ? Number(data.fileSize) : undefined,
      order: data.order ? Number(data.order) : undefined,
      duration: data.duration ? Number(data.duration) : undefined,
      isRequired: data.isRequired !== undefined ? data.isRequired : true,
      ...(type === "create" && data.moduleId ? { moduleId: data.moduleId } : {}),
    } : undefined,
  });

  const contentType = watch("contentType");

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Filter files based on content type
    const validFiles = files.filter((file) => {
      if (contentType === 'video') {
        return file.type.startsWith('video/');
      } else if (contentType === 'document') {
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(file.type);
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      alert(`Some files were filtered out. Only ${contentType} files are allowed.`);
    }

    setSelectedFiles(validFiles);
    
    // Auto-fill title if empty and only one file
    if (validFiles.length === 1 && !watch("title")) {
      // Extract filename without extension
      const fileName = validFiles[0].name.replace(/\.[^/.]+$/, "");
      setValue("title", fileName);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Real file upload to backend using Multer
  const uploadFile = async (file: File): Promise<string> => {
    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      // Upload file to backend
      const response = await contentsApi.uploadFile(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'File upload failed');
      }
      
      // File uploaded successfully - return permanent URL
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      
      // Return the permanent URL from backend
      // This will be: http://localhost:5000/uploads/videos/timestamp-filename.mp4
      return response.data.url;
    } catch (error: any) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      console.error('File upload error:', error);
      throw new Error(error.message || 'Failed to upload file. Please try again.');
    }
  };

  // Convert BigInt values to regular numbers to avoid serialization errors
  const convertBigIntToString = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = convertBigIntToString(obj[key]);
      }
      return converted;
    }
    return obj;
  };

  const onSubmit = async (formData: CreateInputs | UpdateInputs) => {
    setLoading(true);
    try {
      const submitData: any = { ...formData };

      // Handle file uploads if files are selected
      if (uploadMode === 'upload' && selectedFiles.length > 0) {
        // Upload all files (in production, this should upload to your storage service)
        const uploadedUrls: string[] = [];
        for (const file of selectedFiles) {
          const url = await uploadFile(file);
          uploadedUrls.push(url);
        }
        
        // Use first uploaded file URL
        if (uploadedUrls.length > 0) {
          submitData.fileUrl = uploadedUrls[0];
          // Convert to Number to avoid BigInt serialization issues
          submitData.fileSize = Number(selectedFiles[0].size);
          
          // For video content, also set contentUrl to the file URL
          if (contentType === 'video') {
            submitData.contentData = { url: uploadedUrls[0] };
          }
        }
      } else if (uploadMode === 'link') {
        // Store contentUrl in contentData if provided
        if (submitData.contentUrl && submitData.contentUrl !== '') {
          submitData.contentData = { url: submitData.contentUrl };
        }
      }
      
      delete submitData.contentUrl; // Remove contentUrl as it's not in the schema

      // Remove empty string fields
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === '' || submitData[key] === undefined || submitData[key] === null) {
          delete submitData[key];
        }
      });

      // Convert any BigInt values to Numbers before sending
      const sanitizedData = convertBigIntToString(submitData);

      if (type === "create") {
        await contentsApi.create(sanitizedData as CreateInputs);
        reset();
        setSelectedFiles([]);
        setUploadProgress({});
      } else if (data?.id) {
        await contentsApi.update(data.id, sanitizedData as UpdateInputs);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Content" : "Update Content"}
      </h1>

      <span className="text-xs text-gray-400">
        Content information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          defaultValue={data?.title}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Content Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.contentType || 'text'}
            {...register("contentType")}
          >
            <option value="video">Video</option>
            <option value="document">Document</option>
            <option value="text">Text</option>
            <option value="link">Link</option>
            <option value="assignment">Assignment</option>
          </select>
          {errors.contentType?.message && (
            <p className="text-red-400 text-xs">{errors.contentType.message.toString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            rows={3}
            defaultValue={data?.description}
            {...register("description")}
          />
        </div>
        {/* Upload Mode Toggle */}
        {(contentType === 'video' || contentType === 'document' || contentType === 'link') && (
          <div className="flex items-center gap-2 w-full border-b border-gray-200 pb-2">
            <button
              type="button"
              onClick={() => setUploadMode('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                uploadMode === 'upload'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('link')}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                uploadMode === 'link'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Add from URL / Embed
            </button>
          </div>
        )}

        {/* Drag-and-Drop Upload Zone */}
        {uploadMode === 'upload' && (contentType === 'video' || contentType === 'document') && (
          <div className="w-full">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept={
                  contentType === 'video'
                    ? 'video/*'
                    : contentType === 'document'
                    ? '.pdf,.doc,.docx,.ppt,.pptx'
                    : '*/*'
                }
                onChange={handleFileSelect}
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Image src="/upload.png" alt="Upload" width={32} height={32} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    {contentType === 'video' 
                      ? 'MP4, MOV, AVI up to 4GB' 
                      : contentType === 'document'
                      ? 'PDF, DOC, DOCX, PPT, PPTX'
                      : 'Select files to upload'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 font-medium">Selected Files:</p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <Image src={`/${contentType}.png`} alt={contentType} width={20} height={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      {uploadProgress[file.name] !== undefined && (
                        <div className="w-24">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{uploadProgress[file.name]}%</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 p-2 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Image src="/close.png" alt="Remove" width={16} height={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* URL/Link Input */}
        {uploadMode === 'link' && (
          <InputField
            label={contentType === 'video' ? 'Video URL (YouTube, Vimeo, etc.)' : contentType === 'document' ? 'Document URL' : 'Content URL'}
            name="contentUrl"
            type="url"
            register={register}
            error={errors.contentUrl}
            defaultValue={(data?.contentData as any)?.url || data?.contentUrl || ''}
          />
        )}

        {contentType === 'video' && (
          <InputField
            label="Duration (seconds)"
            name="duration"
            type="number"
            register={(name: Path<CreateInputs | UpdateInputs>) => register(name, { setValueAs: (v) => v === '' ? undefined : parseInt(v, 10) })}
            error={errors.duration}
            defaultValue={data?.duration?.toString()}
          />
        )}
        <InputField
          label="Order"
          name="order"
          type="number"
          register={(name: string) => register(name as any, { setValueAs: (v) => v === '' ? undefined : parseInt(v, 10) })}
          error={errors.order}
          defaultValue={data?.order?.toString()}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Required</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.isRequired !== undefined ? (data.isRequired ? "true" : "false") : "true"}
            {...register("isRequired", { setValueAs: (v) => v === "true" })}
          >
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Saving..." : type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default ContentForm;
