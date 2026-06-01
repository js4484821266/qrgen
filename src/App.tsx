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
type QrCodeWithInternals = QRCodeStyling & {
  _qr?: {
    getModuleCount: () => number;
  };
  _canvasDrawingPromise?: Promise<void>;
};

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
  dotTextColor: "#17212b",
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

const pixelGlyphs: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "111"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["111", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  Q: ["111", "101", "101", "111", "001"],
  R: ["111", "101", "111", "110", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  " ": ["000", "000", "000", "000", "000"],
};

type PixelTextLayout = {
  text: string;
  glyphScale: number;
  cols: number;
  rows: number;
  moduleCount: number;
  moduleSize: number;
  startCol: number;
  startRow: number;
  quietModules: number;
  bgColor: string;
};

function normalizeDotText(text: string) {
  return text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 .-]/g, "")
    .slice(0, 8);
}

function getGlyph(text: string) {
  return text
    .split("")
    .map((char) => pixelGlyphs[char] ?? pixelGlyphs[" "])
    .filter(Boolean);
}

function getPixelTextSize(text: string, glyphScale: number) {
  const glyphs = getGlyph(text);
  const glyphWidth = 3 * glyphScale;
  const gap = glyphScale;
  return {
    cols: glyphs.length * glyphWidth + Math.max(0, glyphs.length - 1) * gap + glyphScale * 2,
    rows: 5 * glyphScale + glyphScale * 2,
  };
}

function getPixelTextLayout(state: QrState, moduleCount: number): PixelTextLayout | null {
  const text = normalizeDotText(state.dotText);
  if (!state.dotTextEnabled || !text) {
    return null;
  }

  const targetModules = Math.max(7, Math.round(state.dotTextSize / 5.2));
  const glyphScale = Math.max(1, Math.min(5, Math.floor(targetModules / 7)));
  const { cols, rows } = getPixelTextSize(text, glyphScale);
  const quietModules = Math.max(1, Math.floor(glyphScale / 2));
  const inset = Math.max(1, Math.round(moduleCount * 0.04));
  const protectedFinder = 9;
  let startCol = moduleCount - inset - cols;
  let startRow = moduleCount - inset - rows;

  if (state.dotTextPosition === "center") {
    startCol = Math.round((moduleCount - cols) / 2);
    startRow = Math.round((moduleCount - rows) / 2);
  } else if (state.dotTextPosition === "top-right") {
    startCol = moduleCount - inset - cols;
    startRow = protectedFinder;
  } else if (state.dotTextPosition === "bottom-left") {
    startCol = protectedFinder;
    startRow = moduleCount - inset - rows;
  } else if (state.dotTextPosition === "top-left") {
    startCol = protectedFinder;
    startRow = protectedFinder;
  }

  startCol = Math.max(0, Math.min(moduleCount - cols, startCol));
  startRow = Math.max(0, Math.min(moduleCount - rows, startRow));

  return {
    text,
    glyphScale,
    cols,
    rows,
    moduleCount,
    moduleSize: (state.size - state.margin * 2) / moduleCount,
    startCol,
    startRow,
    quietModules,
    bgColor: state.transparentBackground ? "rgba(255,255,255,0)" : state.backgroundColor,
  };
}

