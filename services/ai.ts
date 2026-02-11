
import { GoogleGenAI } from "@google/genai";

export const generateExerciseVideo = async (prompt: string, onStatus: (status: string) => void): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onStatus("Initiating video generation...");
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `A high-quality fitness demonstration of: ${prompt}. Professional lighting, gym setting, clear movement.`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  onStatus("The AI is dreaming up your workout... This usually takes 1-2 minutes.");

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    // Re-instantiate to ensure freshest API key from environment if needed
    const aiPoll = new GoogleGenAI({ apiKey: process.env.API_KEY });
    operation = await aiPoll.operations.getVideosOperation({ operation: operation });
    
    // Random helpful messages for UX
    const messages = [
      "Still processing... quality takes time!",
      "Almost there, refining the movement...",
      "Finishing touches on the video...",
      "Generating frames for your exercise..."
    ];
    onStatus(messages[Math.floor(Math.random() * messages.length)]);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed - no URI returned.");

  onStatus("Downloading video...");
  const fetchResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await fetchResponse.blob();
  return URL.createObjectURL(blob);
};
