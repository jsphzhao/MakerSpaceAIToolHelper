import type { ToolExplanation } from "../types";

interface ToolResultsProps {
  result: ToolExplanation;
  imagePreview: string;
  onReadAloud: () => void;
  onStopSpeech: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  speechSupported: boolean;
}

const confidenceLabels = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence — verify with staff",
};

export function ToolResults({
  result,
  imagePreview,
  onReadAloud,
  onStopSpeech,
  isSpeaking,
  isPaused,
  onPause,
  onResume,
  speechSupported,
}: ToolResultsProps) {
  return (
    <article className="results" aria-labelledby="results-heading">
      <header className="results-header">
        <div className="results-title-row">
          <h2 id="results-heading">{result.toolName}</h2>
          <span
            className={`confidence-badge confidence-${result.confidence}`}
            role="status"
          >
            {confidenceLabels[result.confidence]}
          </span>
        </div>

        {speechSupported && (
          <div className="speech-controls" role="group" aria-label="Text to speech">
            {!isSpeaking ? (
              <button type="button" className="btn btn-primary" onClick={onReadAloud}>
                Read aloud
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button type="button" className="btn btn-secondary" onClick={onResume}>
                    Resume
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={onPause}>
                    Pause
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={onStopSpeech}>
                  Stop
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="results-grid">
        <figure className="preview-figure">
          <img src={imagePreview} alt={`Uploaded photo of ${result.toolName}`} />
          <figcaption>Your uploaded image</figcaption>
        </figure>

        <div className="results-content">
          <section aria-labelledby="desc-heading">
            <h3 id="desc-heading">What is it?</h3>
            <p>{result.description}</p>
          </section>

          <section className="safety-section" aria-labelledby="safety-heading">
            <h3 id="safety-heading">Safety warnings</h3>
            <ul>
              {result.safetyWarnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="steps-heading">
            <h3 id="steps-heading">How to use it</h3>
            <ol>
              {result.usageSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>

          {result.beginnerTips && (
            <section className="tips-section" aria-labelledby="tips-heading">
              <h3 id="tips-heading">Beginner tip</h3>
              <p>{result.beginnerTips}</p>
            </section>
          )}

          <p className="disclaimer" role="note">
            {result.disclaimer}
          </p>
        </div>
      </div>
    </article>
  );
}
