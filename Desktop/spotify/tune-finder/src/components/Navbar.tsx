'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
    const { status } = useSession();
    const isLoggedIn = status === 'authenticated';

    return (
        <nav className="bg-gray-900 fixed top-0 left-0 right-0 z-10 border-b border-gray-700">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="text-xl font-bold text-green-400">SoundSphere</Link>
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/recommendations" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Recommender</Link>
                        <Link href="/top-tracks" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Top Tracks</Link>
                        <Link href="/top-artists" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Top Artists</Link>
                        <Link href="/top-genres" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium">Top Genres</Link>
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