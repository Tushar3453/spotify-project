'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';

// --- TYPESCRIPT INTERFACE ---
interface Genre {
    name: string;
    count: number; // Is number se hum graph ki length decide karenge
}

// --- DUMMY DATA ---
const dummyGenres: Genre[] = [
    { name: 'Pop', count: 95 },
    { name: 'Dance Pop', count: 88 },
    { name: 'Modern Bollywood', count: 82 },
    { name: 'Filmi', count: 75 },
    { name: 'Hip Hop', count: 68 },
    { name: 'Indie Pop', count: 60 },
    { name: 'Rock', count: 55 },
    { name: 'Electronic', count: 45 },
    { name: 'R&B', count: 38 },
    { name: 'Sufi', count: 30 },
];


// --- Main Top Genres Page Component ---
export default function TopGenresPage() {
    const { data: session, status } = useSession();
    const [genres, setGenres] = useState<Genre[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Abhi ke liye, dummy data use kar rahe hain
        const timer = setTimeout(() => {
            setGenres(dummyGenres);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [status]);
    
    if (status === 'loading') {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading session...</div>;
    }

    if (status === 'unauthenticated') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                <p className="text-gray-400 mb-8 max-w-md">Please login with Spotify to see your top genres.</p>
                <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg">
                    Login with Spotify
                </button>
            </div>
        );
    }

    // Graph ke liye sabse zyaada count dhoondhein taaki hum percentage nikaal sakein
    const maxCount = Math.max(...genres.map(g => g.count), 0);

    return (
        <div className="bg-gray-900">
            <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-20">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Top Genres</h1>
                    <p className="text-gray-400 mt-2">The genres that shape your unique taste.</p>
                </header>

                <main>
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Analyzing your genres...</div>
                    ) : (
                        <div className="bg-gray-800/50 p-4 sm:p-6 rounded-lg">
                            <div className="space-y-4">
                                {genres.map((genre) => (
                                    <div key={genre.name} className="flex items-center gap-4">
                                        <p className="w-1/3 sm:w-1/4 text-right font-semibold text-gray-300 capitalize truncate">{genre.name}</p>
                                        <div className="w-2/3 sm:w-3/4 bg-gray-700 rounded-full h-6">
                                            <div 
                                                className="bg-gradient-to-r from-green-500 to-green-400 h-6 rounded-full flex items-center justify-end pr-3"
                                                style={{ width: `${(genre.count / maxCount) * 100}%` }}
                                            >
                                                <span className="text-xs font-bold text-black">{genre.count}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
