import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react';
import { AudioPlayer } from './AudioPlayer';

// Audio Context for sharing state across components
interface AudioContextType {
  playingAudio: string | null;
  audioProgress: Record<string, { currentTime: number; duration: number }>;
  audioElements: Record<string, HTMLAudioElement>;
  handleAudioToggle: (logId: string, audioUrl: string) => void;
  handleAudioSeek: (logId: string, seekTime: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

// Audio Provider Component
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<
    Record<string, HTMLAudioElement>
  >({});
  const [audioProgress, setAudioProgress] = useState<
    Record<string, { currentTime: number; duration: number }>
  >({});

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
        audio.removeEventListener('ended', () => {});
        audio.removeEventListener('error', () => {});
        audio.src = '';
        audio.load();
      });
      setPlayingAudio(null);
    };
  }, [audioElements]);

  // Audio playback management
  const handleAudioToggle = useCallback(
    (logId: string, audioUrl: string) => {
      // If this audio is currently playing, pause it
      if (playingAudio === logId) {
        const audio = audioElements[logId];
        if (audio) {
          audio.pause();
          setPlayingAudio(null);
        }
        return;
      }

      // Stop any currently playing audio
      if (playingAudio && audioElements[playingAudio]) {
        const currentAudio = audioElements[playingAudio];
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Clear the playing state
      setPlayingAudio(null);

      // Check if we already have an audio element for this logId
      let audio = audioElements[logId];

      if (!audio) {
        // Create new audio element only if it doesn't exist
        audio = new Audio(audioUrl);

        // Create event handlers with proper cleanup
        const handleEnded = () => {
          setPlayingAudio(current => (current === logId ? null : current));
          setAudioProgress(prev => ({
            ...prev,
            [logId]: { currentTime: 0, duration: prev[logId]?.duration || 0 },
          }));
        };

        const handleError = (e: Event) => {
          console.error('Audio error for', logId, ':', e);
          setPlayingAudio(current => (current === logId ? null : current));
        };

        const handleLoadedData = () => {
          setAudioProgress(prev => ({
            ...prev,
            [logId]: { currentTime: 0, duration: audio.duration },
          }));
        };

        const handleTimeUpdate = () => {
          // Only update if this audio is still the currently playing one
          setPlayingAudio(current => {
            if (current === logId) {
              setAudioProgress(prev => ({
                ...prev,
                [logId]: {
                  currentTime: audio.currentTime,
                  duration: audio.duration,
                },
              }));
            }
            return current;
          });
        };

        // Add event listeners
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadeddata', handleLoadedData);
        audio.addEventListener('timeupdate', handleTimeUpdate);

        // Store the new audio element
        setAudioElements(prev => ({
          ...prev,
          [logId]: audio,
        }));

        // Initialize progress
        setAudioProgress(prev => ({
          ...prev,
          [logId]: { currentTime: 0, duration: 0 },
        }));
      }

      // Reset to beginning if we're reusing an existing audio element
      audio.currentTime = 0;

      // Play the audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayingAudio(logId);
          })
          .catch(err => {
            console.error('Failed to play audio:', err);
            setPlayingAudio(null);
          });
      } else {
        setPlayingAudio(logId);
      }
    },
    [playingAudio, audioElements]
  );

  // Handle audio seeking
  const handleAudioSeek = useCallback(
    (logId: string, seekTime: number) => {
      const audio = audioElements[logId];
      if (audio) {
        audio.currentTime = seekTime;
        setAudioProgress(prev => ({
          ...prev,
          [logId]: {
            currentTime: seekTime,
            duration: prev[logId]?.duration || audio.duration,
          },
        }));
      }
    },
    [audioElements]
  );

  const contextValue: AudioContextType = {
    playingAudio,
    audioProgress,
    audioElements,
    handleAudioToggle,
    handleAudioSeek,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

// Hook to use audio context
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// AudioManager component that renders AudioPlayer
export interface AudioManagerProps {
  logId: string;
  audioUrl: string;
}

export const AudioManager: React.FC<AudioManagerProps> = ({
  logId,
  audioUrl,
}) => {
  const { playingAudio, audioProgress, handleAudioToggle, handleAudioSeek } =
    useAudio();

  return (
    <AudioPlayer
      logId={logId}
      audioUrl={audioUrl}
      isPlaying={playingAudio === logId}
      progress={audioProgress[logId]}
      onToggle={handleAudioToggle}
      onSeek={handleAudioSeek}
    />
  );
};
