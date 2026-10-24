import { localApiOnly } from './local-api-guard.mjs';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
app.use('/api', localApiOnly(() => PORT));
  const PORT = 3000;

  // Increase limit for image uploads
  app.use(express.json({ limit: "50mb" }));

  // Chat API endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: messages,
        config: {
          systemInstruction: "You are ClutterClear AI, an expert professional organizer and interior designer. You help users declutter their spaces by analyzing photos they upload and providing specific, actionable, and gentle advice. Break down tasks into manageable steps. Be encouraging and focus on the psychological benefits of a tidy space. If the user provides an image, carefully analyze what is in the room and identify the primary sources of clutter.",
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
