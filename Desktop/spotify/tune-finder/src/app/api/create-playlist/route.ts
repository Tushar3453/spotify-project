import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_BASE = `https://api.spotify.com/v1`;

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken || !token.sub) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const { tracks, timeRange } = await req.json();

    if (!tracks || tracks.length === 0) {
        return NextResponse.json({ error: 'No tracks provided' }, { status: 400 });
    }

    const userId = token.sub;

    try {
        const authHeader = {
            Authorization: `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
        };

        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        
        let titleRangeText = "All Time";
        let descriptionRangeText = "of All Time";

        if (timeRange === 'short_term') {
            titleRangeText = "Last 4 Weeks";
            descriptionRangeText = "from the Last 4 Weeks";
        } else if (timeRange === 'medium_term') {
            titleRangeText = "Last 6 Months";
            descriptionRangeText = "from the Last 6 Months";
        }
        
        const playlistName = `My Top Tracks ${date} (${titleRangeText})`;
        const description = `Your favorite tracks ${descriptionRangeText} as of ${date}. Created by TuneFinder.`;

        const createPlaylistResponse = await fetch(`${API_BASE}/users/${userId}/playlists`, {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({
                name: playlistName,
                description: description,
                public: false, 
            }),
        });

        if (!createPlaylistResponse.ok) {
            console.error("Spotify API Error (Create Playlist):", await createPlaylistResponse.text());
            throw new Error("Failed to create playlist");
        }

        const newPlaylist = await createPlaylistResponse.json();
        const playlistId = newPlaylist.id;

        const trackUris = tracks.map((track: { id: string }) => `spotify:track:${track.id}`);
        
        const addItemsResponse = await fetch(`${API_BASE}/playlists/${playlistId}/tracks`, {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({
                uris: trackUris,
            }),
        });

        if (!addItemsResponse.ok) {
            console.error("Spotify API Error (Add Items):", await addItemsResponse.text());
            throw new Error("Failed to add tracks to the new playlist");
        }

        return NextResponse.json({ 
            message: "Playlist created successfully!", 
            playlistUrl: newPlaylist.external_urls.spotify 
        });

    } catch (error) {
        console.error("Error in create-playlist route:", error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}