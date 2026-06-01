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
type ContentType =
  | "text"
  | "url"
  | "phone"
  | "sms"
  | "email"
  | "wifi"
  | "vcard"
  | "geo"
  | "calendar"
  | "custom";
type QrCodeWithInternals = QRCodeStyling & {
  _qr?: {
    getModuleCount: () => number;
  };
  _canvasDrawingPromise?: Promise<void>;
};

type ContentFields = {
  text: string;
  url: string;
  phone: string;
  smsPhone: string;
  smsMessage: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  wifiSecurity: "WPA" | "WEP" | "nopass";
  wifiSsid: string;
  wifiPassword: string;
  wifiHidden: boolean;
  vFirstName: string;
  vLastName: string;
  vDisplayName: string;
  vPhone: string;
  vEmail: string;
  vOrg: string;
  vUrl: string;
  geoLat: string;
  geoLng: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  eventLocation: string;
  eventDescription: string;
  custom: string;
};

type QrState = {
  data: string;
  contentType: ContentType;
  contentFields: ContentFields;
  payloadPreview: string;
  payloadError: string;
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

const initialContentFields: ContentFields = {
  text: "Hello from QR Studio",
  url: "https://example.com",
  phone: "+82 10-1234-5678",
  smsPhone: "+82 10-1234-5678",
  smsMessage: "Hello",
  emailTo: "hello@example.com",
  emailSubject: "Hello",
  emailBody: "Generated with QR Studio",
  wifiSecurity: "WPA",
  wifiSsid: "",
  wifiPassword: "",
  wifiHidden: false,
  vFirstName: "",
  vLastName: "",
  vDisplayName: "",
  vPhone: "",
  vEmail: "",
  vOrg: "",
  vUrl: "",
  geoLat: "37.5665",
  geoLng: "126.9780",
  eventTitle: "",
  eventStart: "",
  eventEnd: "",
  eventLocation: "",
  eventDescription: "",
  custom: "https://example.com",
};

const initialState: QrState = {
  data: "https://example.com",
  contentType: "url",
  contentFields: initialContentFields,
  payloadPreview: "https://example.com",
  payloadError: "",
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

const contentTypes: Array<{ value: ContentType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "url", label: "URL" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "vcard", label: "vCard" },
  { value: "geo", label: "Geo" },
  { value: "calendar", label: "Calendar" },
  { value: "custom", label: "Custom" },
];

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

function escapeQrField(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function normalizePhone(value: string, fieldName = "Phone") {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }

  if (!/^\+?[0-9\s\-()]+$/.test(trimmed)) {
    throw new Error(`${fieldName} can contain only digits, spaces, hyphens, parentheses, and one leading +.`);
  }

  if ((trimmed.match(/\+/g) ?? []).length > 1 || (trimmed.includes("+") && !trimmed.startsWith("+"))) {
    throw new Error(`${fieldName} can use + only at the beginning.`);
  }

  const normalized = trimmed.replace(/[\s\-()]/g, "");
  if (!/^\+?[0-9]{3,20}$/.test(normalized)) {
    throw new Error(`${fieldName} must contain 3 to 20 digits.`);
  }

  return normalized;
}

function requireValue(value: string, fieldName: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }
  return trimmed;
}

function validateEmailAddress(value: string, required = true) {
  const trimmed = value.trim();
  if (!trimmed && !required) {
    return "";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("Email address is invalid.");
  }
  return trimmed;
}

function validateHttpUrl(value: string, fieldName = "URL", required = true) {
  const trimmed = value.trim();
  if (!trimmed && !required) {
    return "";
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`${fieldName} must start with http:// or https://.`);
  }
  try {
    return new URL(trimmed).toString();
  } catch {
    throw new Error(`${fieldName} is invalid.`);
  }
}

