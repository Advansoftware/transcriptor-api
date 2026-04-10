import os
import shutil
import tempfile
import time
import gc
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Security, Form
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from faster_whisper import WhisperModel

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Carrega o modelo padrão no startup
    print("Iniciando API e pré-carregando modelo padrão...")
    whisper_manager.get_model(os.getenv("WHISPER_MODEL", "base"))
    yield
    # Limpeza se necessário
    print("Encerrando API...")

app = FastAPI(title="Whisper API Local", lifespan=lifespan)

# Configurações Globais
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "minha-chave-secreta")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
SUPPORTED_MODELS = ["tiny", "base", "small", "medium", "large-v2", "large-v3", "distil-large-v3"]

# Gerenciador de Modelos (Hot-Swap)
class WhisperManager:
    def __init__(self):
        self.current_model = None
        self.current_model_name = None

    def get_model(self, model_name: str):
        if model_name not in SUPPORTED_MODELS:
            raise HTTPException(status_code=400, detail=f"Modelo '{model_name}' não suportado.")
        
        # Se o modelo já estiver carregado, retorna ele
        if self.current_model_name == model_name and self.current_model is not None:
            return self.current_model

        # Caso contrário, carrega o novo modelo e libera o antigo
        print(f"Trocando modelo: {self.current_model_name} -> {model_name}")
        
        # Limpeza agressiva de memória
        if self.current_model is not None:
            del self.current_model
            gc.collect()
            self.current_model = None

        try:
            self.current_model = WhisperModel(model_name, device=DEVICE, compute_type=COMPUTE_TYPE)
            self.current_model_name = model_name
            return self.current_model
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao carregar modelo {model_name}: {str(e)}")

whisper_manager = WhisperManager()

# Segurança
async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_SECRET_KEY:
        return api_key
    raise HTTPException(status_code=403, detail="Chave de API inválida ou ausente")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/models")
async def list_models():
    return {
        "models": SUPPORTED_MODELS,
        "current": whisper_manager.current_model_name
    }

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...), 
    model: str = Form("base"),
    api_key: str = Security(get_api_key)
):
    if not file:
        raise HTTPException(status_code=400, detail="Arquivo não fornecido")
    
    # Criar arquivo temporário
    suffix = os.path.splitext(file.filename)[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        start_time = time.time()
        
        # Obter (ou carregar) o modelo solicitado
        model_instance = whisper_manager.get_model(model)
        
        # Transcrição
        segments, info = model_instance.transcribe(tmp_path, beam_size=5)
        text = "".join([segment.text for segment in segments]).strip()
        
        duration = time.time() - start_time
        
        return {
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": round(duration, 2),
            "model": model,
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.get("/status")
async def get_status():
    return {
        "status": "online",
        "current_model": whisper_manager.current_model_name,
        "device": DEVICE
    }

# Servir Frontend
static_path = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_path):
    app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Inicializa com o modelo padrão no startup
    whisper_manager.get_model(os.getenv("WHISPER_MODEL", "base"))
    uvicorn.run(app, host="0.0.0.0", port=8000)
