import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import {
  AlertTriangle,
  Download,
  ImagePlus,
  Palette,
  QrCode,
  RotateCcw,
  Shapes,
  Trash2,
  Type,
} from "lucide-react";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type DotType =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "classy-rounded"
  | "extra-rounded";
type CornerSquareType = "square" | "dot" | "extra-rounded";
type CornerDotType = "square" | "dot";
type TextPosition = "center" | "bottom-right" | "top-right" | "bottom-left" | "top-left";

type QrState = {
  data: string;
  size: number;
  margin: number;
  errorCorrection: ErrorCorrectionLevel;
  dotColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  cornerSquareColor: string;
  cornerDotColor: string;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  logoSize: number;
  logoMargin: number;
  hideLogoBackgroundDots: boolean;
  dotTextEnabled: boolean;
  dotText: string;
  dotTextPosition: TextPosition;
  dotTextSize: number;
  dotTextColor: string;
  dotTextRound: boolean;
};

const initialState: QrState = {
  data: "https://example.com",
  size: 768,
  margin: 22,
  errorCorrection: "H",
  dotColor: "#17212b",
  backgroundColor: "#ffffff",
  transparentBackground: false,
  cornerSquareColor: "#005f73",
  cornerDotColor: "#ca6702",
  dotType: "rounded",
  cornerSquareType: "extra-rounded",
  cornerDotType: "dot",
  logoSize: 0.22,
  logoMargin: 8,
  hideLogoBackgroundDots: true,
  dotTextEnabled: false,
  dotText: "QR",
  dotTextPosition: "bottom-right",
  dotTextSize: 44,
  dotTextColor: "#ae2012",
  dotTextRound: false,
};

const errorLevels: Array<{ value: ErrorCorrectionLevel; label: string; detail: string }> = [
  { value: "L", label: "L", detail: "7%" },
  { value: "M", label: "M", detail: "15%" },
  { value: "Q", label: "Q", detail: "25%" },
  { value: "H", label: "H", detail: "30%" },
];

const dotTypes: DotType[] = [
  "square",
  "dots",
  "rounded",
  "classy",
  "classy-rounded",
  "extra-rounded",
];

const cornerSquareTypes: CornerSquareType[] = ["square", "dot", "extra-rounded"];
const cornerDotTypes: CornerDotType[] = ["square", "dot"];

const textPositions: Array<{ value: TextPosition; label: string }> = [
  { value: "center", label: "Center" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "top-right", label: "Top right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-left", label: "Top left" },
];

function buildQrOptions(state: QrState, logoUrl: string | null, type: "canvas" | "svg" = "canvas") {
  return {
    width: state.size,
    height: state.size,
    type,
    data: state.data || " ",
    margin: state.margin,
    qrOptions: {
      errorCorrectionLevel: state.errorCorrection,
    },
    image: logoUrl || undefined,
    imageOptions: {
      hideBackgroundDots: state.hideLogoBackgroundDots,
      imageSize: state.logoSize,
      margin: state.logoMargin,
      crossOrigin: "anonymous",
      saveAsBlob: true,
    },
    dotsOptions: {
      color: state.dotColor,
      type: state.dotType,
    },
    backgroundOptions: state.transparentBackground
      ? { color: "transparent" }
      : { color: state.backgroundColor },
    cornersSquareOptions: {
      color: state.cornerSquareColor,
      type: state.cornerSquareType,
    },
    cornersDotOptions: {
      color: state.cornerDotColor,
      type: state.cornerDotType,
    },
  };
}

