import {
  pipeline,
  env,
  type ProgressInfo,
  type AutomaticSpeechRecognitionPipeline,
} from "@huggingface/transformers";

env.allowLocalModels = false;

type CompleteMessage = { status: "complete"; text: string };
type ErrorMessage = { status: "error"; error: string };
type LoadingMessage = { status: "loading" };
type ReadyMessage = { status: "ready" };

export type WorkerMessage =
  | ProgressInfo
  | CompleteMessage
  | ErrorMessage
  | LoadingMessage
  | ReadyMessage;

class WhisperPipeline {
  static instance: AutomaticSpeechRecognitionPipeline | null = null;

  static async getInstance(progressCb?: (data: ProgressInfo) => void) {
    if (this.instance === null) {
      this.instance = (await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-base",
        {
          progress_callback: progressCb,
          dtype: {
            encoder_model: "fp32",
            decoder_model_merged: "fp32",
          },
        },
      )) as AutomaticSpeechRecognitionPipeline;
    }
    return this.instance;
  }
}

self.addEventListener("message", async (event: MessageEvent) => {
  const { audio } = event.data as { audio: Float32Array };

  try {
    self.postMessage({ status: "loading" } satisfies LoadingMessage);

    const transcriber = await WhisperPipeline.getInstance((data) => {
      self.postMessage(data);
    });

    self.postMessage({ status: "ready" } satisfies ReadyMessage);

    const result = await transcriber(audio, {
      language: "indonesian",
      task: "transcribe",
    });

    const text = Array.isArray(result) ? result[0].text : result.text;

    self.postMessage({
      status: "complete",
      text: (text ?? "").trim(),
    } satisfies CompleteMessage);
  } catch (err) {
    self.postMessage({
      status: "error",
      error: err instanceof Error ? err.message : "Transcription failed",
    } satisfies ErrorMessage);
  }
});
