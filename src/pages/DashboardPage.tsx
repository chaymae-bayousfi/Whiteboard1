import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Clock } from 'lucide-react';
import { Button, Input, Modal, PageLoader } from '@/components/ui';
import { BoardCard, EmptyBoardsState } from '@/components/board';
import { useBoardStore, useUIStore } from '@/stores';
import { boardService } from '@/services';
import { formatDate } from '@/utils';
import type { Board, CreateBoardDto } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    boards,
    setBoards,
    addBoard,
    deleteBoard,
    updateBoard,
    recentBoards,
    updateRecentBoards,
  } = useBoardStore();
  const { addToast } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setIsLoading(true);
    try {
      const response = await boardService.getBoards();
      if (response.success) setBoards(response.data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to load boards',
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async (data: CreateBoardDto) => {
    try {
      const response = await boardService.createBoard(data);
      if (response.success && response.data) {
        addBoard(response.data);
        setIsCreateModalOpen(false);
        addToast({ type: 'success', title: 'Board created!' });
        navigate(`/board/${response.data.id}`);
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to create board' });
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedBoard) return;
    try {
      await boardService.deleteBoard(selectedBoard.id);
      deleteBoard(selectedBoard.id);
      setIsDeleteModalOpen(false);
      setSelectedBoard(null);
      addToast({ type: 'success', title: 'Board deleted' });
    } catch {
      addToast({ type: 'error', title: 'Failed to delete board' });
    }
  };

  const handleRenameBoard = async (title: string) => {
    if (!selectedBoard) return;
    try {
      await boardService.updateBoard(selectedBoard.id, { title });
      updateBoard(selectedBoard.id, { title });
      setIsRenameModalOpen(false);
      setSelectedBoard(null);
      addToast({ type: 'success', title: 'Board renamed' });
    } catch {
      addToast({ type: 'error', title: 'Failed to rename board' });
    }
  };

  const handleOpenBoard = (board: Board) => {
    updateRecentBoards(board);
    navigate(`/board/${board.id}`);
  };

  const filteredBoards = boards.filter(
    (board) =>
      board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Boards</h1>
          <p className="text-sm text-gray-500 mt-1">
            {boards.length} board{boards.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64 hidden sm:block">
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateModalOpen(true)}>
            New Board
          </Button>
        </div>
      </div>

      {recentBoards.length > 0 && boards.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Recent</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recentBoards.map((board) => (
              <motion.button
                key={board.id}
                whileHover={{ y: -2 }}
                className="flex-shrink-0 glass-card p-4 text-left w-48"
                onClick={() => handleOpenBoard(board)}
              >
                <h3 className="font-medium text-gray-800 truncate">{board.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(board.lastAccessedAt ?? board.updatedAt)}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {boards.length === 0 ? (
        <EmptyBoardsState onCreateBoard={() => setIsCreateModalOpen(true)} />
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No boards found</h3>
          <p className="text-gray-500">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBoards.map((board, index) => (
            <BoardCard
              key={board.id}
              board={board}
              index={index}
              onOpen={handleOpenBoard}
              onRename={(b) => { setSelectedBoard(b); setIsRenameModalOpen(true); }}
              onDelete={(b) => { setSelectedBoard(b); setIsDeleteModalOpen(true); }}
            />
          ))}
        </div>
      )}

      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateBoard}
      />

      <DeleteBoardModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedBoard(null); }}
        onConfirm={handleDeleteBoard}
        boardTitle={selectedBoard?.title ?? ''}
      />

      <RenameBoardModal
        isOpen={isRenameModalOpen}
        onClose={() => { setIsRenameModalOpen(false); setSelectedBoard(null); }}
        onSubmit={handleRenameBoard}
        initialTitle={selectedBoard?.title ?? ''}
      />
    </div>
  );
}

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBoardDto) => void;
}

function CreateBoardModal({ isOpen, onClose, onSubmit }: CreateBoardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    await onSubmit({ title: title.trim(), description: description.trim() || undefined });
    setIsSubmitting(false);
    setTitle('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create new board" description="Give your board a name to get started">
      <div className="space-y-4">
        <Input
          label="Board name"
          placeholder="Untitled Board"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <Input
          label="Description (optional)"
          placeholder="What's this board about?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!title.trim()} isLoading={isSubmitting}>
            Create board
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface DeleteBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  boardTitle: string;
}

function DeleteBoardModal({ isOpen, onClose, onConfirm, boardTitle }: DeleteBoardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete board" size="sm">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-800">{boardTitle}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1" isLoading={isDeleting}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface RenameBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  initialTitle: string;
}

function RenameBoardModal({ isOpen, onClose, onSubmit, initialTitle }: RenameBoardModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { setTitle(initialTitle); }, [initialTitle]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    await onSubmit(title.trim());
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename board" description="Enter a new name for your board">
      <div className="space-y-4">
        <Input
          placeholder="Board name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1" disabled={!title.trim()} isLoading={isSubmitting}>
            Rename
          </Button>
        </div>
      </div>
    </Modal>
  );
}
