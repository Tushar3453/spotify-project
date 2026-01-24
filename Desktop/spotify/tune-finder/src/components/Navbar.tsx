'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { status } = useSession();
    const pathname = usePathname(); // to highlight the current page
    const isLoggedIn = status === 'authenticated';

    const isActive = (path: string) => 
        pathname === path ? "text-white font-bold" : "text-gray-300 hover:text-white";

    return (
        <nav className="bg-gray-900 fixed top-0 left-0 right-0 z-50 border-b border-gray-700">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="text-xl font-bold text-green-400">SoundSphere</Link>
                    
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/recommendations" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/recommendations')}`}>Recommender</Link>
                        <Link href="/top-tracks" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/top-tracks')}`}>Top Tracks</Link>
                        <Link href="/top-artists" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/top-artists')}`}>Top Artists</Link>
                        <Link href="/top-genres" className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/top-genres')}`}>Top Genres</Link>
                        <Link href="/generate" className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/generate')}`}>
                           <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">AI</span>
                           <span className={pathname === '/generate' ? "text-purple-300 font-bold" : "text-gray-300 hover:text-purple-300"}>
                               Vibe Match
                           </span>
                        </Link>
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
            
            {/* Mobile Menu Link (Optional) */}
            <div className="md:hidden flex justify-center py-2 border-t border-gray-800 bg-gray-900/95 text-xs">
                <Link href="/generate" className="text-purple-400 font-bold">Try Vibe Match AI ✨</Link>
            </div>
        </nav>
    );
}