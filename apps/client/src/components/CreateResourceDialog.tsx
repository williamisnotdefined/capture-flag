import { CreateNameForm } from "./CreateNameForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./Dialog";
import { ErrorMessage } from "./ErrorMessage";

type CreateResourceDialogProps = {
  description: string;
  disabled: boolean;
  error: unknown;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<unknown> | unknown;
  open: boolean;
  placeholder: string;
  title: string;
};

export function CreateResourceDialog({
  description,
  disabled,
  error,
  onOpenChange,
  onSubmit,
  open,
  placeholder,
  title,
}: CreateResourceDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CreateNameForm disabled={disabled} onSubmit={onSubmit} placeholder={placeholder} />
        <ErrorMessage error={error} />
      </DialogContent>
    </Dialog>
  );
}
