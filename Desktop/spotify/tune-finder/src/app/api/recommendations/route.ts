import { NextRequest, NextResponse } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const API_BASE = `https://api.spotify.com/v1`;
const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

// Define a type for our clean song object for better type safety
interface Song {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
    spotifyUrl: string;
    releaseYear: number;
}

// Helper function to shuffle an array
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const getAccessToken = async () => {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error("Failed to get access token");
    return response.json();
};

// Helper to format song data safely
const formatSongData = (item: any): Song | null => {
    const track = item.track ? item.track : item;
    if (!track || !track.album || !track.artists || track.artists.length === 0 || !track.album.release_date) return null;

    return {
        id: track.id,
        name: track.name,
        artist: track.artists.map((_artist: any) => _artist.name).join(', '),
        albumArt: track.album.images[0]?.url,
        spotifyUrl: track.external_urls.spotify,
        releaseYear: parseInt(track.album.release_date.split('-')[0]),
    };
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trackName = searchParams.get('trackName');
    const artistName = searchParams.get('artistName');

    if (!trackName || !artistName) {
        return NextResponse.json({ error: 'Both trackName and artistName are required' }, { status: 400 });
    }

    const prompt = `Give me a list of 10 songs that are musically and thematically similar to '${trackName}' by '${artistName}'. Provide the response as a numbered list with only the song name and artist name, like "1. Song Name - Artist Name".`;
    const response = await fetch(`${geminiApiUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    const geminiData=await response.json();
    const recommendationsText = geminiData.candidates[0]?.content?.parts[0]?.text;

}
