import { ModalRoot } from '@/components/ui/ModalRoot';
import {
  ModalBody,
  ModalCloseButton,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/ModalParts';

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  CloseButton: ModalCloseButton,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
});
