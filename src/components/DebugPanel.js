import { useState, useEffect, useRef } from 'react';
import { debugLog, getLogs, clearLogs, subscribe } from '../utils/debugLogger';

export default function DebugPanel() {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Initialize with current logs
    setLogs(getLogs());
    
    // Subscribe to new logs
    const unsubscribe = subscribe((newLogs) => {
      setLogs(newLogs);
      // Auto-scroll to top (newest log) when new logs arrive
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    });
    
    return unsubscribe;
  }, []);

  const handleClear = () => {
    clearLogs();
    debugLog("Debug logs cleared");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 right-2 z-[9999] bg-black/80 text-white text-xs px-3 py-1 rounded-full"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-black/90 border-t border-white/20" style={{ maxHeight: '150px' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0">
        <h3 className="text-white text-xs font-semibold">Debug Logs</h3>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="text-white/70 hover:text-white text-xs px-2 py-1 rounded bg-white/10 active:bg-white/20"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white text-xs px-2 py-1 rounded bg-white/10 active:bg-white/20"
          >
            Hide
          </button>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="overflow-y-auto flex-1" 
        style={{ maxHeight: 'calc(150px - 36px)' }}
      >
        {logs.length === 0 ? (
          <div className="text-white/50 text-xs px-3 py-2 text-center">No logs yet</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="text-white text-[10px] px-3 py-1 border-b border-white/5 font-mono whitespace-pre-wrap break-words"
            >
              <span className="text-white/60">[{log.timestamp}]</span>{' '}
              <span className="text-white/90">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

