# Asistente Médico - Triaje Clínico por Voz

## Overview
Aplicación web profesional de chat médico por VOZ, enfocada en triaje clínico seguro, orientación médica, y detección temprana de emergencias. La app funciona como un asistente médico de primera línea, empático, claro y legalmente seguro.

## Features
- Chat 100% por voz (voz a texto + texto a voz)
- Lenguaje: Español (LATAM - Perú)
- Sistema de triaje con 3 niveles de prioridad (PS1, PS2, PS3)
- Dominios clínicos: Trauma/Shock, Ginecología, Clínico
- Modo texto alternativo
- Reproducción automática de respuestas
- Interfaz médica profesional con dark mode

## Architecture

### Frontend (React + Vite)
- `client/src/components/ChatInterface.tsx` - Interfaz principal de chat
- `client/src/components/VoiceRecorder.tsx` - Grabación de voz
- `client/src/components/MessageBubble.tsx` - Burbujas de mensaje
- `client/src/components/TriageIndicator.tsx` - Indicadores de triaje
- `client/src/components/VoiceWaveform.tsx` - Visualización de audio

### Backend (Express)
- `server/routes.ts` - Rutas API:
  - `POST /api/transcribe` - Transcripción de audio (Whisper)
  - `POST /api/chat` - Chat con IA médica
  - `POST /api/synthesize` - Síntesis de voz (TTS)

### Data Models (`shared/schema.ts`)
- Message: Mensajes de chat con audio y triaje
- ChatSession: Sesiones de conversación
- TriagePriority: PS1 (Emergencia), PS2 (Urgente), PS3 (No urgente)
- ClinicalDomain: trauma_shock, gynecology, clinical

## Environment Variables
- `LEMONFOX_API_KEY` - API key para servicios de voz y LLM

## Running the Application
```bash
npm run dev
```

## Triage System
- **PS1 (Emergencia)**: Riesgo vital - Hospital inmediato
- **PS2 (Urgente)**: Evaluación médica en horas
- **PS3 (No urgente)**: Orientación y seguimiento

## Safety Rules
- NO diagnostica enfermedades
- NO receta medicamentos ni dosis
- NO indica tratamientos específicos
- Siempre deriva ante duda sobre riesgo vital
- Especial cuidado con: niños, embarazadas, salud mental, dolor torácico
