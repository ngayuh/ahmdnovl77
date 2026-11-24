import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance;

export async function getFFmpeg(onLog) {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));

  // Single-thread core avoids SharedArrayBuffer requirements in common hosting setups.
  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

export async function transcodeToMp4(file, options, onProgress, onLog) {
  const ffmpeg = await getFFmpeg(onLog);
  const inputName = `input-${Date.now()}.${file.name.split(".").pop() || "mp4"}`;
  const outputName = `noval-${Date.now()}.mp4`;

  ffmpeg.on("progress", ({ progress }) => {
    if (onProgress) onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
  });

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const args = ["-i", inputName, "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264"];
  const edge = Number(options.resolution);
  if (edge) {
    args.push(
      "-vf",
      `scale=w='if(gte(iw,ih),min(iw,${edge}),-2)':h='if(gte(iw,ih),-2,min(ih,${edge}))'`,
    );
  }
  if (options.fps !== "original") args.push("-r", options.fps);
  args.push(
    "-preset", "veryfast",
    "-crf", options.crf,
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    outputName,
  );

  try {
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data.buffer], { type: "video/mp4" });
  } finally {
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
