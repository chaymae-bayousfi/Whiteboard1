import { motion } from 'framer-motion';
import { MoreVertical, Trash2, Edit2, Users, Globe, Lock } from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { AvatarGroup } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '../ui/Dropdown';
import type { Board } from '@/types';

interface BoardCardProps {
  board: Board;
  onOpen: (board: Board) => void;
  onRename: (board: Board) => void;
  onDelete: (board: Board) => void;
  index?: number;
}

export function BoardCard({ board, onOpen, onRename, onDelete, index = 0 }: BoardCardProps) {
  const collaborators = board.collaborators.map((c) => ({
    src: c.user.avatar,
    name: c.user.name,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      <div
        onClick={() => onOpen(board)}
        className={cn(
          'block cursor-pointer bg-white rounded-2xl border border-gray-100 overflow-hidden',
          'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blush-400/50'
        )}
        tabIndex={0}
        role="button"
        aria-label={`Open board: ${board.title}`}
      >
        <div className="relative aspect-[4/3] bg-gradient-to-br from-blush-50 to-lavender-50 overflow-hidden">
          {board.thumbnail ? (
            <img
              src={board.thumbnail}
              alt={board.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white/50 backdrop-blur-sm shadow-soft" />
            </div>
          )}

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Dropdown
              trigger={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              }
              align="right"
            >
              <DropdownItem
                icon={<Edit2 className="w-4 h-4" />}
                label="Rename"
                onClick={() => onRename(board)}
              />
              <DropdownDivider />
              <DropdownItem
                icon={<Trash2 className="w-4 h-4" />}
                label="Delete"
                variant="danger"
                onClick={() => onDelete(board)}
              />
            </Dropdown>
          </div>

          <div className="absolute bottom-3 left-3">
            {board.isPublic ? (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-600">
                <Globe className="w-3 h-3" />
                Public
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-gray-600">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-800 truncate">{board.title}</h3>
          {board.description && (
            <p className="mt-1 text-sm text-gray-500 truncate">{board.description}</p>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              {collaborators.length > 0 ? (
                <AvatarGroup avatars={collaborators} size="sm" max={3} />
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  Just you
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {formatDate(board.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface EmptyBoardsProps {
  onCreateBoard: () => void;
}

export function EmptyBoardsState({ onCreateBoard }: EmptyBoardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-32 h-32 mb-6 rounded-3xl bg-gradient-to-br from-blush-100 to-lavender-100 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-blush-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">No boards yet</h3>
      <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
        Create your first board and start collaborating with your team in real-time
      </p>
      <Button onClick={onCreateBoard}>
        Create your first board
      </Button>
    </motion.div>
  );
}
