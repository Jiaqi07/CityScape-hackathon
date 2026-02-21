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
- Use short paragraphs and bullet points only; bold key terms when helpful
- Do NOT use markdown section headers (no ## or ###). Write as if you're talking.
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

    const placeholderBotMsg = { role: 'bot', text: '', ts: Date.now(), streaming: true };
    setMessages(prev => [...prev, placeholderBotMsg]);

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

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            const payload = trimmed.slice(6).trim();
            if (payload === '[DONE]') continue;
            if (!payload) continue;
            try {
              const json = JSON.parse(payload);
              const content = json?.choices?.[0]?.delta?.content;
              if (typeof content === 'string') {
                fullReply += content;
                setMessages(prev => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last?.streaming) next[next.length - 1] = { ...last, text: fullReply };
                  return next;
                });
              }
            } catch (parseErr) {
              console.warn('Failed to parse SSE chunk:', payload.slice(0, 100), parseErr.message);
            }
          }
        }
      }

      const reply = fullReply.trim() || "Hmm, I didn't get a response. Try again!";

      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: reply },
      ];

      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.streaming) next[next.length - 1] = { ...last, text: reply, streaming: false };
        return next;
      });
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.message.includes('JSON')
        ? 'Stream parsing error. Please try again.'
        : `Error: ${err.message}`;
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.streaming) next[next.length - 1] = { role: 'bot', text: errorMsg, ts: Date.now(), isError: true };
        else next.push({ role: 'bot', text: errorMsg, ts: Date.now(), isError: true });
        return next;
      });
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