function setCanvasFont(context: CanvasRenderingContext2D, fontSize: number) {
  context.font = `800 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  context.textBaseline = "middle";
  context.textAlign = "center";
}

function measureDotText(
  text: string,
  fontSize: number,
  canvas: HTMLCanvasElement,
): { width: number; height: number } {
  const context = canvas.getContext("2d");
  if (!context) {
    return { width: fontSize * text.length, height: fontSize };
  }

  setCanvasFont(context, fontSize);
  return {
    width: Math.ceil(context.measureText(text).width),
    height: Math.ceil(fontSize * 1.18),
  };
}

function getTextAnchor(
  position: TextPosition,
  size: number,
  textWidth: number,
  textHeight: number,
): { x: number; y: number } {
  const edge = Math.max(18, Math.round(size * 0.045));

  if (position === "center") {
    return { x: size / 2 - textWidth / 2, y: size / 2 - textHeight / 2 };
  }

  if (position === "bottom-right") {
    return { x: size - edge - textWidth, y: size - edge - textHeight };
  }

  if (position === "top-right") {
    return { x: size - edge - textWidth, y: edge };
  }

  if (position === "bottom-left") {
    return { x: edge, y: size - edge - textHeight };
  }

  return { x: edge, y: edge };
}

function drawDotText(
  context: CanvasRenderingContext2D,
  state: QrState,
  measureCanvas: HTMLCanvasElement,
) {
  if (!state.dotTextEnabled || !state.dotText.trim()) {
    return;
  }

  const text = state.dotText.trim().slice(0, 18);
  const textSize = measureDotText(text, state.dotTextSize, measureCanvas);
  const offscreen = document.createElement("canvas");
  const padding = Math.ceil(state.dotTextSize * 0.22);
  offscreen.width = textSize.width + padding * 2;
  offscreen.height = textSize.height + padding * 2;

  const offscreenContext = offscreen.getContext("2d");
  if (!offscreenContext) {
    return;
  }

  setCanvasFont(offscreenContext, state.dotTextSize);
  offscreenContext.fillStyle = state.dotTextColor;
  offscreenContext.fillText(text, offscreen.width / 2, offscreen.height / 2);

  const imageData = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height);
  const step = Math.max(3, Math.floor(state.dotTextSize / 8));
  const dot = Math.max(2, Math.floor(step * 0.72));
  const anchor = getTextAnchor(
    state.dotTextPosition,
    state.size,
    offscreen.width,
    offscreen.height,
  );

  context.fillStyle = state.dotTextColor;
  for (let y = 0; y < offscreen.height; y += step) {
    for (let x = 0; x < offscreen.width; x += step) {
      const alphaIndex = (y * offscreen.width + x) * 4 + 3;
      if (imageData.data[alphaIndex] < 92) {
        continue;
      }

      const drawX = anchor.x + x;
      const drawY = anchor.y + y;
      if (state.dotTextRound) {
        context.beginPath();
        context.arc(drawX + dot / 2, drawY + dot / 2, dot / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(drawX, drawY, dot, dot);
      }
    }
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function App() {
  const [state, setState] = useState<QrState>(initialState);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const qrCode = useMemo(() => new QRCodeStyling(buildQrOptions(initialState, null)), []);

  const logoEnabled = Boolean(logoUrl);
  const overlayEnabled = logoEnabled || (state.dotTextEnabled && state.dotText.trim().length > 0);
  const largeLogoRisk = logoEnabled && state.logoSize > 0.34;
  const lowCorrectionRisk = overlayEnabled && state.errorCorrection !== "H";
  const cornerTextRisk =
    state.dotTextEnabled &&
    state.dotText.trim().length > 0 &&
    state.dotTextPosition !== "center" &&
    state.dotTextPosition !== "bottom-right";

  useEffect(() => {
    const container = previewRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";
    qrCode.append(container);
    return () => {
      container.innerHTML = "";
    };
  }, [qrCode]);

  useEffect(() => {
    qrCode.update(buildQrOptions(state, logoUrl));
  }, [logoUrl, qrCode, state]);

  useEffect(() => {
    return () => {
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  function patchState(patch: Partial<QrState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function resetDesign() {
    setState((current) => ({
      ...initialState,
      data: current.data,
    }));
    if (logoUrl) {
      URL.revokeObjectURL(logoUrl);
      setLogoUrl(null);
    }
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setLogoUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });

    setState((current) => ({
      ...current,
      errorCorrection: current.errorCorrection === "H" ? current.errorCorrection : "H",
    }));
  }

  function removeLogo() {
    if (logoUrl) {
      URL.revokeObjectURL(logoUrl);
      setLogoUrl(null);
    }
  }

  async function downloadPng() {
    const sourceCanvas = previewRef.current?.querySelector("canvas");
    if (!(sourceCanvas instanceof HTMLCanvasElement)) {
      return;
    }

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = state.size;
    outputCanvas.height = state.size;
    const context = outputCanvas.getContext("2d");
    if (!context) {
      return;
    }

    if (!state.transparentBackground) {
      context.fillStyle = state.backgroundColor;
      context.fillRect(0, 0, state.size, state.size);
    }

    context.drawImage(sourceCanvas, 0, 0, state.size, state.size);
    const measureCanvas = measureCanvasRef.current ?? document.createElement("canvas");
    drawDotText(context, state, measureCanvas);

    outputCanvas.toBlob((blob) => {
      if (blob) {
        triggerDownload(blob, "qrgen.png");
      }
    }, "image/png");
  }

  async function downloadSvg() {
    const svgQrCode = new QRCodeStyling(buildQrOptions(state, logoUrl, "svg"));
    await svgQrCode.download({ name: "qrgen", extension: "svg" });
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="QR code generator">
        <div className="controls">
          <header className="topbar">
            <div className="brand">
              <span className="brand-mark">
                <QrCode size={24} aria-hidden="true" />
              </span>
              <div>
                <h1>QR Studio</h1>
                <p>Static QR generator for GitHub Pages</p>
              </div>
            </div>
            <button className="icon-button" type="button" onClick={resetDesign} title="Reset design">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          </header>

          <section className="panel primary-panel" aria-labelledby="data-heading">
            <div className="panel-heading">
              <QrCode size={18} aria-hidden="true" />
              <h2 id="data-heading">Data</h2>
            </div>
            <textarea
              value={state.data}
              onChange={(event) => patchState({ data: event.currentTarget.value })}
              aria-label="QR data"
              spellCheck={false}
            />
            <div className="field-grid two">
              <label>
                <span>Size</span>
                <input
                  type="range"
                  min="320"
                  max="1600"
                  step="16"
                  value={state.size}
                  onChange={(event) => patchState({ size: Number(event.currentTarget.value) })}
                />
                <strong>{state.size}px</strong>
              </label>
              <label>
                <span>Margin</span>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="2"
                  value={state.margin}
                  onChange={(event) => patchState({ margin: Number(event.currentTarget.value) })}
                />
                <strong>{state.margin}px</strong>
              </label>
            </div>
          </section>

          <section className="panel" aria-labelledby="recovery-heading">
            <div className="panel-heading">
              <AlertTriangle size={18} aria-hidden="true" />
              <h2 id="recovery-heading">Recovery</h2>
            </div>
            <div className="segmented" role="group" aria-label="Error correction level">
              {errorLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  className={state.errorCorrection === level.value ? "selected" : ""}
                  onClick={() => patchState({ errorCorrection: level.value })}
                >
                  <span>{level.label}</span>
                  <small>{level.detail}</small>
                </button>
              ))}
            </div>
            <div className="warnings" aria-live="polite">
              {lowCorrectionRisk && (
                <p>
                  <AlertTriangle size={15} aria-hidden="true" />
                  Use H with logo or dot text.
                </p>
              )}
              {largeLogoRisk && (
                <p>
                  <AlertTriangle size={15} aria-hidden="true" />
                  Logo size is scan-sensitive.
                </p>
              )}
              {cornerTextRisk && (
                <p>
                  <AlertTriangle size={15} aria-hidden="true" />
                  This corner can touch finder patterns.
                </p>
              )}
            </div>
          </section>

          <section className="panel" aria-labelledby="color-heading">
            <div className="panel-heading">
              <Palette size={18} aria-hidden="true" />
              <h2 id="color-heading">Color</h2>
            </div>
            <div className="swatch-grid">
              <ColorField
                label="Dots"
                value={state.dotColor}
                onChange={(value) => patchState({ dotColor: value })}
              />
              <ColorField
                label="Background"
                value={state.backgroundColor}
                disabled={state.transparentBackground}
                onChange={(value) => patchState({ backgroundColor: value })}
              />
              <ColorField
                label="Corners"
                value={state.cornerSquareColor}
                onChange={(value) => patchState({ cornerSquareColor: value })}
              />
              <ColorField
                label="Eyes"
                value={state.cornerDotColor}
                onChange={(value) => patchState({ cornerDotColor: value })}
              />
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.transparentBackground}
                onChange={(event) =>
                  patchState({ transparentBackground: event.currentTarget.checked })
                }
              />
              <span>Transparent background</span>
            </label>
          </section>

          <section className="panel" aria-labelledby="shape-heading">
            <div className="panel-heading">
              <Shapes size={18} aria-hidden="true" />
              <h2 id="shape-heading">Shape</h2>
            </div>
            <div className="field-grid three">
              <label>
                <span>Dots</span>
                <select
                  value={state.dotType}
                  onChange={(event) => patchState({ dotType: event.currentTarget.value as DotType })}
                >
                  {dotTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Corners</span>
                <select
                  value={state.cornerSquareType}
                  onChange={(event) =>
                    patchState({ cornerSquareType: event.currentTarget.value as CornerSquareType })
                  }
                >
                  {cornerSquareTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Eyes</span>
                <select
                  value={state.cornerDotType}
                  onChange={(event) =>
                    patchState({ cornerDotType: event.currentTarget.value as CornerDotType })
                  }
                >
                  {cornerDotTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="panel" aria-labelledby="logo-heading">
            <div className="panel-heading">
              <ImagePlus size={18} aria-hidden="true" />
              <h2 id="logo-heading">Logo</h2>
            </div>
            <div className="logo-actions">
              <label className="file-button">
                <ImagePlus size={18} aria-hidden="true" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
              </label>
              <button className="ghost-button" type="button" onClick={removeLogo} disabled={!logoUrl}>
                <Trash2 size={17} aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
            <div className="field-grid two">
              <label>
                <span>Logo size</span>
                <input
                  type="range"
                  min="0.08"
                  max="0.5"
                  step="0.01"
                  value={state.logoSize}
                  onChange={(event) => patchState({ logoSize: Number(event.currentTarget.value) })}
                />
                <strong>{Math.round(state.logoSize * 100)}%</strong>
              </label>
              <label>
                <span>Logo margin</span>
                <input
                  type="range"
                  min="0"
                  max="32"
                  step="1"
                  value={state.logoMargin}
                  onChange={(event) => patchState({ logoMargin: Number(event.currentTarget.value) })}
                />
                <strong>{state.logoMargin}px</strong>
              </label>
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.hideLogoBackgroundDots}
                onChange={(event) =>
                  patchState({ hideLogoBackgroundDots: event.currentTarget.checked })
                }
              />
              <span>Hide dots under logo</span>
            </label>
          </section>

          <section className="panel" aria-labelledby="text-heading">
            <div className="panel-heading">
              <Type size={18} aria-hidden="true" />
              <h2 id="text-heading">Dot Text</h2>
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.dotTextEnabled}
                onChange={(event) => {
                  const enabled = event.currentTarget.checked;
                  patchState({
                    dotTextEnabled: enabled,
                    errorCorrection: enabled ? "H" : state.errorCorrection,
                  });
                }}
              />
              <span>Enable dot text</span>
            </label>
            <div className="field-grid two">
              <label>
                <span>Text</span>
                <input
                  type="text"
                  value={state.dotText}
                  maxLength={18}
                  onChange={(event) => patchState({ dotText: event.currentTarget.value })}
                />
              </label>
              <label>
                <span>Position</span>
                <select
                  value={state.dotTextPosition}
                  onChange={(event) =>
                    patchState({ dotTextPosition: event.currentTarget.value as TextPosition })
                  }
                >
                  {textPositions.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="field-grid two">
              <label>
                <span>Text size</span>
                <input
                  type="range"
                  min="18"
                  max="132"
                  step="2"
                  value={state.dotTextSize}
                  onChange={(event) => patchState({ dotTextSize: Number(event.currentTarget.value) })}
                />
                <strong>{state.dotTextSize}px</strong>
              </label>
              <ColorField
                label="Text color"
                value={state.dotTextColor}
                onChange={(value) => patchState({ dotTextColor: value })}
              />
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.dotTextRound}
                onChange={(event) => patchState({ dotTextRound: event.currentTarget.checked })}
              />
              <span>Round text dots</span>
            </label>
          </section>
        </div>

        <aside className="preview-pane" aria-label="QR preview">
          <div className="preview-top">
            <div>
              <span className="eyebrow">Preview</span>
              <h2>{state.size}px QR</h2>
            </div>
            <div className="download-actions">
              <button type="button" onClick={downloadPng}>
                <Download size={18} aria-hidden="true" />
                <span>PNG</span>
              </button>
              <button type="button" onClick={downloadSvg}>
                <Download size={18} aria-hidden="true" />
                <span>SVG</span>
              </button>
            </div>
          </div>

          <div className="qr-stage">
            <div className="qr-frame" ref={previewRef} />
            {state.dotTextEnabled && state.dotText.trim() && (
              <DotTextPreview state={state} measureCanvasRef={measureCanvasRef} />
            )}
          </div>

          <div className="preview-footer">
            <span>EC {state.errorCorrection}</span>
            <span>{state.dotType}</span>
            {logoEnabled && <span>logo {Math.round(state.logoSize * 100)}%</span>}
            {state.dotTextEnabled && <span>PNG includes dot text</span>}
          </div>
        </aside>
      </section>
      <canvas ref={measureCanvasRef} className="measure-canvas" aria-hidden="true" />
    </main>
  );
}

function ColorField({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <strong>{value}</strong>
    </label>
  );
}

function DotTextPreview({
  state,
  measureCanvasRef,
}: {
  state: QrState;
  measureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const text = state.dotText.trim().slice(0, 18);
  const canvas = measureCanvasRef.current ?? document.createElement("canvas");
  const measured = measureDotText(text, state.dotTextSize, canvas);
  const padding = Math.ceil(state.dotTextSize * 0.22);
  const width = measured.width + padding * 2;
  const height = measured.height + padding * 2;
  const anchor = getTextAnchor(state.dotTextPosition, state.size, width, height);

  return (
    <span
      className={`dot-text-preview ${state.dotTextRound ? "round" : ""}`}
      style={{
        color: state.dotTextColor,
        width: `${(width / state.size) * 100}%`,
        height: `${(height / state.size) * 100}%`,
        left: `${(anchor.x / state.size) * 100}%`,
        top: `${(anchor.y / state.size) * 100}%`,
        fontSize: `${(state.dotTextSize / state.size) * 100}%`,
      }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

export default App;
