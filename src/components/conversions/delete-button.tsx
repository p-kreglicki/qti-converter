'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DeleteButtonProps {
    conversionId: string;
    conversionTitle: string;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
    redirectAfterDelete?: boolean;
}

export function DeleteButton({
    conversionId,
    conversionTitle,
    variant = 'destructive',
    size = 'default',
    showIcon = true,
    redirectAfterDelete = true
}: DeleteButtonProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/conversions/${conversionId}/delete`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete conversion');
            }

            toast.success('Conversion deleted successfully', {
                description: `"${conversionTitle}" and all associated files have been permanently deleted.`
            });

            setIsOpen(false);

            // Redirect to dashboard after deletion
            if (redirectAfterDelete) {
                router.push('/dashboard');
                router.refresh();
            } else {
                router.refresh();
            }

        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('Failed to delete conversion', {
                description: error.message
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                onClick={() => setIsOpen(true)}
                disabled={isDeleting}
            >
                {showIcon && <Trash2 className="h-4 w-4 mr-2" />}
                Delete Now
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Conversion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this conversion? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted p-4 rounded-md">
                        <p className="text-sm font-medium">{conversionTitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            All questions, exports, and uploaded files will be permanently deleted.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
