import React, { useRef, useState } from "react";
import { pipeline } from "@xenova/transformers";

// Simple, standalone UI to classify feedback text using Xenova transformers.
// - Sentiment: POSITIVE/NEGATIVE with score
// - Category: Zero-shot classification across seeded complaint categories

const CANDIDATE_LABELS = [
  // Resolution
  "issue resolved successfully",
  "issue not resolved",

  // Response time
  "fast response time",
  "slow response time",

  // Staff attitude
  "helpful and professional staff",
  "rude or unhelpful staff",

  // Communication
  "clear and timely communication",
  "poor or missing communication",

  // Overall experience
  "overall satisfaction",
  "overall dissatisfaction",

  // Noise
  "unrelated or general feedback"
];


// Confidence threshold - if top category is below this, it's likely unrelated
const CONFIDENCE_THRESHOLD = 0.5;



export default function FeedbackClassifier() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [classification, setClassification] = useState(null);

  const sentimentRef = useRef(null);
  const classifierRef = useRef(null);

  async function ensurePipelines() {
    try {
      if (!sentimentRef.current) {
        // Lightweight, stable sentiment model
        sentimentRef.current = await pipeline(
          "sentiment-analysis",
          "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
        );
      }
      if (!classifierRef.current) {
        // Lightweight zero-shot model - proven to work well
        classifierRef.current = await pipeline(
          "zero-shot-classification",
          "Xenova/nli-deberta-v3-base"
        );
      }
    } catch (err) {
      console.error("Pipeline initialization error:", err);
      throw new Error(`Failed to load models: ${err.message}`);
    }
  }

  async function handleAnalyze(e) {
    e?.preventDefault();
    setError("");
    const input = text.trim();
    if (!input) {
      setError("Please enter feedback text.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      console.log("Starting analysis...");
      
      await ensurePipelines();
      console.log("Pipelines loaded successfully");

      const s = await sentimentRef.current(input);
      let sRes = Array.isArray(s) && s.length ? s[0] : null;
      
      if (sRes) {
        sRes = {
          ...sRes,
          label: sRes.label.toUpperCase()
        };
      }
      setSentiment(sRes);
      console.log("Sentiment analysis complete:", sRes);

      const z = await classifierRef.current(input, CANDIDATE_LABELS, {
        multi_label: false,
        hypothesis_template: "This feedback describes {}."
      });
      setClassification(z);
      console.log("Classification complete:", z);
    } catch (err) {
      console.error("Full error:", err);
      setError(`Error: ${err.message || 'Model load or inference failed. Please refresh and try again.'}`);
    } finally {
      setLoading(false);
    }
  }

  function formatPct(n) {
    return `${(n * 100).toFixed(1)}%`;
  }

  const topCategory =
    classification && classification.labels && classification.labels.length
      ? {
          label: classification.labels[0],
          score: classification.scores[0],
        }
      : null;

  // Check if feedback is likely unrelated (either "unrelated" is top, or top score is below threshold)
  const isNotRelated = topCategory && 
    (topCategory.label.includes("unrelated") || topCategory.score < CONFIDENCE_THRESHOLD);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Feedback Classifier (Xenova)</h1>
      <p className="text-sm text-gray-600 mb-4">
        Lightweight models optimized for browser. First load caches models locally (~30 seconds). Open browser console (F12) for details if errors occur.
      </p>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Feedback Text</span>
          <textarea
            className="mt-1 w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste feedback here..."
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </form>

      {/* Results */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4">
          <h2 className="text-lg font-medium mb-2">Sentiment</h2>
          {!sentiment ? (
            <p className="text-gray-500">No result yet.</p>
          ) : (
            <div className="space-y-2">
              <div className={`font-semibold ${
                sentiment.label === 'POSITIVE' ? 'text-green-600' :
                sentiment.label === 'NEGATIVE' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {sentiment.label} ({formatPct(sentiment.score)})
              </div>
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="text-lg font-medium mb-2">Category (Zero-shot)</h2>
          {!classification ? (
            <p className="text-gray-500">No result yet.</p>
          ) : (
            <div className="space-y-3">
              {topCategory && (
                <div>
                  <div className={`font-semibold ${
                    isNotRelated ? "text-orange-600" : ""
                  }`}>
                    Top: <span className="capitalize">{topCategory.label}</span> ({formatPct(topCategory.score)})
                  </div>
                  {isNotRelated && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                      ⚠️ This feedback appears to be unrelated or has low confidence. 
                      {topCategory.score < CONFIDENCE_THRESHOLD && !topCategory.label.includes("unrelated") && 
                        ` Consider categorizing as "Unrelated".`}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">All labels</h3>
                <ul className="text-sm space-y-1">
                  {classification.labels.map((label, i) => (
                    <li key={label} className={`flex justify-between ${
                      label.includes("unrelated") ? "font-medium text-orange-600" : ""
                    }`}>
                      <span className="capitalize">{label}</span>
                      <span className="text-gray-600">
                        {formatPct(classification.scores[i])}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border rounded p-4">
        <h2 className="text-lg font-medium mb-2">Labels Used</h2>
        <p className="text-sm text-gray-600">
          {CANDIDATE_LABELS.join(", ")}
        </p>
      </div>
    </div>
  );
}
