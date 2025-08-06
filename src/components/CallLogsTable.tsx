import React, { useState } from 'react';
import { Phone, AlertCircle } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { TranscriptModal } from './TranscriptModal';
import { SearchFiltersComponent, SearchFilters, User } from './SearchFilters';
import { Pagination } from './Pagination';
import { safeJsonParse } from '@/lib/webhook-validation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export interface CallLog {
  id: string;
  call_id?: string;
  agent_id?: string;
  agent_name?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  duration_ms?: number;
  transcript?: string;
  call_record_url?: string;
  public_log_url?: string;
  disconnection_reason?: string;
  call_cost?: number;
  call_analysis?:
    | {
        call_summary?: string;
        [key: string]: unknown;
      }
    | string;
  from_number?: string;
  to_number?: string;
  direction?: 'inbound' | 'outbound';
  call_type?: 'inbound' | 'outbound';
  telephony_identifier?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export interface CallLogsTableProps {
  callLogs: CallLog[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onSearch?: (filters: SearchFilters) => void;
  isAdmin?: boolean;
  users?: User[];
}

export const CallLogsTable: React.FC<CallLogsTableProps> = ({
  callLogs,
  loading,
  error,
  pagination,
  onPageChange,
  onSearch,
  isAdmin = false,
  users = [],
}) => {
  // Modal state
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<string>('');

  // Audio state - simple state management
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<
    Record<string, HTMLAudioElement>
  >({});
  const [audioProgress, setAudioProgress] = useState<
    Record<string, { currentTime: number; duration: number }>
  >({});

  // Handle transcript modal
  const handleTranscriptClick = (transcript: string) => {
    setSelectedTranscript(transcript);
    setShowTranscriptModal(true);
  };

  const closeTranscriptModal = () => {
    setShowTranscriptModal(false);
    setSelectedTranscript('');
  };

  // Audio management functions
  const handleAudioToggle = (logId: string, audioUrl: string) => {
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

      // Create event handlers
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
        setAudioProgress(prev => ({
          ...prev,
          [logId]: {
            currentTime: audio.currentTime,
            duration: audio.duration,
          },
        }));
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
  };

  const handleAudioSeek = (logId: string, seekTime: number) => {
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
  };

  // Helper function to parse and format call cost
  const formatCallCost = (callCost: unknown): string => {
    if (!callCost) return '-';

    const costData =
      typeof callCost === 'string'
        ? safeJsonParse<{ combined_cost?: number }>(callCost, null)
        : callCost;

    if (
      costData &&
      typeof costData === 'object' &&
      'combined_cost' in costData &&
      typeof costData.combined_cost === 'number'
    ) {
      const dollars = costData.combined_cost / 100;
      return `$${dollars.toFixed(3)}`;
    }

    return '-';
  };

  // Helper function to get display text for transcript column
  const getTranscriptDisplayText = (log: CallLog): string => {
    if (log.call_analysis) {
      const analysisData =
        typeof log.call_analysis === 'string'
          ? safeJsonParse<{ call_summary?: string }>(log.call_analysis, null)
          : log.call_analysis;

      if (
        analysisData &&
        typeof analysisData === 'object' &&
        'call_summary' in analysisData &&
        typeof analysisData.call_summary === 'string'
      ) {
        return analysisData.call_summary;
      }
    }

    if (log.transcript) {
      return log.transcript;
    }

    return '-';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Call Records</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Filters */}
        <SearchFiltersComponent
          onSearch={onSearch || (() => {})}
          loading={loading}
          isAdmin={isAdmin}
          users={users}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-orange-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Loading call records...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Call Records Table */}
        {!loading && !error && (
          <>
            {callLogs.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No call records yet</p>
                <p className="text-gray-500 text-sm">
                  Call records will appear here once calls are made.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg">
                <Table>
                  <TableHeader className="bg-gray-50 rounded-t-lg [&_tr]:border-0">
                    <TableRow className="hover:bg-gray-50 border-0">
                      <TableHead className="w-[10%] text-xs text-gray-700 font-normal px-4 py-3">
                        Start Time
                      </TableHead>
                      <TableHead className="w-[10%] text-xs text-gray-700 font-normal px-4 py-3">
                        End Time
                      </TableHead>
                      <TableHead className="w-[10%] text-xs text-gray-700 font-normal px-4 py-3">
                        Duration
                      </TableHead>
                      <TableHead className="w-[10%] text-xs text-gray-700 font-normal px-4 py-3">
                        Type
                      </TableHead>
                      <TableHead className="w-[10%] text-xs text-gray-700 font-normal px-2 py-3 whitespace-nowrap">
                        Phone Number
                      </TableHead>
                      {isAdmin && (
                        <TableHead className="w-[12%] text-xs text-gray-700 font-normal px-2 py-3">
                          User
                        </TableHead>
                      )}
                      <TableHead className="w-[5%] text-xs text-gray-700 font-normal px-2 py-3">
                        Cost
                      </TableHead>
                      <TableHead className="text-xs text-gray-700 font-normal px-4 py-3">
                        Summary
                      </TableHead>
                      <TableHead className="w-[5%] text-xs text-gray-700 font-normal px-4 py-3">
                        Audio
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.map(log => (
                      <TableRow
                        key={log.id}
                        className="hover:bg-gray-50 border-0"
                      >
                        {/* Start Time */}
                        <TableCell className="text-[11px] text-gray-600 px-4 py-2 w-[10%]">
                          {log.start_timestamp
                            ? new Date(log.start_timestamp).toLocaleString(
                                'en-US',
                                {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                }
                              )
                            : '-'}
                        </TableCell>

                        {/* End Time */}
                        <TableCell className="text-[11px] text-gray-600 px-4 py-2 w-[10%]">
                          {log.end_timestamp
                            ? new Date(log.end_timestamp).toLocaleString(
                                'en-US',
                                {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                }
                              )
                            : '-'}
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="text-[11px] text-gray-600 px-4 py-2 w-[10%]">
                          {log.duration_ms
                            ? `${(log.duration_ms / 1000).toFixed(3)}s`
                            : '-'}
                        </TableCell>

                        {/* Call Type */}
                        <TableCell className="px-4 py-2 w-[10%]">
                          <div className="text-[11px] font-medium text-gray-900">
                            {log.direction || log.call_type || 'Unknown'}
                          </div>
                        </TableCell>

                        {/* Phone Number */}
                        <TableCell className="text-[11px] text-gray-900 px-2 py-2 w-[15%]">
                          {log.direction === 'inbound'
                            ? log.from_number
                            : log.direction === 'outbound'
                              ? log.to_number
                              : '-'}
                        </TableCell>

                        {/* User (Admin only) */}
                        {isAdmin && (
                          <TableCell className="text-[11px] text-gray-900 px-2 py-2">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {log.profiles?.full_name || 'Unknown User'}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {log.profiles?.email || log.user_id}
                              </span>
                            </div>
                          </TableCell>
                        )}

                        {/* Cost */}
                        <TableCell className="text-[11px] font-medium text-gray-900 px-2 py-2">
                          {formatCallCost(log.call_cost)}
                        </TableCell>

                        {/* Summary */}
                        <TableCell className="text-gray-600 px-4 py-2 max-w-0">
                          <div className="truncate">
                            {log.transcript ? (
                              <button
                                onClick={() =>
                                  handleTranscriptClick(log.transcript!)
                                }
                                className="text-[11px] text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors truncate block w-full"
                                title={getTranscriptDisplayText(log)}
                              >
                                {getTranscriptDisplayText(log)}
                              </button>
                            ) : (
                              <span
                                className="text-[11px] truncate block w-full"
                                title={getTranscriptDisplayText(log)}
                              >
                                {getTranscriptDisplayText(log)}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Audio Controls */}
                        <TableCell className="px-4 py-2">
                          <AudioPlayer
                            logId={log.id}
                            audioUrl={log.call_record_url || ''}
                            isPlaying={playingAudio === log.id}
                            progress={audioProgress[log.id]}
                            onToggle={handleAudioToggle}
                            onSeek={handleAudioSeek}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={onPageChange}
              loading={loading}
            />
          </>
        )}

        {/* Transcript Modal */}
        <TranscriptModal
          isOpen={showTranscriptModal}
          transcript={selectedTranscript}
          onClose={closeTranscriptModal}
        />
      </CardContent>
    </Card>
  );
};
