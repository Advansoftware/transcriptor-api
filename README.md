# Whisper Transcription API 🎙️

Uma API de alto desempenho para transcrição de áudio local utilizando **OpenAI Whisper (via Faster-Whisper)**, encapsulada em Docker e acompanhada de uma interface web moderna.

Ideal para integração com sistemas de mensageria (como **Evolution API**) para transcrição de áudios do WhatsApp com qualidade profissional.

## ✨ Funcionalidades

- **Múltiplos Modelos:** Suporte a `tiny`, `base`, `small`, `medium` e `large-v3` com troca dinâmica na memória (Hot-Swap).
- **Interface Premium:** Dashboard web com glassmorphism, suporte a drag-and-drop e visualização de status.
- **Segurança:** Autenticação via `X-API-Key` configurável por variável de ambiente.
- **Otimizada para CPU:** Utiliza quantização `int8` para processamento rápido mesmo sem GPU.
- **Persistência:** Cache de modelos para evitar downloads repetidos.

## 🚀 Como Iniciar

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone git@github.com:Advansoftware/transcriptor-api.git
   cd transcriptor-api
   ```

2. **Configure o ambiente:**
   Crie um arquivo `.env` (exemplo incluído):
   ```bash
   API_SECRET_KEY=sua_chave_secreta_aqui
   WHISPER_MODEL=base
   WHISPER_DEVICE=cpu
   ```

3. **Suba os containers:**
   ```bash
   docker compose up --build -d
   ```

A API estará disponível em `http://localhost:8000`.

## 📚 Documentação da API

A documentação interativa e exemplos de código (`cURL`, `Python`, `Evolution API`) estão disponíveis diretamente na página inicial da aplicação.

### Exemplo Rápido (cURL)

```bash
curl -X POST http://localhost:8000/transcribe \
  -H "X-API-Key: SUA_CHAVE" \
  -F "file=@audio.mp3" \
  -F "model=small"
```

## 🛠️ Tecnologias

- **Backend:** FastAPI (Python 3.10)
- **IA:** Faster-Whisper (CTranslate2)
- **Frontend:** Vanilla JS, HTML5, CSS3 (Glassmorphism)
- **Containerização:** Docker

---
Desenvolvido por [Advansoftware](https://github.com/Advansoftware).