function validateCoordinate(value: string, min: number, max: number, fieldName: string) {
  const trimmed = requireValue(value, fieldName);
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`${fieldName} must be a number.`);
  }
  const numberValue = Number(trimmed);
  if (numberValue < min || numberValue > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}.`);
  }
  return trimmed;
}

function formatLocalDateTime(value: string, fieldName: string) {
  const trimmed = requireValue(value, fieldName);
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }
  const [datePart, timePart] = trimmed.split("T");
  return `${datePart.replace(/-/g, "")}T${timePart.replace(/:/g, "")}00`;
}

function buildContentPayload(type: ContentType, fields: ContentFields) {
  switch (type) {
    case "text":
      return requireValue(fields.text, "Text");
    case "url":
      return validateHttpUrl(fields.url);
    case "phone":
      return `tel:${normalizePhone(fields.phone)}`;
    case "sms":
      return `SMSTO:${normalizePhone(fields.smsPhone, "SMS phone")}:${fields.smsMessage}`;
    case "email": {
      const to = validateEmailAddress(fields.emailTo);
      return `MATMSG:TO:${escapeQrField(to)};SUB:${escapeQrField(fields.emailSubject)};BODY:${escapeQrField(fields.emailBody)};;`;
    }
    case "wifi": {
      const ssid = requireValue(fields.wifiSsid, "Wi-Fi SSID");
      if (fields.wifiSecurity !== "nopass") {
        requireValue(fields.wifiPassword, "Wi-Fi password");
      }
      return `WIFI:T:${fields.wifiSecurity};S:${escapeQrField(ssid)};P:${escapeQrField(fields.wifiPassword)};H:${fields.wifiHidden ? "true" : "false"};;`;
    }
    case "vcard": {
      const firstName = fields.vFirstName.trim();
      const lastName = fields.vLastName.trim();
      const displayName = fields.vDisplayName.trim() || [firstName, lastName].filter(Boolean).join(" ");
      if (!displayName) {
        throw new Error("vCard name is required.");
      }
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${escapeQrField(lastName)};${escapeQrField(firstName)}`, `FN:${escapeQrField(displayName)}`];
      if (fields.vPhone.trim()) {
        lines.push(`TEL:${normalizePhone(fields.vPhone, "vCard phone")}`);
      }
      if (fields.vEmail.trim()) {
        lines.push(`EMAIL:${validateEmailAddress(fields.vEmail, false)}`);
      }
      if (fields.vOrg.trim()) {
        lines.push(`ORG:${escapeQrField(fields.vOrg.trim())}`);
      }
      if (fields.vUrl.trim()) {
        lines.push(`URL:${validateHttpUrl(fields.vUrl, "vCard URL", false)}`);
      }
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "geo":
      return `geo:${validateCoordinate(fields.geoLat, -90, 90, "Latitude")},${validateCoordinate(fields.geoLng, -180, 180, "Longitude")}`;
    case "calendar": {
      const title = requireValue(fields.eventTitle, "Event title");
      const start = requireValue(fields.eventStart, "Start time");
      const end = requireValue(fields.eventEnd, "End time");
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new Error("Event dates are invalid.");
      }
      if (endDate <= startDate) {
        throw new Error("End time must be after start time.");
      }
      const lines = [
        "BEGIN:VEVENT",
        `SUMMARY:${escapeQrField(title)}`,
        `DTSTART:${formatLocalDateTime(start, "Start time")}`,
        `DTEND:${formatLocalDateTime(end, "End time")}`,
      ];
      if (fields.eventLocation.trim()) {
        lines.push(`LOCATION:${escapeQrField(fields.eventLocation.trim())}`);
      }
      if (fields.eventDescription.trim()) {
        lines.push(`DESCRIPTION:${escapeQrField(fields.eventDescription.trim())}`);
      }
      lines.push("END:VEVENT");
      return lines.join("\n");
    }
    case "custom":
      return requireValue(fields.custom, "Custom payload");
  }
}

