import express from "express";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer";
import path from "path";
import cors from "cors";
import OpenAI from "openai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // OpenAI Image Generation endpoint
  app.post("/api/openai/generate-image", async (req, res) => {
    try {
      const { prompt, model = "gpt-image-2", apiKey: reqKey, aspectRatio = "1:1" } = req.body;
      const apiKey = reqKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "OpenAI API key is missing. Please add your key in Studio Settings." });
      }

      const openai = new OpenAI({ apiKey });

      let size: "1024x1024" | "1792x1024" | "1024x1792" = "1024x1024";
      if (aspectRatio === "16:9") size = "1792x1024";
      else if (aspectRatio === "9:16") size = "1024x1792";

      let modelToUse = model;
      if (modelToUse !== "gpt-image-2" && modelToUse !== "dall-e-3" && modelToUse !== "dall-e-2") {
        modelToUse = "gpt-image-2";
      }

      try {
        const payload: any = {
          model: modelToUse,
          prompt: prompt.slice(0, 4000),
          n: 1,
          size: modelToUse === "dall-e-2" ? "1024x1024" : size,
        };
        
        const response = await openai.images.generate(payload);

        const b64 = response.data[0]?.b64_json;
        const url = response.data[0]?.url;
        
        if (b64) {
          return res.json({ imageUrl: `data:image/png;base64,${b64}` });
        } else if (url) {
          return res.json({ imageUrl: url });
        } else {
          throw new Error("No image data returned from OpenAI");
        }
      } catch (err: any) {
        // If gpt-image-2 is requested and errors, fallback to dall-e-3
        if (modelToUse === "gpt-image-2") {
          console.warn("gpt-image-2 request failed, falling back to dall-e-3:", err.message);
          const fallbackPayload: any = {
            model: "dall-e-3",
            prompt: prompt.slice(0, 4000),
            n: 1,
            size,
          };
          const fallbackResp = await openai.images.generate(fallbackPayload);
          
          const fallbackB64 = fallbackResp.data[0]?.b64_json;
          const fallbackUrl = fallbackResp.data[0]?.url;
          
          if (fallbackB64) {
            return res.json({ imageUrl: `data:image/png;base64,${fallbackB64}` });
          } else if (fallbackUrl) {
            return res.json({ imageUrl: fallbackUrl });
          }
        }
        throw err;
      }
    } catch (error: any) {
      console.error("OpenAI Image Error:", error);
      res.status(500).json({ error: error.message || "OpenAI Image generation failed" });
    }
  });

  // OpenAI Chat/Concepts endpoint
  app.post("/api/openai/generate-concepts", async (req, res) => {
    try {
      const { prompt, apiKey: reqKey, model = "gpt-4o" } = req.body;
      const apiKey = reqKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "OpenAI API key is missing. Please add your key in Studio Settings." });
      }

      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: model || "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert data visualizer and infographic conceptualizer. You must reply strictly in valid JSON matching this schema:
{
  "infographics": [
    {
      "title": "Short Title",
      "points": ["Point 1", "Point 2", "Point 3"],
      "imagePrompt": "Detailed visual description of infographic visual"
    }
  ]
}
Generate exactly 4 unique infographic concepts.`
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const text = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("OpenAI Concepts Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate concepts" });
    }
  });

  // OpenAI Chat endpoint
  app.post("/api/openai/chat", async (req, res) => {
    try {
      const { messages, apiKey: reqKey, model = "gpt-4o-mini" } = req.body;
      const apiKey = reqKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "OpenAI API key is required." });
      }

      const openai = new OpenAI({ apiKey });
      const formattedMessages = messages.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.text || m.content || ''
      }));

      const response = await openai.chat.completions.create({
        model: model || "gpt-4o-mini",
        messages: formattedMessages
      });

      res.json({ text: response.choices[0]?.message?.content || "" });
    } catch (error: any) {
      console.error("OpenAI Chat Error:", error);
      res.status(500).json({ error: error.message || "Chat failed" });
    }
  });

  app.post("/api/capture", async (req, res) => {
    const { url, count = 4 } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      const screenshots: string[] = [];
      const visited = new Set<string>();
      const toVisit = [url];
      
      const targetCount = Math.min(Math.max(parseInt(count), 4), 8);

      while (screenshots.length < targetCount && toVisit.length > 0) {
        const currentUrl = toVisit.shift()!;
        if (visited.has(currentUrl)) continue;
        
        visited.add(currentUrl);
        
        try {
          // Increased timeout to 60s and changed waitUntil to domcontentloaded to handle heavy SPAs
          await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
          
          // Hide scrollbars for cleaner screenshots
          await page.addStyleTag({ content: 'body { overflow: hidden !important; }' });
          
          // Wait a moment for animations and dynamic content to load
          await new Promise(r => setTimeout(r, 3000));
          
          const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 80 });
          const base64 = Buffer.from(screenshotBuffer).toString('base64');
          screenshots.push(`data:image/jpeg;base64,${base64}`);
          
          // If we need more, find internal links
          if (screenshots.length < targetCount) {
            const links = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('a'))
                .map(a => a.href)
                .filter(href => href.startsWith(window.location.origin) && !href.includes('#'));
            });
            
            // Add unique new links to the queue
            for (const link of links) {
              if (!visited.has(link) && !toVisit.includes(link)) {
                toVisit.push(link);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to capture ${currentUrl}:`, err);
        }
      }
      
      await browser.close();
      
      if (screenshots.length === 0) {
        return res.status(500).json({ error: "Failed to capture any screenshots" });
      }
      
      res.json({ screenshots });
    } catch (error: any) {
      console.error("Puppeteer error:", error);
      if (browser) await browser.close();
      res.status(500).json({ error: error.message || "Failed to capture screenshots" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
