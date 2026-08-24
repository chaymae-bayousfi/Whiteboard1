import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Mail, Link as LinkIcon, Globe, Lock } from 'lucide-react';
import { Button, Input, Toggle } from '../ui';
import { Avatar } from '../ui/Avatar';
import { copyToClipboard } from '@/utils';
import type { Board, User, Permission } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  currentUser: User | null;
}

export function ShareModal({ isOpen, onClose, board, currentUser }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(board.isPublic);
  const [isUpdating, setIsUpdating] = useState(false);

  const boardUrl = `${window.location.origin}/board/${board.id}`;

  const handleCopyLink = async () => {
    await copyToClipboard(boardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = async (newValue: boolean) => {
    setIsUpdating(true);
    try {
      const { boardService } = await import('@/services');
      await boardService.updateBoard(board.id, { isPublic: newValue });
      setIsPublic(newValue);
    } catch (err) {
      console.error('Failed to update board visibility:', err);
      // Revert on error
      setIsPublic(!newValue);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-glass border border-white/50 overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Share board</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Invite others to collaborate on "{board.title}"
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Globe className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {isPublic ? 'Public board' : 'Private board'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isPublic
                          ? 'Anyone with the link can view'
                          : 'Only collaborators can access'}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={isPublic}
                    onChange={handleTogglePublic}
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Board link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={boardUrl}
                      readOnly
                      leftIcon={<LinkIcon className="w-4 h-4" />}
                    />
                    <Button
                      variant={copied ? 'primary' : 'secondary'}
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Collaborators
                  </label>
                  <div className="space-y-2">
                    {currentUser && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-800">{currentUser.name}</p>
                            <p className="text-xs text-gray-500">{currentUser.email}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium text-blush-600 bg-blush-50 rounded-lg">
                          Owner
                        </span>
                      </div>
                    )}
                    {board.collaborators.map((collab) => (
                      <div
                        key={collab.userId}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={collab.user.avatar} name={collab.user.name} size="sm" />
                          <div>
                            <p className="font-medium text-gray-800">{collab.user.name}</p>
                            <p className="text-xs text-gray-500">{collab.user.email}</p>
                          </div>
                        </div>
                        <PermissionSelect
                          permission={collab.permission}
                          onChange={() => {}}
                          disabled
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4">
                <Button variant="secondary" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

export function InviteModal({ isOpen, onClose, boardId }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<Permission>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { boardService } = await import('@/services');
      await boardService.shareBoard(boardId, email, permission);
      setInvited(true);
      setTimeout(() => {
        setInvited(false);
        setEmail('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-glass border border-white/50 overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Invite collaborator</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Share this board with others
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permission
                  </label>
                  <PermissionSelect permission={permission} onChange={setPermission} />
                </div>
              </div>

              <div className="p-6 pt-4 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleInvite}
                  isLoading={isSubmitting}
                  disabled={!email || invited}
                >
                  {invited ? 'Invited!' : 'Send invite'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface PermissionSelectProps {
  permission: Permission;
  onChange: (permission: Permission) => void;
  disabled?: boolean;
}

export function PermissionSelect({
  permission,
  onChange,
  disabled,
}: PermissionSelectProps) {
  return (
    <select
      value={permission}
      onChange={(e) => onChange(e.target.value as Permission)}
      disabled={disabled}
      className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blush-400/20"
    >
      <option value="view">Can view</option>
      <option value="edit">Can edit</option>
      <option value="admin">Admin</option>
    </select>
  );
}
