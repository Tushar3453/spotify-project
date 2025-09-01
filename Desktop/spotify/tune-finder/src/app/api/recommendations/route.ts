import { NextRequest, NextResponse } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const API_BASE = `https://api.spotify.com/v1`;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

// Type for the queries we build
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

// Helper function to shuffle an array
function shuffleArray(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const trackName = searchParams.get('trackName');
    const artistName = searchParams.get('artistName');
    const artistId = searchParams.get('artistId');
    const releaseYearParam = searchParams.get('releaseYear');

    if (!trackName || !artistName || !artistId || !releaseYearParam) {
        return NextResponse.json({ error: 'All parameters are required' }, { status: 400 });
    }

    try {
        let songQueries: SongQuery[] = [];
        const primaryArtist = artistName.split(',')[0].trim(); // Use only the first artist for Last.fm

        // --- Plan A: Try Last.fm First ---
        const lastFmUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(primaryArtist)}&track=${encodeURIComponent(trackName)}&limit=50&api_key=${LASTFM_API_KEY}&format=json`;
        const fmResponse = await fetch(lastFmUrl);
        if (fmResponse.ok) {
            const fmData = await fmResponse.json();
            if (fmData.similartracks?.track?.length > 0) {
                console.log("Successfully fetched from Last.fm");
                songQueries = fmData.similartracks.track.map((track: any) => ({
                    songName: track.name,
                    artistName: track.artist.name,
                }));
            }
        }

        const spotifyAccessToken = await getSpotifyAccessToken();
        const authHeader = { Authorization: `Bearer ${spotifyAccessToken}` };
        
        // --- Plan B: If Last.fm fails, use Spotify Genre Search ---
        if (songQueries.length === 0) {
            console.log("Last.fm failed. Using Spotify Genre Fallback.");
            const artistResponse = await fetch(`${API_BASE}/artists/${artistId}`, { headers: authHeader });
            if (artistResponse.ok) {
                const artistData = await artistResponse.json();
                if (artistData.genres?.length > 0) {
                    const genre = artistData.genres[0];
                    const originalYear = parseInt(releaseYearParam);
                    const startYear = originalYear - 7;
                    const endYear = new Date().getFullYear();
                    const searchQuery = `genre:"${genre}" year:${startYear}-${endYear}`;
                    const marketQuery = artistData.genres.some((g: string) => g.includes('filmi') || g.includes('desi')) ? '&market=IN' : '';

                    const searchResponse = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=50&offset=${Math.floor(Math.random() * 201)}${marketQuery}`, { headers: authHeader });
                    if (searchResponse.ok) {
                        const searchData = await searchResponse.json();
                        songQueries = searchData.tracks.items.map((track: any) => ({
                            songName: track.name,
                            artistName: track.artists[0].name
                        }));
                    }
                }
            }
        }

        if (songQueries.length === 0) {
             console.log("All methods failed. Returning empty.");
             return NextResponse.json([]);
        }

        // --- Final Step: Fetch details from Spotify ---
        const spotifySearchPromises = songQueries.map(query => {
            const searchQuery = `track:"${query.songName}" artist:"${query.artistName}"`;
            return fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=1`, { headers: authHeader })
                .then(res => res.ok ? res.json() : null)
                .then(data => data?.tracks?.items?.[0] || null)
                .catch(() => null);
        });

        const spotifyResults = await Promise.all(spotifySearchPromises);
        const finalRecommendations = spotifyResults.filter(Boolean).map(formatSongData).filter(Boolean);
        
        return NextResponse.json(shuffleArray(finalRecommendations).slice(0, 10));

    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}
