'use client';

/**
 * Vendor Contacts Component
 *
 * Displays and manages contacts for a vendor
 */

import { useState, useTransition } from 'react';
import {
  Users,
  Plus,
  Mail,
  Phone,
  Pencil,
  Trash2,
  MoreHorizontal,
  User,
  Code,
  Shield,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { cn } from '@/lib/utils';
import { type VendorContactRecord } from '@/lib/vendors/types';
import { CONTACT_TYPE_INFO } from '@/lib/contacts';
import { deleteContact } from '@/lib/contacts/actions';
import { ContactFormDialog } from './contact-form-dialog';

interface VendorContactsProps {
  vendorId: string;
  contacts: VendorContactRecord[];
}

const CONTACT_ICONS: Record<string, React.ElementType> = {
  primary: User,
  technical: Code,
  security: Shield,
  commercial: Briefcase,
  escalation: AlertTriangle,
};

const CONTACT_COLORS: Record<string, string> = {
  primary: 'bg-blue-500/10 text-blue-600',
  technical: 'bg-purple-500/10 text-purple-600',
  security: 'bg-green-500/10 text-green-600',
  commercial: 'bg-orange-500/10 text-orange-600',
  escalation: 'bg-red-500/10 text-red-600',
};

export function VendorContacts({ vendorId, contacts }: VendorContactsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<VendorContactRecord | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (contact: VendorContactRecord) => {
    setEditingContact(contact);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteContactId) return;

    startTransition(async () => {
      const result = await deleteContact(deleteContactId);

      if (result.success) {
        toast.success('Contact deleted successfully');
      } else {
        toast.error(result.error?.message || 'Failed to delete contact');
      }

      setDeleteContactId(null);
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingContact(null);
  };

  return (
    <>
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Contacts</CardTitle>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => {
                const Icon = CONTACT_ICONS[contact.contact_type] || User;
                const colorClass = CONTACT_COLORS[contact.contact_type] || CONTACT_COLORS.primary;
                const typeInfo = CONTACT_TYPE_INFO[contact.contact_type];

                return (
                  <div
                    key={contact.id}
                    className="group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className={cn('rounded-full p-2', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{contact.name}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {typeInfo?.label || contact.contact_type}
                        </Badge>
                      </div>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.title}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{contact.email}</span>
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contact)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteContactId(contact.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No contacts added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add contacts to comply with DORA RoI template B_02.02
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form Dialog */}
      <ContactFormDialog
        vendorId={vendorId}
        contact={editingContact}
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setIsDialogOpen(open);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteContactId}
        onOpenChange={(open) => !open && setDeleteContactId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
