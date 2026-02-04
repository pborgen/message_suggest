import express from "express";
import { z } from "zod";

const app = express();
app.use(express.json({ limit: "200kb" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const RequestSchema = z.object({
  prompt: z.string().min(1),
  max_new_tokens: z.number().optional(),
  temperature: z.number().optional()
});

async function generateFromPrompt(prompt: string) {
  const engine = (process.env.LOCAL_ENGINE || "llamacpp").toLowerCase();

  if (engine === "llamacpp") {
    const LLAMACPP_URL = process.env.LLAMACPP_URL || "http://localhost:8081/completion";

    const resp = await fetch(LLAMACPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        n_predict: 300,
        temperature: 0.7,
        stop: ["\n\n"]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`llama.cpp error: ${resp.status} ${errText}`);
    }

    const data = await resp.json();
    return data.content ?? data.text ?? "";
  }

  // Fallback mock
  const json = {
    short: ["Sounds good", "Yep", "Let’s do it"],
    long: "Sounds good to me—let’s go with that plan."
  };

  return JSON.stringify(json);
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/generate", async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const { prompt } = parsed.data;
    const generated_text = await generateFromPrompt(prompt);
    return res.json({ generated_text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Local model error" });
  }
});

app.listen(PORT, () => {
  console.log(`local-model listening on :${PORT}`);
});
