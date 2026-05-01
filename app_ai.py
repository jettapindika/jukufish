from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import os
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = "azharm1224/juku-version-3" 
print(f"[INFO] Memuat Juku-Vision (CTranslate2) dari Hugging Face: {model_path}...")

model = WhisperModel(model_path, device="cpu", compute_type="int8")

print("[INFO] Model sudah siap!")

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        t0 = time.time()

        file_path = "temp_audio.wav"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        t1 = time.time()

        segments, _ = model.transcribe(file_path, language="id", beam_size=1)
        result_text = "".join([segment.text for segment in segments]).strip()

        t2 = time.time()

        if os.path.exists(file_path):
            os.remove(file_path)

        print(f"[TIMER] Save: {t1-t0:.2f}s | Inference: {t2-t1:.2f}s | Total: {t2-t0:.2f}s")
        print(f"[RESULT] {result_text}")

        return {"text": result_text}

    except Exception as e:
        print(f"[ERROR] {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)