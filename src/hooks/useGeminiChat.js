import { useState, useCallback, useRef } from 'react';

const API_URL = '/api/pengu-chat';

const SYSTEM_PROMPT = `You are **Pengu**, the AI penguin advisor inside *CityScape* — a real-time digital-twin city-builder that overlays a simulated Austin, TX on live ERCOT power-grid data.

Your expertise spans:
• Power-systems engineering (generation, transmission, demand-response, ERCOT market design)
• Urban planning & mixed-use zoning for Austin, TX
• Sustainable / resilient city design (energy, water, transit, green-space)
• Real-time grid operations: frequency regulation, capacity factors, renewable intermittency
• Economics: levelized cost of energy (LCOE), municipal budgets, ROI of infrastructure

PERSONALITY & STYLE
- Friendly, concise, game-coach tone — like a witty city-planning mentor
- Use short paragraphs & bullet points; bold key terms
- Reference the player's ACTUAL numbers (buildings placed, MW delta, budget, score, ERCOT live data) when they're provided in the context
- Give concrete, actionable advice: "Place 2 more wind farms in the NW chunk to offset that 180 MW data-center load"
- If the player's grid is in trouble (negative MW, low happiness, budget crunch), proactively warn and suggest fixes
- Keep answers under ~200 words unless the player asks for a deep dive

You receive a JSON snapshot of the player's current game state with every message. Use it to ground your answers.`;

export default function useGeminiChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef([]);

  const sendMessage = useCallback(async (userText, gameContext) => {
    const contextBlock = gameContext
      ? `\n\n<GAME_STATE>\n${JSON.stringify(gameContext, null, 2)}\n</GAME_STATE>`
      : '';
    const fullUserText = userText + contextBlock;

    const userMsg = { role: 'user', text: userText, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    historyRef.current = [
      ...historyRef.current,
      { role: 'user', content: fullUserText },
    ];

    setIsLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...historyRef.current,
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      const reply = json?.choices?.[0]?.message?.content?.trim() || 'Hmm, I didn\'t get a response. Try again!';

      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: reply },
      ];

      const botMsg = { role: 'bot', text: reply, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errMsg = { role: 'bot', text: `Error: ${err.message}`, ts: Date.now(), isError: true };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  return { messages, isLoading, sendMessage, clearHistory };
}
