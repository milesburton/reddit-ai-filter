import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { ModelStatus } from "@/scorer/model";
import { loadSettings, saveSettings } from "@/settings/storage";
import type { Settings } from "@/settings/types";
import { DEFAULT_SETTINGS } from "@/settings/types";
import "./popup.css";

async function fetchModelStatus(): Promise<ModelStatus> {
  try {
    const response = await browser.runtime.sendMessage({ type: "MODEL_STATUS" });
    return (response as { status: ModelStatus }).status;
  } catch {
    return { state: "idle" };
  }
}

function ModelStatusBar({ status }: { status: ModelStatus }) {
  if (status.state === "ready") return null;
  if (status.state === "idle") {
    return <p class="model-status model-status--idle">Model: waiting to load…</p>;
  }
  if (status.state === "downloading") {
    return (
      <p class="model-status model-status--downloading">
        Downloading model: {status.progress}%
        <span class="model-status-note"> (once only — cached after this)</span>
      </p>
    );
  }
  if (status.state === "error") {
    return <p class="model-status model-status--error">Model error: {status.message}</p>;
  }
  return null;
}

function Popup() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({ state: "idle" });

  useEffect(() => {
    loadSettings().then(setSettings);

    // Poll model status until ready
    let timer: ReturnType<typeof setTimeout>;
    function poll() {
      fetchModelStatus().then((s) => {
        setModelStatus(s);
        if (s.state !== "ready" && s.state !== "error") {
          timer = setTimeout(poll, 500);
        }
      });
    }
    poll();
    return () => clearTimeout(timer);
  }, []);

  async function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  function updateThreshold(key: keyof Settings["thresholds"], value: number) {
    update({ thresholds: { ...settings.thresholds, [key]: value } });
  }

  return (
    <div class="popup">
      <header>
        <span class="title">Reddit AI Filter</span>
        <label class="toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => update({ enabled: (e.target as HTMLInputElement).checked })}
          />
          <span class="toggle-track" />
        </label>
      </header>

      <ModelStatusBar status={modelStatus} />

      <section class={settings.enabled ? "" : "disabled"}>
        <p class="section-label">Suspicion thresholds</p>

        <ThresholdRow
          label="Low hint"
          description="Thin border only"
          value={settings.thresholds.low}
          min={0.1}
          max={settings.thresholds.medium - 0.05}
          onChange={(v) => updateThreshold("low", v)}
          disabled={!settings.enabled}
        />

        <ThresholdRow
          label="Dim"
          description="Reduced opacity"
          value={settings.thresholds.medium}
          min={settings.thresholds.low + 0.05}
          max={settings.thresholds.high - 0.05}
          onChange={(v) => updateThreshold("medium", v)}
          disabled={!settings.enabled}
        />

        <ThresholdRow
          label="Hide"
          description="Collapsed"
          value={settings.thresholds.high}
          min={settings.thresholds.medium + 0.05}
          max={0.99}
          onChange={(v) => updateThreshold("high", v)}
          disabled={!settings.enabled}
        />
      </section>

      {saved && <p class="saved-notice">Saved</p>}
    </div>
  );
}

interface ThresholdRowProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled: boolean;
}

function ThresholdRow({
  label,
  description,
  value,
  min,
  max,
  onChange,
  disabled,
}: ThresholdRowProps) {
  return (
    <div class="threshold-row">
      <div class="threshold-labels">
        <span class="threshold-name">{label}</span>
        <span class="threshold-desc">{description}</span>
      </div>
      <div class="threshold-control">
        <input
          type="range"
          min={min}
          max={max}
          step={0.01}
          value={value}
          disabled={disabled}
          onInput={(e) => onChange(parseFloat((e.target as HTMLInputElement).value))}
        />
        <span class="threshold-value">{Math.round(value * 100)}%</span>
      </div>
    </div>
  );
}

const appEl = document.getElementById("app");
if (appEl) render(<Popup />, appEl);
