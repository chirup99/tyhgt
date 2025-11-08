import { createContext, useContext, useState, ReactNode } from 'react';

interface AudioModeContextType {
  isAudioMode: boolean;
  setIsAudioMode: (mode: boolean) => void;
  selectedPosts: number[];
  togglePostSelection: (postId: number) => void;
  clearSelection: () => void;
}

const AudioModeContext = createContext<AudioModeContextType | undefined>(undefined);

export function AudioModeProvider({ children }: { children: ReactNode }) {
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

  const togglePostSelection = (postId: number) => {
    setSelectedPosts(prev => {
      if (prev.includes(postId)) {
        return prev.filter(id => id !== postId);
      } else if (prev.length < 5) {
        return [...prev, postId];
      }
      return prev;
    });
  };

  const clearSelection = () => {
    setSelectedPosts([]);
  };

  return (
    <AudioModeContext.Provider
      value={{
        isAudioMode,
        setIsAudioMode,
        selectedPosts,
        togglePostSelection,
        clearSelection
      }}
    >
      {children}
    </AudioModeContext.Provider>
  );
}

export function useAudioMode() {
  const context = useContext(AudioModeContext);
  if (!context) {
    throw new Error('useAudioMode must be used within AudioModeProvider');
  }
  return context;
}
