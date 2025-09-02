// File: src/app/home-client.tsx
'use client';

import React from 'react';

type HomeClientProps = {
  isLoggedIn: boolean;
};

// --- SVG ICONS ---
const TopTracksIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM18 16c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg> );
const TopArtistsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> );
const TopGenresIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg> );
const RecommendationsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> );

// --- Reusable Feature Card Component ---
interface FeatureCardProps { icon: React.ReactNode; title: string; description: string; href: string; isLoginRequired?: boolean; }
function FeatureCard({ icon, title, description, href, isLoginRequired = false }: FeatureCardProps) {
    return (
        <a href={href} className="bg-gray-800 p-6 rounded-lg h-full flex flex-col items-start hover:bg-gray-700 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg no-underline">
            {icon}
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 text-sm flex-grow">{description}</p>
            {isLoginRequired && ( <span className="mt-4 text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full">Login Required</span> )}
        </a>
    );
}

// --- Main Homepage UI Component ---
export default function HomeClient({}: HomeClientProps) {
    return (
        <div className="bg-gray-900">
            <div className="max-w-5xl mx-auto px-4">
                <header className="text-center py-12 sm:py-20 mb-8">
                    <h1 className="text-4xl sm:text-6xl font-bold text-green-400 tracking-tight">
                        Explore Your Music
                    </h1>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                        Discover new tracks with our smart music recommender or dive deep into your personal listening habits.
                    </p>
                </header>
                <main className="pb-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        <FeatureCard icon={<RecommendationsIcon />} title="Song Recommender" description="Search for a song and get a list of similar tracks to discover your next favorite hit." href="/recommendations" />
                        <FeatureCard icon={<TopTracksIcon />} title="Your Top Tracks" description="See the songs you've had on repeat. View your most-played tracks from the last month, 6 months, or all time." href="/top-tracks" isLoginRequired />
                        <FeatureCard icon={<TopArtistsIcon />} title="Your Top Artists" description="Discover the artists that have defined your sound. See who you've been listening to the most." href="/top-artists" isLoginRequired />
                        <FeatureCard icon={<TopGenresIcon />} title="Your Top Genres" description="Analyze your listening habits to find out which genres you listen to most frequently." href="/top-genres" isLoginRequired />
                    </div>
                </main>
            </div>
        </div>
    );
}