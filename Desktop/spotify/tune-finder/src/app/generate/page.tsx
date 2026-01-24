'use client';

import React, { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';

interface GeneratedTrack {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
    spotifyUrl: string;
    uri: string;
}

export default function GeneratePage() {
    const { data: session, status } = useSession();
    
    // Input & Results State
    const [prompt, setPrompt] = useState('');
    const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
    const [isGeneratingTracks, setIsGeneratingTracks] = useState(false);

    // Modal & Playlist State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [playlistName, setPlaylistName] = useState('');
    const [playlistDesc, setPlaylistDesc] = useState('');
    const [isAiNaming, setIsAiNaming] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

    // 1. Generate Tracks
    const handleGenerateTracks = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsGeneratingTracks(true);
        setTracks([]); 
        setPlaylistUrl(null);

        try {
            const res = await fetch('/api/ai/generate-tracks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();
            if (data.tracks) {
                setTracks(data.tracks);
            }
        } catch (error) {
            console.error("Error generating tracks:", error);
        } finally {
            setIsGeneratingTracks(false);
        }
    };

    // 2. Open Modal
    const openModal = () => {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        setPlaylistName(`${prompt} Mix (${date})`); 
        setPlaylistDesc(`A custom playlist based on the vibe: "${prompt}".`);
        setIsModalOpen(true);
    };

    // 3. AI Name Generator
    const generateAiDetails = async () => {
        setIsAiNaming(true);
        try {
            const res = await fetch('/api/ai/generate-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracks: tracks.slice(0, 15) }),
            });
            const data = await res.json();
            if (data.name) setPlaylistName(data.name);
            if (data.description) setPlaylistDesc(data.description);
        } catch (err) {
            console.error("AI Naming failed", err);
        } finally {
            setIsAiNaming(false);
        }
    };

    // 4. Create Playlist
    const handleCreatePlaylist = async () => {
        if (!session?.accessToken) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/create-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({
                    tracks: tracks,
                    timeRange: 'ai_generated', 
                    name: playlistName,
                    description: playlistDesc
                }),
            });
            const data = await res.json();
            if (data.playlistUrl) setPlaylistUrl(data.playlistUrl);
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'unauthenticated') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white text-center">
                <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full">
                    Login with Spotify
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <div className="max-w-4xl mx-auto px-4 py-10"> 
                
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Vibe Match AI
                    </h1>
                    <p className="text-gray-400 text-lg mb-8">Describe your mood, and let AI curate the perfect playlist.</p>
                    
                    {/* Search Bar */}
                    <form onSubmit={handleGenerateTracks} className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. 'Rainy night jazz in Tokyo' or 'Gym Phonk'"
                            className="w-full bg-gray-800/50 border border-gray-600 focus:border-purple-500 rounded-full py-4 px-8 text-lg outline-none transition-all shadow-xl placeholder-gray-500 backdrop-blur-sm"
                        />
                        <button 
                            type="submit"
                            disabled={isGeneratingTracks || !prompt}
                            className="absolute right-2 top-2 bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {isGeneratingTracks ? (
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            )}
                        </button>
                    </form>
                </div>

                {/* Playlist Success Message */}
                {playlistUrl && (
                    <div className="bg-green-900/40 border border-green-500/50 text-green-200 px-6 py-4 rounded-xl text-center mb-10 backdrop-blur-md animate-fadeIn">
                        Playlist created! <a href={playlistUrl} target="_blank" className="font-bold underline hover:text-white">Open in Spotify</a>
                    </div>
                )}

                {/* TRACKS LIST */}
                {tracks.length > 0 && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6 px-2">
                            <h3 className="text-xl font-bold text-gray-300">Generated Tracks</h3>
                            <button 
                                onClick={openModal}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-transform transform hover:scale-105 shadow-lg flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Save Playlist
                            </button>
                        </div>

                        <div className="space-y-3">
                            {tracks.map((track,index) => (
                                <div key={`${track.id}-${index}`} className="flex items-center p-3 bg-gray-800/40 border border-gray-700/30 rounded-xl hover:bg-gray-800 transition-colors group">
                                    
                                    {/* Album Art */}
                                    <div className="relative">
                                        <Image 
                                            src={track.albumArt} 
                                            alt={track.name} 
                                            width={56} 
                                            height={56} 
                                            className="w-14 h-14 rounded-md shadow-md object-cover" 
                                        />
                                        {/* Hover Overlay with Play Icon */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                             <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
                                        </div>
                                    </div>

                                    {/* Text Info */}
                                    <div className="ml-4 flex-grow min-w-0">
                                        <p className="font-bold text-white truncate text-lg group-hover:text-green-400 transition-colors">{track.name}</p>
                                        <p className="text-gray-400 truncate text-sm">{track.artist}</p>
                                    </div>

                                    {/* Spotify Icon Link */}
                                    <a 
                                        href={track.spotifyUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="ml-4 text-gray-500 hover:text-green-500 transition-colors p-2"
                                        title="Open in Spotify"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.498.498 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 9.764 1.355a.75.75 0 0 1-.615 1.29z" />
                                        </svg>
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Save Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Save Playlist</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Playlist Name</label>
                                    <button 
                                        onClick={generateAiDetails}
                                        disabled={isAiNaming}
                                        className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-md font-bold transition-all disabled:opacity-50"
                                    >
                                        {isAiNaming ? 'Thinking...' : '✨ Generate Name'}
                                    </button>
                                </div>
                                <input 
                                    value={playlistName}
                                    onChange={(e) => setPlaylistName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                <textarea 
                                    value={playlistDesc}
                                    onChange={(e) => setPlaylistDesc(e.target.value)}
                                    rows={3}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreatePlaylist}
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex justify-center items-center"
                            >
                                {isSaving ? 'Saving...' : 'Save to Spotify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}