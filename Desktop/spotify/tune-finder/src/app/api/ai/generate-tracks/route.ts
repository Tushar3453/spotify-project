import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const SPOTIFY_SEARCH_API = 'https://api.spotify.com/v1/search'; 

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const { prompt } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        console.log(`🤖 Requesting Gemini for Vibe: ${prompt}`);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Act as a veteran music curator with deep knowledge of global and Indian music history.
                            
                            Task: List 15 distinct songs for the vibe: "${prompt}".

                            CRITICAL RULES:
                            1. **NO MULTIPLE REPEAT ARTISTS**: Every song must be by a DIFFERENT primary artist.
                             Same artist can work occasionally. Do not repeat any single name.
                            2. **CREDIT ACCURACY**: For Hindi songs, do NOT default to Arijit Singh.
                            Find the specific original singer (e.g., KK, Mohit Chauhan, Sonu Nigam, Shaan, Lucky Ali, Atif Aslam, Javed Ali).
                            3. **DIVERSITY**: Mix eras (90s, 2000s, 2020s) and styles if it fits the vibe.
                            4. **FORMAT**: " Only return Song Name - Artist Name" (No numbers, no bullets, just plain text lines).`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            throw new Error(data.error.message || "Gemini API Error");
        }

        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""; 

        // Parsing logic
        const songQueries = aiText
            .split('\n')
            .map((line: string) => line.replace(/^[\d\.\-\*\s]+/, '').trim())
            .filter((line: string) => line.includes('-') && line.length > 5)
            .slice(0, 15);

        if (songQueries.length === 0) throw new Error("Could not parse songs from AI response");
        console.log("🔍 Spotify Queries:", songQueries);

        // Spotify Search
        const spotifyPromises = songQueries.map(async (query: string) => {
            try {
                // Formatting query for better search
                const safeQuery = query.replace(/[^\w\s\-]/gi, '');
                
                const res = await fetch(`${SPOTIFY_SEARCH_API}?q=${encodeURIComponent(safeQuery)}&type=track&limit=1`, {
                    headers: { Authorization: `Bearer ${token.accessToken}` }
                });
                const spotifyData = await res.json();
                const track = spotifyData.tracks?.items?.[0];

                if (!track) return null;

                return {
                    id: track.id,
                    name: track.name,
                    artist: track.artists.map((a:any) => a.name).join(', '), // Showing all artists
                    albumArt: track.album.images[0]?.url,
                    spotifyUrl: track.external_urls.spotify,
                    uri: track.uri
                };
            } catch { return null; }
        });

        const tracks = (await Promise.all(spotifyPromises)).filter(Boolean);
        
        console.log(`🎉 Found ${tracks.length} unique tracks`);
        return NextResponse.json({ tracks });

    } catch (error: any) {
        console.error("❌ Final Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}