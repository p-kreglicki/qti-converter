'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileJson, FileText, FileCode } from "lucide-react";
import { toast } from 'sonner';

interface ExportModalProps {
    conversionId: string;
    trigger?: React.ReactNode;
}

export function ExportModal({ conversionId, trigger }: ExportModalProps) {
    const [format, setFormat] = useState<string>('qti');
    const [isExporting, setIsExporting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            toast.info(`Preparing ${format.toUpperCase()} export...`);

            // Trigger download via API
            const response = await fetch(`/api/conversions/${conversionId}/export?format=${format}`);

            if (!response.ok) {
                throw new Error('Export failed');
            }

            // Handle file download from response
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Get filename from header or default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `export-${conversionId}.${format === 'qti' ? 'zip' : format}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) filename = match[1];
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Export downloaded successfully");
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to export file");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Questions</DialogTitle>
                    <DialogDescription>
                        Choose a format to download your questions.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="format" className="text-right">
                            Format
                        </Label>
                        <Select value={format} onValueChange={setFormat}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="qti">
                                    <div className="flex items-center">
                                        <FileCode className="mr-2 h-4 w-4 text-blue-500" />
                                        <span>QTI 2.1 Package (.zip)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="csv">
                                    <div className="flex items-center">
                                        <FileText className="mr-2 h-4 w-4 text-green-500" />
                                        <span>CSV (.csv)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="json">
                                    <div className="flex items-center">
                                        <FileJson className="mr-2 h-4 w-4 text-yellow-500" />
                                        <span>JSON (.json)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                        {isExporting ? "Exporting..." : "Download"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
