'use client'; 

import React, { useState, useEffect } from 'react';
import Image from "next/image";

// --- TYPESCRIPT INTERFACE ---
interface Song {
  id: string;
  name: string;
  artist: string;
  artistId:string;
  albumArt: string;
  spotifyUrl: string; 
  releaseYear: number;
}

// --- SVG ICONS ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const SpotifyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.498.498 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 9.764 1.355a.75.75 0 0 1-.615 1.29z"/>
    </svg>
);


// --- COMPONENTS ---
interface SearchResultItemProps {
  song: Song;
  onSelect: (song: Song) => void;
}

function SearchResultItem({ song, onSelect }: SearchResultItemProps) {
  return (
    <div className="flex items-center p-3 hover:bg-gray-600 rounded-md cursor-pointer" onClick={() => onSelect(song)}>
      <Image src={song.albumArt} alt={`${song.name} art`} width={40} height={40} className="w-10 h-10 rounded-sm mr-3 object-cover"/>
      <div>
        <p className="font-semibold text-white text-sm">{song.name}</p>
        <p className="text-xs text-gray-400">{song.artist}</p>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);

  useEffect(() => {
    if (searchQuery && !selectedSong) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(res => res.json())
          .then(data => setSearchResults(data))
          .catch(err => console.error("Search failed:", err))
          .finally(() => setIsLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedSong]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (selectedSong) {
        setSelectedSong(null);
        setShowRecommendations(false);
        setRecommendations([]);
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setSearchQuery(song.name);
    setSearchResults([]); 
  };

  const handleGenerateClick = () => {
    if (!selectedSong) return;
    setIsLoading(true);
    setShowRecommendations(true);
    fetch(`/api/recommendations?trackName=${selectedSong.name}&artistName=${selectedSong.artist}&artistId=${selectedSong.artistId}&releaseYear=${selectedSong.releaseYear}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => setRecommendations(data))
      .catch(err => console.error("Recommendations failed:", err))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-20">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-green-400">Songs You’ll Love</h1>
          <p className="text-gray-400 mt-2">Type a song, we’ll find you more.</p>
        </header>

        <div className="relative">
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
                    <input type="text" placeholder="Search for a song..." value={searchQuery} onChange={handleSearchChange} className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-green-400"/>
                </div>
                <button onClick={handleGenerateClick} disabled={!selectedSong} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Generate</button>
            </div>

            {searchResults.length > 0 && !selectedSong && (
                <div className="absolute top-full mt-2 w-full bg-gray-700 rounded-xl p-2 z-10 shadow-lg">
                    {isLoading ? <div className="text-center p-4">Loading...</div> : searchResults.map(song => <SearchResultItem key={song.id} song={song} onSelect={handleSelectSong} />)}
                </div>
            )}
        </div>

        {showRecommendations && (
          <main className="bg-gray-800 rounded-xl p-4 sm:p-6 mt-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Recommendations for <span className="text-green-400">{selectedSong?.name}</span></h2>
            <div className="space-y-2">
              {isLoading ? <div className="text-center py-10">Generating...</div> : recommendations.map(song => (
                <div key={song.id} className="flex items-center p-3 bg-gray-900/50 rounded-lg">
                   <Image src={song.albumArt} alt={`${song.name} art`} width={48} height={48} className="w-12 h-12 rounded-md mr-4 object-cover" />
                  <div>
                     <p className="font-semibold text-white">{song.name}</p>
                     <p className="text-sm text-gray-400">{song.artist}</p>
                  </div>
                  <a href={song.spotifyUrl} target="_blank" rel="noopener noreferrer" className="ml-auto bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full transition-colors">
                      <SpotifyIcon />
                  </a>
                </div>
              ))}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}