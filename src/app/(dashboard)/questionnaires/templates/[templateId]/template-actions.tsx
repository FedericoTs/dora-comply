'use client';

/**
 * Template Actions Component
 *
 * Action buttons for template management (edit, duplicate, delete)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Copy, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteTemplate } from '@/lib/nis2-questionnaire/actions';
import type { QuestionnaireTemplate } from '@/lib/nis2-questionnaire/types';

interface TemplateActionsProps {
  template: QuestionnaireTemplate;
}

export function TemplateActions({ template }: TemplateActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteTemplate(template.id);
      if (result.success) {
        toast.success('Template deleted');
        router.push('/questionnaires/templates');
      } else {
        toast.error(result.error || 'Failed to delete template');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Template actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Edit Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate Template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setShowDeleteDialog(true)}
            disabled={template.times_used > 0}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{template.name}&quot;? This action cannot be
              undone.
              {template.times_used > 0 && (
                <span className="block mt-2 text-destructive">
                  This template has been used {template.times_used} times. You cannot delete
                  templates that have been sent to vendors.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || template.times_used > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
