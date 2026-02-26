import {
  PanelLeftClose,
  LogOut,
  BookOpen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AuthUser } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { switchCase } from '../store/chatSlice';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user: AuthUser;
  onLogout: () => void;
}

export function Sidebar({ isOpen, toggleSidebar, user, onLogout }: SidebarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { cases, selectedCaseId } = useSelector((state: RootState) => state.chat);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed md:relative z-50 h-full bg-[#F9F9F8] border-r border-black/5 flex flex-col overflow-hidden',
          !isOpen && 'md:w-0 md:opacity-0 pointer-events-none'
        )}
      >
        <div className="p-4 flex flex-col h-full w-[280px]">
          <div className="flex items-center justify-between mb-6 px-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight">Sri</h1>
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <PanelLeftClose size={20} />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
              Legal cases
            </h3>
            <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {cases.map((item) => (
                <button
                  key={item.id}
                  onClick={() => dispatch(switchCase(item.id))}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-xl transition-colors text-sm flex items-center gap-2',
                    item.id === selectedCaseId
                      ? 'bg-white text-gray-900 shadow-sm border border-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-black/5'
                  )}
                >
                  <BookOpen size={15} className="shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-black/5">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-2 py-2 hover:bg-black/5 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#6B47ED] text-white flex items-center justify-center text-sm font-medium overflow-hidden">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <LogOut size={16} className="text-gray-400" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
