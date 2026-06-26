import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json());

  // API Health Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API endpoint for AI habit analytics
  app.post("/api/gemini/analyze-habits", async (req, res) => {
    try {
      const { habits, todayDate } = req.body;
      if (!habits || !Array.isArray(habits)) {
        res.status(400).json({ error: "Missing habits array" });
        return;
      }

      if (habits.length === 0) {
        res.json({
          metricsSummary: "No habits tracked yet. Create your first habit row to activate AI suggested insights!",
          insights: [
            {
              title: "Establish a baseline",
              description: "Begin tracking daily and custom behaviors to allow our analysis model to track streaks and consistency metrics.",
              impact: "High"
            }
          ],
          aiConsistencyRating: 0
        });
        return;
      }

      const habitsSummary = habits.map((h: any) => {
        // Summarize completion states over the past 30 days of history
        const historyEntries = Object.entries(h.history || {});
        const totalHistory = historyEntries.length;
        const totalCompleted = historyEntries.filter(([_, stat]) => stat === 'Done').length;
        const totalMissed = historyEntries.filter(([_, stat]) => stat === 'Missed').length;
        
        return {
          name: h.name,
          frequency: h.frequency,
          currentStreak: h.currentStreak || 0,
          longestStreak: h.longestStreak || 0,
          completionPercent: h.completionPercent || 0,
          createdDate: h.createdDate,
          totalTrackedDays: totalHistory,
          totalDaysCompleted: totalCompleted,
          totalDaysMissed: totalMissed
        };
      });

      const prompt = `Analyze the student's current habit matrix as of ${todayDate}.
Habits data:
${JSON.stringify(habitsSummary, null, 2)}

Provide structured, positive, highly action-oriented analytics, observations, and recommendations. Help them optimize their schedule and discipline. Focus on consistency gaps, habit pacing, and celebrate existing streaks.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an elite, encouraging behavior-design psychologist and student coach. Give high-impact, analytical suggestions based strictly on the provided habit data. Format all outputs so they represent professional, direct advice with a friendly modern tone.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              metricsSummary: {
                type: Type.STRING,
                description: "Overall synthesis of their custom and daily routines consistency."
              },
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Short descriptive title of the insight." },
                    description: { type: Type.STRING, description: "Detailed contextual feedback and action step." },
                    impact: { type: Type.STRING, description: "High, Medium, or Low" }
                  },
                  required: ["title", "description", "impact"]
                },
                description: "Array of exactly 3 granular recommendations."
              },
              aiConsistencyRating: {
                type: Type.INTEGER,
                description: "Overall calculated habit strength out of 100 based on streaks and frequency schedules."
              }
            },
            required: ["metricsSummary", "insights", "aiConsistencyRating"]
          }
        }
      });

      const text = response.text || "{}";
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.error("Gemini habits analysis endpoint failed:", err);
      res.status(500).json({ error: err.message || "Failed to analyze habits" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
