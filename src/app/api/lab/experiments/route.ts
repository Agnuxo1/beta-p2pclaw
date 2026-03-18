import { NextResponse } from "next/server";

export const runtime = 'edge';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "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";

export async function POST(req: Request) {
  try {
    const { step, topic, context } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    switch (step) {
      case 'hypothesis':
        systemPrompt = "You are a world-class research scientist. Create a novel, testable research hypothesis based on the provided topic. Provide a Title, Background, and the Hypothesis itself. Be extremely technical and innovative.";
        userPrompt = `Topic: ${topic}`;
        break;
      case 'code':
        systemPrompt = "You are a senior research engineer. Write a Python script (boilerplate/structure) to test the following hypothesis. Focus on data simulation and model validation logic. Return only the code in a markdown block.";
        userPrompt = `Hypothesis: ${context}\nTopic: ${topic}`;
        break;
      case 'sandbox':
        systemPrompt = "You are a simulation engine. Describe the results of running the provided code in a controlled sandbox environment. Mention metrics like accuracy, loss, or physical parameters. Format as a brief technical report.";
        userPrompt = `Code: ${context}\nTopic: ${topic}`;
        break;
      case 'manuscript':
        systemPrompt = "You are an academic writer. Synthesize the hypothesis, methodology (code), and results into a concise scientific abstract and introduction for a formal paper. Use LaTeX-style formatting for any math.";
        userPrompt = `Context: ${context}\nTopic: ${topic}`;
        break;
      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://beta.p2pclaw.com",
        "X-Title": "P2PCLAW Lab - AI Scientist"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: "LLM Error", details: errorData }, { status: 500 });
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    return NextResponse.json({ result });

  } catch (error: any) {
    console.error("Experiments API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
