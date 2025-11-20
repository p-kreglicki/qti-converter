import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, FileSpreadsheet, X, File as FileIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    isProcessing?: boolean;
}

export function FileUploader({
    onFileSelect,
    accept = '.csv,.xlsx,.xls',
    maxSizeMB = 10,
    isProcessing = false,
}: FileUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const validateFile = (file: File): boolean => {
        setError(null);

        // Check size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File size exceeds ${maxSizeMB}MB limit.`);
            return false;
        }

        // Check extension (basic check)
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const acceptedExtensions = accept.split(',').map(e => e.trim().toLowerCase());

        // If accept is "*", allow all
        if (accept !== '*' && !acceptedExtensions.includes(extension)) {
            setError(`Invalid file type. Accepted formats: ${accept}`);
            return false;
        }

        return true;
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <Card>
                <CardContent className="p-6">
                    {!selectedFile ? (
                        <div
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                dragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-300 hover:bg-gray-50",
                                error && "border-destructive/50 bg-destructive/5"
                            )}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={onButtonClick}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept={accept}
                                onChange={handleChange}
                                disabled={isProcessing}
                            />

                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                <Upload className={cn("w-12 h-12 mb-4", dragActive ? "text-primary" : "text-gray-400")} />
                                <p className="mb-2 text-sm text-gray-500 font-medium">
                                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                    CSV, Excel (XLSX, XLS) up to {maxSizeMB}MB
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-white rounded-md border">
                                    {selectedFile.name.endsWith('.csv') ? (
                                        <FileIcon className="w-8 h-8 text-green-600" />
                                    ) : (
                                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearFile}
                                disabled={isProcessing}
                                className="text-gray-500 hover:text-destructive"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
