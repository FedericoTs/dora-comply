'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteIncidentAction } from '@/lib/incidents/actions';
import { toast } from 'sonner';

interface DeleteIncidentButtonProps {
  incidentId: string;
  incidentRef: string;
}

export function DeleteIncidentButton({ incidentId, incidentRef }: DeleteIncidentButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteIncidentAction(incidentId);

      if (result.success) {
        toast.success(`Incident ${incidentRef} deleted successfully`);
        router.push('/incidents');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete incident');
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('An unexpected error occurred');
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Incident?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete incident <strong>{incidentRef}</strong>?
            This action cannot be undone. All associated reports and timeline events
            will also be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Incident'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
