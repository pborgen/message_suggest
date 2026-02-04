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

// Placeholder implementation. Swap this out with your local GPU inference.
function generateFromPrompt(prompt: string) {
  const json = {
    short: ["Sounds good", "Yep", "Let’s do it"],
    long: "Sounds good to me—let’s go with that plan."
  };

  return JSON.stringify(json);
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/generate", (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { prompt } = parsed.data;
  const generated_text = generateFromPrompt(prompt);
  return res.json({ generated_text });
});

app.listen(PORT, () => {
  console.log(`local-model listening on :${PORT}`);
});
