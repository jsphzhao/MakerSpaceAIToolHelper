import { useCallback, useEffect, useState } from "react";
import { ImageUpload } from "./components/ImageUpload";
import { ToolResults } from "./components/ToolResults";
import { buildReadableScript, useSpeech } from "./hooks/useSpeech";
import { analyzeToolImage, fileToBase64 } from "./services/gemini";
import type { AnalysisState } from "./types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function App() {
  const [highContrast, setHighContrast] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [state, setState] = useState<AnalysisState>({ status: "idle" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  const { speak, stop, pause, resume, isSpeaking, isPaused, supported } =
    useSpeech();

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  const reset = useCallback(() => {
    stop();
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    if (state.imagePreview && state.imagePreview !== pendingPreview) {
      URL.revokeObjectURL(state.imagePreview);
    }
    setPendingFile(null);
    setPendingPreview(null);
    setState({ status: "idle" });
  }, [stop, pendingPreview, state.imagePreview]);

  const runAnalysis = useCallback(async (file: File, preview: string) => {
    if (file.size > MAX_FILE_SIZE) {
      setState({
        status: "error",
        error: "Image must be smaller than 10 MB.",
        imagePreview: preview,
      });
      return;
    }

    setState({ status: "loading", imagePreview: preview, fileName: file.name });

    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeToolImage(base64, file.type || "image/jpeg");
      setState({
        status: "success",
        result,
        imagePreview: preview,
        fileName: file.name,
      });
    } catch (err) {
      setState({
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        imagePreview: preview,
        fileName: file.name,
      });
    }
  }, []);

  const handleImageSelected = useCallback(
    (file: File, preview: string) => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingFile(file);
      setPendingPreview(preview);
      setState({
        status: "idle",
        imagePreview: preview,
        fileName: file.name,
      });
    },
    [pendingPreview]
  );

  const handleAnalyze = useCallback(() => {
    if (!pendingFile || !pendingPreview) return;
    void runAnalysis(pendingFile, pendingPreview);
  }, [pendingFile, pendingPreview, runAnalysis]);

  const handleReadAloud = useCallback(() => {
    if (!state.result) return;
    speak(buildReadableScript(state.result), { rate: speechRate });
  }, [state.result, speak, speechRate]);

  const isLoading = state.status === "loading";

  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              ⚙
            </span>
            <div>
              <h1>Makerspace Tool Explainer</h1>
              <p className="tagline">
                Identify tools by photo — get plain-language safety guidance
              </p>
            </div>
          </div>

          <div className="a11y-toolbar" role="group" aria-label="Accessibility options">
            <label className="toggle">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
              />
              High contrast
            </label>
            <label className="rate-control">
              <span>Speech speed</span>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={speechRate}
                onChange={(e) => setSpeechRate(Number(e.target.value))}
                aria-valuetext={`${speechRate.toFixed(2)}x`}
              />
            </label>
          </div>
        </div>
      </header>

      <main id="main" className="main">
        <ImageUpload
          onImageSelected={handleImageSelected}
          disabled={isLoading}
        />

        {state.imagePreview && state.status !== "success" && (
          <section className="preview-panel" aria-live="polite">
            <h2 className="sr-only">Selected image</h2>
            <img
              src={state.imagePreview}
              alt="Selected tool preview"
              className="selected-preview"
            />
            <div className="preview-actions">
              {state.status === "idle" && (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleAnalyze}
                  disabled={!pendingFile}
                >
                  Identify tool &amp; get guidance
                </button>
              )}
              {state.status === "loading" && (
                <div className="loading" role="status">
                  <span className="spinner" aria-hidden="true" />
                  Analyzing your image…
                </div>
              )}
              {state.status === "error" && (
                <>
                  <p className="error-message" role="alert">
                    {state.error}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAnalyze}
                  >
                    Try again
                  </button>
                </>
              )}
              <button type="button" className="btn btn-ghost" onClick={reset}>
                Choose a different image
              </button>
            </div>
          </section>
        )}

        {state.status === "success" && state.result && state.imagePreview && (
          <>
            <ToolResults
              result={state.result}
              imagePreview={state.imagePreview}
              onReadAloud={handleReadAloud}
              onStopSpeech={stop}
              isSpeaking={isSpeaking}
              isPaused={isPaused}
              onPause={pause}
              onResume={resume}
              speechSupported={supported}
            />
            <div className="new-analysis">
              <button type="button" className="btn btn-secondary" onClick={reset}>
                Analyze another tool
              </button>
            </div>
          </>
        )}
      </main>

      <footer className="site-footer">
        <p>
          CS311 — Accessible AI Tool Explainer for Makerspaces. AI output may be
          inaccurate; always follow official training and staff supervision.
        </p>
      </footer>
    </div>
  );
}