function getPayloadResult(type: ContentType, fields: ContentFields) {
  try {
    return { payload: buildContentPayload(type, fields), error: "" };
  } catch (error) {
    return {
      payload: "",
      error: error instanceof Error ? error.message : "Payload is invalid.",
    };
  }
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
  const payloadInvalid = Boolean(state.payloadError);
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
    const result = getPayloadResult(state.contentType, state.contentFields);
    setState((current) => {
      if (result.error) {
        if (current.payloadError === result.error && current.payloadPreview === "") {
          return current;
        }
        return {
          ...current,
          payloadPreview: "",
          payloadError: result.error,
        };
      }

      if (
        current.data === result.payload &&
        current.payloadPreview === result.payload &&
        current.payloadError === ""
      ) {
        return current;
      }

      return {
        ...current,
        data: result.payload,
        payloadPreview: result.payload,
        payloadError: "",
      };
    });
  }, [state.contentFields, state.contentType]);

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

  function patchContentFields(patch: Partial<ContentFields>) {
    setState((current) => ({
      ...current,
      contentFields: {
        ...current.contentFields,
        ...patch,
      },
    }));
  }

  function resetDesign() {
    setState((current) => ({
      ...initialState,
      data: current.data,
      contentType: current.contentType,
      contentFields: current.contentFields,
      payloadPreview: current.payloadPreview,
      payloadError: current.payloadError,
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
    if (payloadInvalid) {
      return;
    }

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
    if (payloadInvalid) {
      return;
    }

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
            <label>
              <span>Content type</span>
              <select
                value={state.contentType}
                onChange={(event) =>
                  patchState({ contentType: event.currentTarget.value as ContentType })
                }
              >
                {contentTypes.map((contentType) => (
                  <option key={contentType.value} value={contentType.value}>
                    {contentType.label}
                  </option>
                ))}
              </select>
            </label>
            <ContentFieldsEditor
              type={state.contentType}
              fields={state.contentFields}
              onChange={patchContentFields}
            />
            {state.payloadError ? (
              <p className="payload-error">
                <AlertTriangle size={15} aria-hidden="true" />
                {state.payloadError}
              </p>
            ) : null}
            <label>
              <span>Generated payload</span>
              <textarea
                className="payload-preview"
                value={state.payloadPreview || state.data}
                aria-label="Generated QR payload"
                readOnly
                spellCheck={false}
              />
            </label>
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
              <button type="button" onClick={downloadPng} disabled={payloadInvalid}>
                <Download size={18} aria-hidden="true" />
                <span>PNG</span>
              </button>
              <button type="button" onClick={downloadSvg} disabled={payloadInvalid}>
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

function ContentFieldsEditor({
  type,
  fields,
  onChange,
}: {
  type: ContentType;
  fields: ContentFields;
  onChange: (patch: Partial<ContentFields>) => void;
}) {
  if (type === "text") {
    return (
      <label>
        <span>Text</span>
        <textarea
          value={fields.text}
          onChange={(event) => onChange({ text: event.currentTarget.value })}
          spellCheck={false}
        />
      </label>
    );
  }

  if (type === "url") {
    return (
      <label>
        <span>URL</span>
        <input
          type="url"
          value={fields.url}
          placeholder="https://example.com"
          onChange={(event) => onChange({ url: event.currentTarget.value })}
        />
      </label>
    );
  }

  if (type === "phone") {
    return (
      <label>
        <span>Phone number</span>
        <input
          type="tel"
          value={fields.phone}
          placeholder="+82 10-1234-5678"
          onChange={(event) => onChange({ phone: event.currentTarget.value })}
        />
      </label>
    );
  }

  if (type === "sms") {
    return (
      <>
        <label>
          <span>SMS phone</span>
          <input
            type="tel"
            value={fields.smsPhone}
            placeholder="+82 10-1234-5678"
            onChange={(event) => onChange({ smsPhone: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>Message</span>
          <textarea
            value={fields.smsMessage}
            onChange={(event) => onChange({ smsMessage: event.currentTarget.value })}
          />
        </label>
      </>
    );
  }

  if (type === "email") {
    return (
      <>
        <label>
          <span>To</span>
          <input
            type="email"
            value={fields.emailTo}
            placeholder="hello@example.com"
            onChange={(event) => onChange({ emailTo: event.currentTarget.value })}
          />
        </label>
        <div className="field-grid two">
          <label>
            <span>Subject</span>
            <input
              type="text"
              value={fields.emailSubject}
              onChange={(event) => onChange({ emailSubject: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Body</span>
            <input
              type="text"
              value={fields.emailBody}
              onChange={(event) => onChange({ emailBody: event.currentTarget.value })}
            />
          </label>
        </div>
      </>
    );
  }

  if (type === "wifi") {
    return (
      <>
        <div className="field-grid two">
          <label>
            <span>Security</span>
            <select
              value={fields.wifiSecurity}
              onChange={(event) =>
                onChange({ wifiSecurity: event.currentTarget.value as ContentFields["wifiSecurity"] })
              }
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No password</option>
            </select>
          </label>
          <label>
            <span>SSID</span>
            <input
              type="text"
              value={fields.wifiSsid}
              onChange={(event) => onChange({ wifiSsid: event.currentTarget.value })}
            />
          </label>
        </div>
        <label>
          <span>Password</span>
          <input
            type="text"
            value={fields.wifiPassword}
            disabled={fields.wifiSecurity === "nopass"}
            onChange={(event) => onChange({ wifiPassword: event.currentTarget.value })}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={fields.wifiHidden}
            onChange={(event) => onChange({ wifiHidden: event.currentTarget.checked })}
          />
          <span>Hidden network</span>
        </label>
      </>
    );
  }

  if (type === "vcard") {
    return (
      <>
        <div className="field-grid two">
          <label>
            <span>First name</span>
            <input
              type="text"
              value={fields.vFirstName}
              onChange={(event) => onChange({ vFirstName: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Last name</span>
            <input
              type="text"
              value={fields.vLastName}
              onChange={(event) => onChange({ vLastName: event.currentTarget.value })}
            />
          </label>
        </div>
        <label>
          <span>Display name</span>
          <input
            type="text"
            value={fields.vDisplayName}
            onChange={(event) => onChange({ vDisplayName: event.currentTarget.value })}
          />
        </label>
        <div className="field-grid two">
          <label>
            <span>Phone</span>
            <input
              type="tel"
              value={fields.vPhone}
              onChange={(event) => onChange({ vPhone: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={fields.vEmail}
              onChange={(event) => onChange({ vEmail: event.currentTarget.value })}
            />
          </label>
        </div>
        <div className="field-grid two">
          <label>
            <span>Organization</span>
            <input
              type="text"
              value={fields.vOrg}
              onChange={(event) => onChange({ vOrg: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>URL</span>
            <input
              type="url"
              value={fields.vUrl}
              placeholder="https://example.com"
              onChange={(event) => onChange({ vUrl: event.currentTarget.value })}
            />
          </label>
        </div>
      </>
    );
  }

  if (type === "geo") {
    return (
      <div className="field-grid two">
        <label>
          <span>Latitude</span>
          <input
            type="text"
            value={fields.geoLat}
            placeholder="37.5665"
            onChange={(event) => onChange({ geoLat: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>Longitude</span>
          <input
            type="text"
            value={fields.geoLng}
            placeholder="126.9780"
            onChange={(event) => onChange({ geoLng: event.currentTarget.value })}
          />
        </label>
      </div>
    );
  }

  if (type === "calendar") {
    return (
      <>
        <label>
          <span>Event title</span>
          <input
            type="text"
            value={fields.eventTitle}
            onChange={(event) => onChange({ eventTitle: event.currentTarget.value })}
          />
        </label>
        <div className="field-grid two">
          <label>
            <span>Start</span>
            <input
              type="datetime-local"
              value={fields.eventStart}
              onChange={(event) => onChange({ eventStart: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>End</span>
            <input
              type="datetime-local"
              value={fields.eventEnd}
              onChange={(event) => onChange({ eventEnd: event.currentTarget.value })}
            />
          </label>
        </div>
        <div className="field-grid two">
          <label>
            <span>Location</span>
            <input
              type="text"
              value={fields.eventLocation}
              onChange={(event) => onChange({ eventLocation: event.currentTarget.value })}
            />
          </label>
          <label>
            <span>Description</span>
            <input
              type="text"
              value={fields.eventDescription}
              onChange={(event) => onChange({ eventDescription: event.currentTarget.value })}
            />
          </label>
        </div>
      </>
    );
  }

  return (
    <label>
      <span>Raw payload</span>
      <textarea
        value={fields.custom}
        onChange={(event) => onChange({ custom: event.currentTarget.value })}
        spellCheck={false}
      />
    </label>
  );
}

export default App;
