'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';

interface Track {
    rank: number;
    id: string;
    name: string;
    artist: string;
    albumArt: string;
    spotifyUrl: string;
    rankChange: 'up' | 'down' | 'same' | 'new';
}

interface HistoryItem {
    _id: string;
    lastUpdated: string;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export default function TopTracksPage() {
    const { data: session, status } = useSession();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeRange, setActiveRange] = useState<TimeRange>('short_term');

    const [historyDates, setHistoryDates] = useState<HistoryItem[]>([]);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string>(''); // Empty means "current"

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

    // Fetch available history snapshots
    const fetchHistoryDates = useCallback(() => {
        if (!session?.accessToken) return;

        fetch(`/api/top-tracks/history-dates?time_range=${activeRange}`, {
            headers: { 'Authorization': `Bearer ${session.accessToken}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHistoryDates(data);
            })
            .catch(err => console.error("History fetch error:", err));
    }, [activeRange, session?.accessToken]);

    // Initial load & when range changes
    useEffect(() => {
        if (status === 'authenticated') {
            setSelectedHistoryId(''); // Reset to current on range switch
            fetchHistoryDates();
        }
    }, [activeRange, status, fetchHistoryDates]);

    // Fetch Tracks (Live or History)
    useEffect(() => {
        if (status === 'authenticated' && session?.accessToken) {
            setIsLoading(true);
            setPlaylistUrl(null);

            let url = `/api/top-tracks?time_range=${activeRange}`;
            if (selectedHistoryId) {
                url += `&historyId=${selectedHistoryId}`;
            }

            fetch(url, {
                headers: { 'Authorization': `Bearer ${session.accessToken}` }
            })
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch tracks");
                    return res.json();
                })
                .then(data => setTracks(data))
                .catch(error => console.error("Track fetch error:", error))
                .finally(() => setIsLoading(false));
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [activeRange, selectedHistoryId, status, session?.accessToken]);

    const handleCreatePlaylist = async () => {
        if (tracks.length === 0 || !session?.accessToken) return;
        setIsCreatingPlaylist(true);
        setPlaylistUrl(null); // Reset previous URL if any

        try {
            const response = await fetch('/api/create-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    tracks: tracks,
                    timeRange: activeRange
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create playlist');
            }

            const data = await response.json();

            // Set the playlist URL from the backend response
            if (data.playlistUrl) {
                setPlaylistUrl(data.playlistUrl);
            }

            // Refresh history list since a new snapshot was just created
            fetchHistoryDates();

        } catch (error) {
            console.error("Playlist creation failed:", error);
        } finally {
            setIsCreatingPlaylist(false);
        }
    };

    const TimeRangeButton = ({ range, label }: { range: TimeRange; label: string }) => (
        <button
            onClick={() => setActiveRange(range)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeRange === range
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
        >
            {label}
        </button>
    );

    const getDropdownLabel = () => {
        if (!selectedHistoryId) return "Current Top Tracks";
        const item = historyDates.find(h => h._id === selectedHistoryId);
        if (item) {
            return `${new Date(item.lastUpdated).toLocaleDateString()} • ${new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return "Select History";
    };

    if (status === 'loading') {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading session...</div>;
    }

    if (status === 'unauthenticated') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                <p className="text-gray-400 mb-8 max-w-md">Please login with Spotify to see your top tracks.</p>
                <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg">
                    Login with Spotify
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen">
            <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-20">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Top Tracks</h1>
                    <p className="text-gray-400 mt-2">The songs you&apos;ve had on repeat.</p>
                </header>

                <div className="flex flex-col gap-6 mb-8">
                    {/* Time Range Selectors */}
                    <div className="flex justify-center items-center gap-4 flex-wrap">
                        <TimeRangeButton range="short_term" label="Last 4 Weeks" />
                        <TimeRangeButton range="medium_term" label="Last 6 Months" />
                        <TimeRangeButton range="long_term" label="All Time" />
                    </div>

                    {/* Controls: History Dropdown & Playlist Button */}
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-20">

                        {/* History Dropdown */}
                        <div className="relative w-72">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between bg-gray-800 text-white border border-gray-600 hover:border-green-500 px-4 py-2 rounded-full focus:outline-none transition-all"
                            >
                                <span className="truncate text-sm">{getDropdownLabel()}</span>
                                <svg className={`w-4 h-4 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                                    <div className="absolute top-full mt-2 w-full bg-gray-800 border border-gray-600 rounded-xl shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => { setSelectedHistoryId(''); setIsDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors border-b border-gray-700 flex items-center gap-2 ${selectedHistoryId === '' ? 'text-green-400 bg-gray-700/50' : 'text-white'}`}
                                        >
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Current Live Tracks
                                        </button>

                                        {historyDates.map((item) => (
                                            <button
                                                key={item._id}
                                                onClick={() => { setSelectedHistoryId(item._id); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-0 flex items-center gap-2 ${selectedHistoryId === item._id ? 'text-blue-400 bg-gray-700/50' : 'text-gray-300'}`}
                                            >
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                {new Date(item.lastUpdated).toLocaleDateString()} • {new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </button>
                                        ))}

                                        {historyDates.length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No history saved yet</div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleCreatePlaylist}
                            disabled={isCreatingPlaylist || tracks.length === 0 || selectedHistoryId !== ''}
                            className={`bg-blue-500 text-white font-bold py-2 px-6 rounded-full transition-colors 
                                ${selectedHistoryId !== ''
                                    ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                                    : 'hover:bg-blue-600'
                                }`}
                        >
                            {isCreatingPlaylist ? 'Saving...' : 'Create Playlist'}
                        </button>
                    </div>
                </div>

                {playlistUrl && (
                    <div className="bg-green-900 border border-green-500 text-green-200 px-4 py-3 rounded-lg relative text-center mb-6" role="alert">
                        <span className="block sm:inline">Playlist created successfully! </span>
                        <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-white">View on Spotify</a>
                    </div>
                )}

                <main>
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">
                            {selectedHistoryId ? 'Loading history...' : 'Loading live tracks...'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tracks.length > 0 ? tracks.map((track) => (
                                <div key={track.id} className="flex items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">

                                    {/* Ranking Indicator */}
                                    <div className="w-8 flex justify-center items-center mr-2">
                                        {track.rankChange === 'up' && (
                                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                                        )}
                                        {track.rankChange === 'down' && (
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                                        )}
                                        {track.rankChange === 'same' && (
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                        )}
                                        {track.rankChange === 'new' && (
                                            <span className="text-xs font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">NEW</span>
                                        )}
                                    </div>

                                    <span className="text-lg font-bold text-gray-400 w-6 text-center">{track.rank}</span>
                                    <Image src={track.albumArt} alt={`${track.name} art`} width={48} height={48} className="w-12 h-12 rounded-md mx-4 object-cover" />
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-white truncate">{track.name}</p>
                                        <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                                    </div>
                                    <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer" className="ml-4 text-green-400 hover:text-green-300 flex-shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.498.498 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 9.764 1.355a.75.75 0 0 1-.615 1.29z" />
                                        </svg>
                                    </a>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-gray-500">
                                    No tracks found.
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}