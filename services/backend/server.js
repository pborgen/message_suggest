import express from "express";
import OpenAI from "openai";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "200kb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PORT = process.env.PORT || 3000;

const RequestSchema = z.object({
  text: z.string().min(1).max(8000),
  tone: z.enum(["polite", "direct", "funny"]).default("polite")
});

const ResponseSchema = z.object({
  short: z.array(z.string()).min(3),
  long: z.string().min(1)
});

app.post("/suggest", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { text, tone } = parsed.data;

  const system = `You generate SMS/iMessage replies. Return ONLY valid JSON with keys: short (array of 3 strings) and long (string). Do not include extra text.`;
  const user = `Tone: ${tone}\nConversation:\n${text}`;

  try {
    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.7
    });

    const output = completion.output_text || "";
    let json;
    try {
      json = JSON.parse(output);
    } catch {
      return res.status(502).json({ error: "Model did not return valid JSON" });
    }

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
  console.log(`message-suggest backend listening on :${PORT}`);
});
