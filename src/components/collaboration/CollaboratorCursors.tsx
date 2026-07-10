import { motion } from 'framer-motion';
import { cn, getInitials } from '@/utils';
import type { CollaboratorCursor } from '@/types';

interface CollabCursorsProps {
  cursors: CollaboratorCursor[];
  zoom: number;
  panX: number;
  panY: number;
  containerWidth: number;
  containerHeight: number;
}

export function CollabCursors({
  cursors,
  zoom,
  panX,
  panY,
  containerWidth,
  containerHeight,
}: CollabCursorsProps) {
  const screenX = (x: number) => x * zoom + panX;
  const screenY = (y: number) => y * zoom + panY;

  return (
    <>
      {cursors.map((cursor) => {
        const sx = screenX(cursor.x);
        const sy = screenY(cursor.y);

        if (sx < -50 || sx > containerWidth + 50 || sy < -50 || sy > containerHeight + 50) {
          return null;
        }

        return (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: sx,
              top: sy,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5"
              style={{ color: cursor.color }}
            >
              <path
                d="M5.5 4.5L18.5 12L11 14L8 21L5.5 4.5Z"
                fill="currentColor"
                fillOpacity="0.9"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <div
              className="absolute top-4 left-4 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.user.name}
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

interface OnlineUsersListProps {
  users: Array<{
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  }>;
  currentUserId?: string;
  maxVisible?: number;
}

export function OnlineUsersList({
  users,
  currentUserId,
  maxVisible = 4,
}: OnlineUsersListProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2">
      {visibleUsers.map((user) => (
        <div
          key={user.id}
          className={cn(
            'relative rounded-full ring-2 ring-white',
            'w-8 h-8 flex items-center justify-center text-xs font-semibold'
          )}
          style={{
            backgroundColor: user.color || `hsl(${users.indexOf(user) * 60}, 70%, 80%)`,
          }}
          title={user.name}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-gray-700">{getInitials(user.name)}</span>
          )}
          {user.id === currentUserId && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-xs font-medium text-gray-600">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    connecting: { color: 'bg-amber-400', text: 'Connecting...', pulse: true },
    connected: { color: 'bg-green-500', text: 'Connected', pulse: false },
    disconnected: { color: 'bg-red-500', text: 'Disconnected', pulse: false },
    reconnecting: { color: 'bg-amber-400', text: 'Reconnecting...', pulse: true },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100">
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full',
            config.color,
            config.pulse && 'animate-ping'
          )}
        />
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.color)} />
      </span>
      <span className="text-xs font-medium text-gray-600">{config.text}</span>
    </div>
  );
}
