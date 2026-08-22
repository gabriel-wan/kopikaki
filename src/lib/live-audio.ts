import type { Session } from "@google/genai";

function encodePcm(samples: Float32Array, sourceRate: number): string {
  const ratio = sourceRate / 16_000;
  const pcm = new Int16Array(Math.ceil(samples.length / ratio));
  for (let index = 0; index < pcm.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[Math.floor(index * ratio)] ?? 0));
    pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function streamMicrophone(session: Session) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  // ponytail: dependency-free demo audio; replace with AudioWorklet only if profiling shows glitches.
  const processor = context.createScriptProcessor(2048, 1, 1);
  processor.onaudioprocess = (event) => session.sendRealtimeInput({ audio: { data: encodePcm(event.inputBuffer.getChannelData(0), context.sampleRate), mimeType: "audio/pcm;rate=16000" } });
  source.connect(processor);
  processor.connect(context.destination);
  return async () => {
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    session.sendRealtimeInput({ audioStreamEnd: true });
    await context.close();
  };
}

export function createAudioPlayer() {
  const context = new AudioContext({ sampleRate: 24_000 });
  let nextStart = 0;
  return {
    play(base64: string) {
      const binary = atob(base64);
      const pcm = new Int16Array(binary.length / 2);
      for (let index = 0; index < pcm.length; index += 1) pcm[index] = binary.charCodeAt(index * 2) | (binary.charCodeAt(index * 2 + 1) << 8);
      const buffer = context.createBuffer(1, pcm.length, 24_000);
      const output = buffer.getChannelData(0);
      for (let index = 0; index < pcm.length; index += 1) output[index] = pcm[index] / 0x8000;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      nextStart = Math.max(nextStart, context.currentTime);
      source.start(nextStart);
      nextStart += buffer.duration;
    },
    close: () => context.close(),
  };
}
