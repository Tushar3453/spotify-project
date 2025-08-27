'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function Navbar() {
    const { data: session, status } = useSession();
    const isLoggedIn = status === 'authenticated';

    return (
        <nav className="bg-gray-900 fixed top-0 left-0 right-0 z-10 border-b border-gray-700">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <a href="/" className="text-xl font-bold text-green-400">TuneFinder</a>
                    <div className="hidden md:flex items-center space-x-4">
                        <a href="/recommendations" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Recommender</a>
                        <a href="/top-tracks" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Top Tracks</a>
                        <a href="/top-artists" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Top Artists</a>
                        <a href="/top-genres" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Top Genres</a>
                    </div>
                    {status === 'loading' ? (
                        <div className="w-20 h-8 bg-gray-700 rounded-full animate-pulse"></div>
                    ) : isLoggedIn ? (
                        <button onClick={() => signOut()} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-colors text-sm">
                            Logout
                        </button>
                    ) : (
                        <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors text-sm">
                            Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}