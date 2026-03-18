import { NextResponse } from "next/server";

export const runtime = 'edge';

// Fallback to the extracted key if not defined in Vercel
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "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";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beta.p2pclaw.com",
        "X-Title": "P2PCLAW Lab"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // Very fast and intelligent model
        messages: messages,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter Error:", errorData);
      return NextResponse.json({ error: "Failed to query LLM", details: errorData }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Lab API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
