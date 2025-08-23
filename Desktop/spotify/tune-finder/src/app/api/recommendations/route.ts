import { NextRequest, NextResponse } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const geminiApiKey = process.env.GEMINI_API_KEY;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const API_BASE = `https://api.spotify.com/v1`;

type SongQuery = { songName: string; artistName: string };

// Helper to get Spotify Access Token
const getSpotifyAccessToken = async () => {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error("Failed to get Spotify access token");
    const data = await response.json();
    return data.access_token;
};

// Helper to format song data from Spotify
const formatSongData = (item: any) => {
    if (!item || !item.album || !item.artists || !item.artists.length || !item.album.release_date) return null;
    return {
        id: item.id,
        name: item.name,
        artist: item.artists.map((a: any) => a.name).join(', '),
        artistId: item.artists[0].id,
        albumArt: item.album.images[0]?.url,
        spotifyUrl: item.external_urls.spotify,
        releaseYear: parseInt(item.album.release_date.split('-')[0]),
    };
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trackName = searchParams.get('trackName');
    const artistName = searchParams.get('artistName');

    if (!trackName || !artistName) {
        return NextResponse.json({ error: 'Both trackName and artistName are required' }, { status: 400 });
    }

    try {
        // --- Step 1: Get Recommendations from Gemini ---
        const prompt = `Give me a list of 10 songs that are musically and thematically similar to '${trackName}' by '${artistName}'. Provide the response as a numbered list with only the song name and artist name, like "1. Song Name - Artist Name".`;
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!geminiResponse.ok) throw new Error("Failed to get response from Gemini");

        const geminiData = await geminiResponse.json();
        const recommendationsText = geminiData.candidates[0]?.content?.parts[0]?.text;

        if (!recommendationsText) {
            throw new Error("Gemini returned an empty response.");
        }

        // --- Step 2: Parse Gemini's Text Response ---
        const songQueries = recommendationsText
            .split('\n')
            .map((line: string) => {
                const match = line.match(/\d+\.\s*(.*?)\s*-\s*(.*)/);
                return match ? { songName: match[1].trim(), artistName: match[2].trim() } : null;
            })
            .filter((q: SongQuery | null): q is SongQuery => q !== null);

        if (songQueries.length === 0) {
            return NextResponse.json([]);
        }

        // --- Step 3: Fetch Full Song Details from Spotify ---
        const spotifyAccessToken = await getSpotifyAccessToken();
        const authHeader = { Authorization: `Bearer ${spotifyAccessToken}` };

        // Explicitly typing 'query' here solves the implicit 'any' error in this block.
        const spotifySearchPromises = songQueries.map((query: { songName: string, artistName: string }) => {
            const searchQuery = `track:"${query.songName}" artist:"${query.artistName}"`;
            return fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`, { headers: authHeader })
                .then(res => res.ok ? res.json() : Promise.resolve(null))
                .then(data => data?.tracks?.items?.[0] || null)
                .catch(e => {
                    console.error(`Spotify search failed for "${query.songName}":`, e);
                    return null;
                });
        });

        const spotifyResults = await Promise.all(spotifySearchPromises);

        // --- Step 4: Format and Send Final Response ---
        const finalRecommendations = spotifyResults
            .filter(Boolean)
            .map(formatSongData)
            .filter(Boolean);

        return NextResponse.json(finalRecommendations);

    } catch (error) {
        console.error("Internal server error in recommendations route:", error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}