function drawDotText(
  context: CanvasRenderingContext2D,
  state: QrState,
  moduleCount: number,
) {
  const layout = getPixelTextLayout(state, moduleCount);
  if (!layout) {
    return;
  }

  const cell = layout.moduleSize;
  const clearCol = Math.max(0, layout.startCol - layout.quietModules);
  const clearRow = Math.max(0, layout.startRow - layout.quietModules);
  const clearCols = Math.min(
    layout.moduleCount - clearCol,
    layout.cols + layout.quietModules * 2,
  );
  const clearRows = Math.min(
    layout.moduleCount - clearRow,
    layout.rows + layout.quietModules * 2,
  );
  const clearX = state.margin + clearCol * cell;
  const clearY = state.margin + clearRow * cell;

  context.save();
  context.clearRect(clearX, clearY, clearCols * cell, clearRows * cell);
  if (!state.transparentBackground) {
    context.fillStyle = layout.bgColor;
    context.fillRect(clearX, clearY, clearCols * cell, clearRows * cell);
  }

  const glyphs = getGlyph(layout.text);
  const radius = state.dotTextRound ? cell * 0.45 : 0;
  context.fillStyle = state.dotTextColor;
  glyphs.forEach((glyph, glyphIndex) => {
    const glyphOffsetCol =
      layout.startCol + layout.glyphScale + glyphIndex * 4 * layout.glyphScale;
    glyph.forEach((row, y) => {
      row.split("").forEach((value, x) => {
        if (value !== "1") {
          return;
        }

        for (let scaleY = 0; scaleY < layout.glyphScale; scaleY += 1) {
          for (let scaleX = 0; scaleX < layout.glyphScale; scaleX += 1) {
            const moduleCol = glyphOffsetCol + x * layout.glyphScale + scaleX;
            const moduleRow = layout.startRow + layout.glyphScale + y * layout.glyphScale + scaleY;
            const drawX = state.margin + moduleCol * cell;
            const drawY = state.margin + moduleRow * cell;

            if (state.dotTextRound) {
              context.beginPath();
              context.arc(drawX + cell / 2, drawY + cell / 2, radius, 0, Math.PI * 2);
              context.fill();
            } else {
              context.fillRect(
                Math.round(drawX),
                Math.round(drawY),
                Math.ceil(cell),
                Math.ceil(cell),
              );
            }
          }
        }
      });
    });
  });
  context.restore();
}

async function applyDotTextToQrCanvas(
  qrCode: QrCodeWithInternals,
  canvas: HTMLCanvasElement | null | undefined,
  state: QrState,
) {
  if (!canvas || !state.dotTextEnabled) {
    return;
  }

  await qrCode._canvasDrawingPromise;
  const context = canvas.getContext("2d");
  const moduleCount = qrCode._qr?.getModuleCount();
  if (!context || !moduleCount) {
    return;
  }

  drawDotText(context, state, moduleCount);
}

async function createPngWithDotText(
  qrCode: QrCodeWithInternals,
  state: QrState,
): Promise<Blob | null> {
  const rawData = await qrCode.getRawData("png");
  if (!(rawData instanceof Blob)) {
    return null;
  }

  const image = await createImageBitmap(rawData);
  const canvas = document.createElement("canvas");
  canvas.width = state.size;
  canvas.height = state.size;
  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    return null;
  }

  if (!state.transparentBackground) {
    context.fillStyle = state.backgroundColor;
    context.fillRect(0, 0, state.size, state.size);
  }

  context.drawImage(image, 0, 0);
  image.close();

  const moduleCount = qrCode._qr?.getModuleCount();
  if (moduleCount) {
    drawDotText(context, state, moduleCount);
  }

  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
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

  const qrCode = useMemo(
    () => new QRCodeStyling(buildQrOptions(initialState, null)) as QrCodeWithInternals,
    [],
  );

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
    void applyDotTextToQrCanvas(
      qrCode,
      previewRef.current?.querySelector("canvas"),
      state,
    );
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

    const blob = state.dotTextEnabled
      ? await createPngWithDotText(qrCode, state)
      : await getCanvasBlob(sourceCanvas);

    if (blob) {
      triggerDownload(blob, "qrgen.png");
    }
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
                <p>No ads. No malware. No tracking. No uploads.</p>
              </div>
            </div>
            <button className="icon-button" type="button" onClick={resetDesign} title="Reset design">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          </header>

          <section className="trust-strip" aria-label="Trust notes">
            <span>No ads</span>
            <span>No malware</span>
            <span>No tracking</span>
            <span>Local files only</span>
          </section>

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
          </div>

          <div className="preview-footer">
            <span>EC {state.errorCorrection}</span>
            <span>{state.dotType}</span>
            {logoEnabled && <span>logo {Math.round(state.logoSize * 100)}%</span>}
            {state.dotTextEnabled && <span>PNG includes dot text</span>}
          </div>
        </aside>
      </section>
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

export default App;
