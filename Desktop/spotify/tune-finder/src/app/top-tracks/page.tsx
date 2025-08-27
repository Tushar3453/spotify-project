'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

// --- TYPESCRIPT INTERFACE ---
interface Track {
    rank: number;
    id: string;
    name: string;
    artist: string;
    albumArt: string;
    spotifyUrl: string;
}

// --- SVG ICON ---
const SpotifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.498.498 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 9.764 1.355a.75.75 0 0 1-.615 1.29z"/>
    </svg>
);


// --- Main Top Tracks Page Component ---
export default function TopTracksPage() {
    type TimeRange = 'short_term' | 'medium_term' | 'long_term';
    
    const { data: session, status } = useSession();
    const [activeRange, setActiveRange] = useState<TimeRange>('short_term');
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Sirf tabhi data fetch karein jab user logged in ho
        if (status === 'authenticated') {
            setIsLoading(true);
            
            // calling api
            fetch(`/api/top-tracks?time_range=${activeRange}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch top tracks");
                }
                return res.json();
            })
            .then(data => {
                setTracks(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Error fetching top tracks:", error);
                setIsLoading(false);
            });
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [activeRange, status]);

    const TimeRangeButton = ({ range, label }: { range: TimeRange; label: string }) => (
        <button
            onClick={() => setActiveRange(range)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                activeRange === range 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
            {label}
        </button>
    );
    
    if (status === 'loading') {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading session...</div>;
    }

    // if not logged in
    if (status === 'unauthenticated') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                <p className="text-gray-400 mb-8 max-w-md">Please login with Spotify to see your top tracks. Your data is only used to display your stats and is not stored.</p>
                <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg">
                    Login with Spotify
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Top Tracks</h1>
                    <p className="text-gray-400 mt-2">The songs you’ve had on repeat.</p>
                </header>

                <div className="flex justify-center items-center gap-4 mb-8">
                    <TimeRangeButton range="short_term" label="Last 4 Weeks" />
                    <TimeRangeButton range="medium_term" label="Last 6 Months" />
                    <TimeRangeButton range="long_term" label="All Time" />
                </div>

                <main>
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Loading your tracks...</div>
                    ) : (
                        <div className="space-y-3">
                            {tracks.map((track) => (
                                <div key={track.id} className="flex items-center bg-gray-800/50 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                                    <span className="text-gray-400 text-lg font-bold w-8 text-center">{track.rank}</span>
                                    <img src={track.albumArt} alt={track.name} className="w-12 h-12 rounded-md mx-4 object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold text-white">{track.name}</p>
                                        <p className="text-sm text-gray-400">{track.artist}</p>
                                    </div>
                                    <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer" className="ml-4 p-2 text-gray-400 hover:text-white transition-colors">
                                        <SpotifyIcon />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
