import { useCallback, useRef, useState } from "react";

interface ImageUploadProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  disabled?: boolean;
}

function canUseLiveCamera() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export function ImageUpload({ onImageSelected, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const liveCamera = canUseLiveCamera();

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const preview = URL.createObjectURL(file);
      onImageSelected(file, preview);
    },
    [onImageSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      alert(
        window.isSecureContext
          ? "Could not access camera. Check permissions or upload an image instead."
          : "Live camera preview requires HTTPS. Use Take photo or upload an image instead."
      );
    }
  }, []);

  const openCamera = useCallback(() => {
    if (cameraOpen) {
      stopCamera();
      return;
    }
    if (liveCamera) {
      void startCamera();
    } else {
      cameraInputRef.current?.click();
    }
  }, [cameraOpen, liveCamera, startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        stopCamera();
        handleFile(file);
      },
      "image/jpeg",
      0.92
    );
  }, [handleFile, stopCamera]);

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Add a photo of the tool</h2>
      <p className="upload-hint">
        Upload or take a clear photo of the makerspace tool. The AI will
        identify it and explain how to use it safely.
      </p>

      <div
        className={`drop-zone ${dragOver ? "drag-over" : ""} ${disabled ? "disabled" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drop image here or press Enter to browse files"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <span className="drop-icon" aria-hidden="true">
          📷
        </span>
        <span className="drop-text">
          Drag and drop an image, or <strong>click to browse</strong>
        </span>
        <span className="drop-formats">JPEG, PNG, WebP — max 10 MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="upload-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={openCamera}
          disabled={disabled}
        >
          {cameraOpen
            ? "Close camera"
            : liveCamera
              ? "Use camera"
              : "Take photo"}
        </button>
      </div>

      {cameraOpen && (
        <div className="camera-panel" role="region" aria-label="Camera capture">
          <video ref={videoRef} playsInline muted aria-hidden="true" />
          <canvas ref={canvasRef} className="sr-only" />
          <button
            type="button"
            className="btn btn-primary"
            onClick={capturePhoto}
          >
            Capture photo
          </button>
        </div>
      )}
    </section>
  );
}
