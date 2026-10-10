import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<Props> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', isDestructive = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${isDestructive ? 'text-red-500' : 'text-yellow-500'}`} />
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 ${
            isDestructive
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </Modal>
);
