import { useState } from "react";
import { getSampleDataForCode, analyzeWithGroq } from "../services/groqService";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export function useCompiler() {
  const [phases, setPhases] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const analyzeCode = async (code) => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);
    setPhases(null);

    if (GROQ_API_KEY && GROQ_API_KEY !== "undefined") {
      try {
        const result = await analyzeWithGroq(code);
        setPhases(result);
        setUsingFallback(false);
      } catch (err) {
        console.error("Groq API failed, using local parser:", err);
        setUsingFallback(true);
        try {
          const localResult = getSampleDataForCode(code);
          setPhases(localResult);
        } catch (localErr) {
          setError("Local parser also failed: " + localErr.message);
        }
      }
    } else {
      try {
        const localResult = getSampleDataForCode(code);
        setPhases(localResult);
        setUsingFallback(true);
      } catch (err) {
        setError("Local parser failed: " + err.message);
      }
    }

    setLoading(false);
  };

  return { phases, loading, error, analyzeCode, usingFallback };
}
