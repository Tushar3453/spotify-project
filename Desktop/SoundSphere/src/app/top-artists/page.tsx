'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';

// --- TYPESCRIPT INTERFACE ---
interface Artist {
    rank: number;
    id: string;
    name: string;
    imageUrl: string;
    spotifyUrl: string;
}


// --- Main Top Artists Page Component ---
export default function TopArtistsPage() {
    type TimeRange = 'short_term' | 'medium_term' | 'long_term';
    
    const { status } = useSession();
    const [activeRange, setActiveRange] = useState<TimeRange>('short_term');
    const [artists, setArtists] = useState<Artist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            setIsLoading(true);
            fetch(`/api/top-artists?time_range=${activeRange}`)
            .then(res=>{
                if(!res.ok) throw new Error("Failed to fetch top artists");
                return res.json();
            })
            .then(data=>{
                setArtists(data);
                setIsLoading(false);
            })
            .catch(error=>{
                console.log("Error fetching top artists: ",error);
                setIsLoading(false);
            });
        } else if(status==='unauthenticated'){
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

    if (status === 'unauthenticated') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                <p className="text-gray-400 mb-8 max-w-md">Please login with Spotify to see your top artists.</p>
                <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg">
                    Login with Spotify
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-20">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Top Artists</h1>
                    <p className="text-gray-400 mt-2">The artists that have defined your sound.</p>
                </header>

                <div className="flex justify-center items-center gap-4 mb-8">
                    <TimeRangeButton range="short_term" label="Last 4 Weeks" />
                    <TimeRangeButton range="medium_term" label="Last 6 Months" />
                    <TimeRangeButton range="long_term" label="All Time" />
                </div>

                <main>
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Loading your artists...</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                            {artists.map((artist) => (
                                <a key={artist.id} href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer" className="group block bg-gray-800 rounded-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                                    <div className="relative pt-[100%]"> {/* 1:1 Aspect Ratio */}
                                        <Image src={artist.imageUrl} alt={artist.name} fill className="object-cover" />
                                    </div>
                                    <div className="p-4">
                                        <p className="font-bold text-white truncate group-hover:text-green-400 transition-colors">{artist.rank}. {artist.name}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}