import express from "express";
import OpenAI from "openai";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "200kb" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MODEL_PROVIDER = (process.env.MODEL_PROVIDER || "openai").toLowerCase();

const RequestSchema = z.object({
  text: z.string().min(1).max(8000),
  tone: z.enum(["polite", "direct", "funny"]).default("polite")
});

const ResponseSchema = z.object({
  short: z.array(z.string()).min(3),
  long: z.string().min(1)
});

async function generateWithOpenAI(text: string, tone: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system =
    "You generate SMS/iMessage replies. Return ONLY valid JSON with keys: short (array of 3 strings) and long (string). Do not include extra text.";
  const user = `Tone: ${tone}\nConversation:\n${text}`;

  const completion = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.7
  });

  const output = completion.output_text || "";
  return JSON.parse(output);
}

async function generateWithHuggingFace(text: string, tone: string) {
  const HF_API_KEY = process.env.HF_API_KEY;
  const HF_MODEL = process.env.HF_MODEL; // e.g. meta-llama/Llama-3.1-8B-Instruct

  if (!HF_API_KEY || !HF_MODEL) {
    throw new Error("HF_API_KEY and HF_MODEL are required for MODEL_PROVIDER=hf");
  }

  const prompt = `You generate SMS/iMessage replies. Return ONLY valid JSON with keys: short (array of 3 strings) and long (string). Do not include extra text.\nTone: ${tone}\nConversation:\n${text}`;

  const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 300, temperature: 0.7 }
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`HF error: ${resp.status} ${errText}`);
  }

  const data = await resp.json();

  // HF can return an array of { generated_text } or plain string depending on model.
  const raw = Array.isArray(data)
    ? (data[0]?.generated_text ?? "")
    : (data.generated_text ?? data.text ?? "");

  return JSON.parse(raw);
}

app.post("/suggest", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { text, tone } = parsed.data;

  try {
    const json = MODEL_PROVIDER === "hf"
      ? await generateWithHuggingFace(text, tone)
      : await generateWithOpenAI(text, tone);

    const validated = ResponseSchema.safeParse(json);
    if (!validated.success) {
      return res.status(502).json({ error: "Invalid JSON shape" });
    }

    return res.json(validated.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`message-suggest backend listening on :${PORT} (provider=${MODEL_PROVIDER})`);
});
