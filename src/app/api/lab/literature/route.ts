import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "artificial intelligence";
    
    // arXiv API URL - searching for the query in titles and abstracts
    // We limit to 10 results for the UI
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`;

    const response = await fetch(arxivUrl);
    
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch from arXiv" }, { status: 500 });
    }

    const xmlText = await response.text();

    // Simple regex-based XML parsing to avoid heavy dependencies on Edge
    // Extracting entries
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xmlText)) !== null) {
      const entryContent = match[1];
      
      const title = entryContent.match(/<title>([\s\S]*?)<\/title>/)?.[1].trim().replace(/\n/g, ' ') || "No Title";
      const summary = entryContent.match(/<summary>([\s\S]*?)<\/summary>/)?.[1].trim().replace(/\n/g, ' ') || "No Summary";
      const id = entryContent.match(/<id>([\s\S]*?)<\/id>/)?.[1] || "";
      const published = entryContent.match(/<published>([\s\S]*?)<\/published>/)?.[1] || "";
      
      // Extract first author
      const author = entryContent.match(/<author>\s*<name>([\s\S]*?)<\/name>/)?.[1] || "Unknown";

      entries.push({
        id,
        title,
        abstract: summary.substring(0, 300) + "...",
        author,
        date: new Date(published).toLocaleDateString(),
        url: id
      });
    }

    return NextResponse.json({ papers: entries });

  } catch (error: any) {
    console.error("Literature API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
