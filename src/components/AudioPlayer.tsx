import React from 'react';
import { PlayIcon, PauseIcon } from './icons';

export interface AudioPlayerProps {
  logId: string;
  audioUrl: string;
  isPlaying: boolean;
  progress?: {
    currentTime: number;
    duration: number;
  };
  onToggle: (logId: string, audioUrl: string) => void;
  onSeek: (logId: string, seekTime: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  logId,
  audioUrl,
  isPlaying,
  progress,
  onToggle,
  onSeek,
}) => {
  if (!audioUrl) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progress?.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * progress.duration;
    onSeek(logId, seekTime);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progress?.duration) return;

    e.stopPropagation();
    const progressBar = e.currentTarget.parentElement!;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = progressBar.getBoundingClientRect();
      const moveX = Math.max(
        0,
        Math.min(moveEvent.clientX - rect.left, rect.width)
      );
      const percentage = moveX / rect.width;
      const seekTime = percentage * progress.duration;
      onSeek(logId, seekTime);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const progressPercentage = progress?.duration
    ? (progress.currentTime / progress.duration) * 100
    : 0;

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={() => onToggle(logId, audioUrl)}
        className={`p-1.5 rounded-full transition-colors ${
          isPlaying
            ? 'bg-orange-500 hover:bg-orange-600 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        title={isPlaying ? 'Pause call recording' : 'Play call recording'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      {/* Progress Bar - only show when currently playing */}
      {isPlaying && progress && (
        <div className="w-full max-w-16">
          <div
            className="relative w-full h-1 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Draggable handle */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity"
              style={{
                left: `${progressPercentage}%`,
                transform: 'translateX(-50%) translateY(-50%)',
              }}
              onMouseDown={handleMouseDown}
            />
          </div>
        </div>
      )}
    </div>
  );
};
