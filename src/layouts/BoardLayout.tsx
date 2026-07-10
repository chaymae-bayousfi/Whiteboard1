import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Download,
  Upload,
  Undo,
  Redo,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { Button, Tooltip, Dropdown, DropdownItem, DropdownDivider } from '@/components/ui';
import { ConnectionStatus, OnlineUsersList } from '@/components/collaboration';
import { ShareModal } from '@/components/collaboration';
import { useBoardStore, useCollaborationStore, useAuthStore } from '@/stores';
import { exportService } from '@/services';
import type { CanvasElement } from '@/types';

interface BoardLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  leftToolbar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onExportPNG?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (elements: CanvasElement[]) => void;
}

export function BoardLayout({
  children,
  rightPanel,
  leftToolbar,
  bottomBar,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onExportPNG,
  onExportJSON,
  onImportJSON,
}: BoardLayoutProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const { currentBoard } = useBoardStore();
  const { connectionStatus, onlineUsers } = useCollaborationStore();
  const { user } = useAuthStore();

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !onImportJSON) return;
      try {
        const imported = await exportService.importFromJSON(file);
        onImportJSON(imported);
      } catch {
        // Invalid JSON — silently ignore
      }
    };
    input.click();
  };

  const allOnlineUsers = [
    { id: user?.id ?? '', name: user?.name ?? 'You', avatar: user?.avatar },
    ...onlineUsers.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar })),
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="shrink-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blush-400 to-lavender-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
              </svg>
            </div>
            <h1 className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
              {currentBoard?.title ?? 'Untitled Board'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ConnectionStatus status={connectionStatus} />
          </div>

          <OnlineUsersList users={allOnlineUsers} currentUserId={user?.id} />

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <Tooltip content="Undo (Ctrl+Z)" position="bottom">
            <button
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onUndo}
              disabled={!canUndo}
              aria-label="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Redo (Ctrl+Shift+Z)" position="bottom">
            <button
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={onRedo}
              disabled={!canRedo}
              aria-label="Redo"
            >
              <Redo className="w-4 h-4" />
            </button>
          </Tooltip>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Export
              </Button>
            }
            align="right"
          >
            <DropdownItem
              icon={<Download className="w-4 h-4" />}
              label="Export as PNG"
              onClick={onExportPNG}
            />
            <DropdownItem
              icon={<Download className="w-4 h-4" />}
              label="Export as JSON"
              onClick={onExportJSON}
            />
            <DropdownDivider />
            <DropdownItem
              icon={<Upload className="w-4 h-4" />}
              label="Import JSON"
              onClick={handleImportClick}
            />
          </Dropdown>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={() => setIsShareOpen(true)}
          >
            Share
          </Button>

          <Tooltip content={isPanelOpen ? 'Hide panel' : 'Show panel'} position="bottom">
            <button
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsPanelOpen((v) => !v)}
              aria-label={isPanelOpen ? 'Hide properties panel' : 'Show properties panel'}
            >
              {isPanelOpen
                ? <PanelRightClose className="w-4 h-4" />
                : <PanelRightOpen className="w-4 h-4" />
              }
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {leftToolbar && (
          <aside className="shrink-0 w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 z-10 overflow-y-auto">
            {leftToolbar}
          </aside>
        )}

        <div className="flex-1 relative overflow-hidden">
          {children}
          {bottomBar}
        </div>

        {rightPanel && isPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-[280px] bg-white border-l border-gray-200 overflow-y-auto shrink-0"
          >
            {rightPanel}
          </motion.aside>
        )}
      </div>

      {currentBoard && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          board={currentBoard}
          currentUser={user}
        />
      )}
    </div>
  );
}
