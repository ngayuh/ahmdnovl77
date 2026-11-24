import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine, ArrowUpRight, Check, ChevronDown, CircleHelp,
  Clapperboard, FileVideo2, Film, Gauge, HardDrive, Layers3,
  LoaderCircle, MonitorPlay, Play, Plus, Settings2, ShieldCheck,
  Sparkles, UploadCloud, X,
} from "lucide-react";
import { transcodeToMp4 } from "./lib/ffmpeg";

const profiles = [
  { id: "original", label: "Original", detail: "Pertahankan detail sumber", crf: "18" },
  { id: "high", label: "High Quality", detail: "Kualitas tinggi, ukuran seimbang", crf: "20" },
  { id: "ultra", label: "Ultra", detail: "Prioritas kualitas maksimum", crf: "16" },
];

const formatBytes = (bytes = 0) => {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const formatDuration = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return "—";
  const mins = Math.floor(seconds / 60);
  return `${mins}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

export default function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [profile, setProfile] = useState("high");
  const [resolution, setResolution] = useState("1080");
  const [fps, setFps] = useState("original");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [outputUrl, setOutputUrl] = useState("");
  const [outputSize, setOutputSize] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    if (videoInfo?.url) URL.revokeObjectURL(videoInfo.url);
  }, [outputUrl, videoInfo]);

  const selectedProfile = useMemo(
    () => profiles.find((item) => item.id === profile) ?? profiles[1],
    [profile],
  );

  function acceptFile(nextFile) {
    if (!nextFile) return;
    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];
    const extensionOk = /\.(mp4|mov|webm|mkv)$/i.test(nextFile.name);
    if (!allowed.includes(nextFile.type) && !extensionOk) {
      setError("Format belum didukung. Gunakan MP4, MOV, MKV, atau WebM.");
      return;
    }
    if (videoInfo?.url) URL.revokeObjectURL(videoInfo.url);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl("");
    setOutputSize(0);
    setError("");
    setFile(nextFile);
    setVideoInfo({ url: URL.createObjectURL(nextFile), width: 0, height: 0, duration: 0 });
  }

  function onVideoMetadata(event) {
    const video = event.currentTarget;
    setVideoInfo((current) => current ? {
      ...current,
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
    } : current);
  }

  async function handleTranscode() {
    if (!file || busy) return;
    setBusy(true);
    setProgress(0);
    setError("");
    setStatus("Menyiapkan FFmpeg WebAssembly…");
    try {
      const blob = await transcodeToMp4(
        file,
        { resolution, fps, crf: selectedProfile.crf },
        (value) => {
          setProgress(value);
          setStatus(value >= 100 ? "Menyelesaikan file…" : "Memproses video di browser…");
        },
        () => {},
      );
      const url = URL.createObjectURL(blob);
      setOutputUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      setOutputSize(blob.size);
      setProgress(100);
      setStatus("Transcoding selesai");
    } catch (err) {
      console.error(err);
      setError("Transcoding gagal. Coba file yang lebih kecil atau format MP4, lalu ulangi.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function clearFile() {
    if (busy) return;
    setFile(null);
    setVideoInfo(null);
    setOutputUrl("");
    setOutputSize(0);
    setProgress(0);
    setStatus("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="NOVAL HD Studio home">
          <span className="brand-mark"><Clapperboard size={19} /></span>
          <span className="brand-copy"><strong>NOVAL<span>HD</span></strong><small>STUDIO</small></span>
        </a>
        <nav className="top-nav">
          <a className="active" href="#studio">Studio</a>
          <a href="#workflow">Workflow</a>
          <a href="#about">About</a>
        </nav>
        <div className="top-actions">
          <span className="engine-pill"><span className="status-dot" /> BROWSER ENGINE</span>
          <button className="icon-button" aria-label="Help" title="Help"><CircleHelp size={18} /></button>
        </div>
      </header>

      <section className="hero" id="studio">
        <div className="eyebrow"><span className="eyebrow-line" /> VIDEO WORKFLOW, REFINED</div>
        <h1>Your Video.<br /><span>Maximum Quality.</span></h1>
        <p>Prepare, optimize, and export your videos with precision.<br className="desktop-break" /> Built for creators who care about every frame.</p>
        <div className="hero-meta">
          <span><ShieldCheck size={14} /> Local browser processing</span>
          <i />
          <span><Sparkles size={14} /> Creator-focused presets</span>
        </div>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <div><span className="section-index">01 / INPUT</span><h2>Source video</h2></div>
          {file && <button className="text-button" onClick={clearFile}><X size={14} /> Remove file</button>}
        </div>

        {!file ? (
          <button
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files?.[0]); }}
          >
            <span className="upload-icon"><UploadCloud size={25} /></span>
            <strong>Drop your video here</strong>
            <span className="drop-sub">or <em>browse files</em> from your device</span>
            <span className="format-tags"><b>MP4</b><b>MOV</b><b>MKV</b><b>WEBM</b></span>
            <small>Choose one video · Recommended under 500 MB for browser processing</small>
          </button>
        ) : (
          <div className="source-card">
            <div className="video-preview">
              <video src={videoInfo?.url} controls onLoadedMetadata={onVideoMetadata} />
              <span className="preview-label"><MonitorPlay size={13} /> SOURCE PREVIEW</span>
            </div>
            <div className="source-details">
              <div className="file-title"><FileVideo2 size={18} /><strong>{file.name}</strong><button onClick={clearFile} aria-label="Remove video"><X size={16} /></button></div>
              <div className="metadata-grid">
                <div><small>FILE SIZE</small><strong>{formatBytes(file.size)}</strong></div>
                <div><small>RESOLUTION</small><strong>{videoInfo?.width ? `${videoInfo.width} × ${videoInfo.height}` : "Reading…"}</strong></div>
                <div><small>DURATION</small><strong>{formatDuration(videoInfo?.duration)}</strong></div>
                <div><small>FORMAT</small><strong>{file.name.split(".").pop()?.toUpperCase()}</strong></div>
              </div>
            </div>
          </div>
        )}

        <input ref={inputRef} className="visually-hidden" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mkv" onChange={(event) => acceptFile(event.target.files?.[0])} />
        {error && <div className="error-banner">{error}</div>}

        <div className="section-heading settings-heading">
          <div><span className="section-index">02 / CONFIGURATION</span><h2>Output settings</h2></div>
          <span className="settings-note"><Settings2 size={14} /> Fine-tune your export</span>
        </div>

        <div className="settings-layout">
          <div className="settings-main">
            <div className="setting-block">
              <div className="setting-title"><div><span className="setting-icon"><Gauge size={16} /></span><strong>Quality profile</strong></div><span className="subtle">Choose your priority</span></div>
              <div className="profile-grid">
                {profiles.map((item) => (
                  <button key={item.id} className={`profile-card ${profile === item.id ? "selected" : ""}`} onClick={() => setProfile(item.id)}>
                    <span className="radio-mark">{profile === item.id && <Check size={11} />}</span>
                    <strong>{item.label}</strong><small>{item.detail}</small>
                    {item.id === "ultra" && <span className="mini-tag">MAX DETAIL</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-block">
              <div className="setting-title"><div><span className="setting-icon"><Layers3 size={16} /></span><strong>Video parameters</strong></div><span className="subtle">Manual control</span></div>
              <div className="select-grid">
                <label className="select-field"><span>Resolution</span><div><select value={resolution} onChange={(e) => setResolution(e.target.value)}><option value="original">Original resolution</option><option value="720">Up to 720p</option><option value="1080">Up to 1080p</option><option value="1440">Up to 1440p</option><option value="2160">Up to 2160p / 4K</option></select><ChevronDown size={15} /></div></label>
                <label className="select-field"><span>Frame rate</span><div><select value={fps} onChange={(e) => setFps(e.target.value)}><option value="original">Keep original FPS</option><option value="30">30 FPS</option><option value="60">60 FPS</option></select><ChevronDown size={15} /></div></label>
                <label className="select-field"><span>Video codec</span><div><select value="h264" disabled><option value="h264">H.264 / AVC</option></select><ChevronDown size={15} /></div></label>
                <label className="select-field"><span>Output format</span><div><select value="mp4" disabled><option value="mp4">MP4 container</option></select><ChevronDown size={15} /></div></label>
              </div>
            </div>
          </div>

          <aside className="output-panel">
            <div className="output-panel-head"><span className="section-index">03 / EXPORT</span><span className="export-icon"><ArrowUpRight size={17} /></span></div>
            <h3>Ready when<br />you are.</h3>
            <p>Your export will be processed locally in this browser. Your source video is not uploaded to a NOVAL server.</p>
            <div className="export-summary">
              <div><span>Profile</span><strong>{selectedProfile.label}</strong></div>
              <div><span>Resolution</span><strong>{resolution === "original" ? "Original" : `Up to ${resolution}p`}</strong></div>
              <div><span>Frame rate</span><strong>{fps === "original" ? "Original" : `${fps} FPS`}</strong></div>
              <div><span>Codec</span><strong>H.264 · AAC</strong></div>
            </div>
            <button className="export-button" disabled={!file || busy} onClick={handleTranscode}>
              {busy ? <><LoaderCircle className="spin" size={17} /> Processing…</> : <><Play size={16} fill="currentColor" /> Start transcoding</>}
            </button>
            {status && <div className="progress-wrap"><div className="progress-label"><span>{status}</span><b>{progress}%</b></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
            {outputUrl && <a className="download-button" href={outputUrl} download={`${file.name.replace(/\.[^.]+$/, "")}-noval.mp4`}><ArrowDownToLine size={16} /> Download MP4</a>}
            <div className="privacy-note"><ShieldCheck size={14} /><span>Files stay on your device during processing.</span></div>
          </aside>
        </div>
      </section>

      <section className="workflow-strip" id="workflow">
        <div><span className="section-index">THE WORKFLOW</span><h2>Quality without the guesswork.</h2></div>
        <div className="workflow-steps">
          <div><span>01</span><strong>Import</strong><small>Add your source video</small></div>
          <div><span>02</span><strong>Configure</strong><small>Choose output settings</small></div>
          <div><span>03</span><strong>Export</strong><small>Download your optimized file</small></div>
        </div>
      </section>

      <footer id="about"><a className="footer-brand" href="#">NOVAL HD STUDIO</a><span>Built for creators. Made for every frame.</span><span>© 2026 NOVAL HD Studio</span></footer>
    </main>
  );
}
