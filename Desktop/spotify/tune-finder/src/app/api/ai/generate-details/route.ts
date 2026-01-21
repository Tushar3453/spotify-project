import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const { tracks } = await req.json();
    const songList = tracks.slice(0, 15).map((t: any) => `${t.name} by ${t.artist}`).join(', ');

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const API_TOKEN = process.env.CLOUDFLARE_AI_TOKEN;

    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${API_TOKEN}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: "You are a creative music curator. Respond ONLY with a JSON object." },
                        { 
                            role: "user", 
                            content: `Based on these songs: ${songList}, generate a creative playlist name and only maximum of 12 words description. 
                            Keep it true to the songs. Return format: {"name": "...", "description": "..."}` 
                        }
                    ],
                }),
            }
        );

        const result = await response.json();
        
        // Cloudflare returns { result: { response: "..." } }
        // so parse the inner string as JSON
        const aiText = result.result.response;
        const cleanJson = aiText.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Cloudflare AI Error:", error);
        return NextResponse.json({ name: "My Vibe Mix", description: "A custom mix of my top tracks." });
    }
}