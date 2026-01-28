# Simulador de Paciente - Entrenamiento de Triaje Clínico

## Overview
Aplicación de simulación de pacientes por voz para entrenamiento médico. El usuario actúa como doctor/estudiante de medicina y la IA simula un paciente con síntomas reales. Practica tus habilidades de interrogatorio clínico y triaje.

## Features
- Chat 100% por VOZ - El usuario habla como doctor
- IA actúa como paciente simulado con síntomas reales
- Español peruano natural y coloquial
- Sistema de triaje con 3 niveles (PS1, PS2, PS3)
- Dominios clínicos: Trauma/Shock, Ginecología, Clínico
- Respuestas rápidas y naturales
- Interfaz profesional con modo oscuro

## Cómo Usar
1. El paciente (IA) te saluda con sus síntomas iniciales
2. Habla como doctor para interrogar al paciente
3. Haz preguntas específicas para obtener más información
4. El paciente responde naturalmente (a veces omite detalles)
5. Practica tu triaje: ¿Es PS1, PS2 o PS3?

## Architecture

### Frontend (React + Vite)
- client/src/components/ChatInterface.tsx - Interfaz de chat por voz
- client/src/components/VoiceRecorder.tsx - Grabación de voz
- client/src/components/MessageBubble.tsx - Burbujas de mensaje
- client/src/components/TriageIndicator.tsx - Indicadores de triaje

### Backend (Express)
- server/routes.ts - Rutas API:
  - POST /api/transcribe - Transcripción de audio (Whisper)
  - POST /api/chat - Paciente simulado por IA
  - POST /api/synthesize - Síntesis de voz (TTS)

## Environment Variables
- LEMONFOX_API_KEY - API key para servicios de voz y LLM

## Triage System
- PS1 (Emergencia): Riesgo vital - Hospital inmediato
- PS2 (Urgente): Evaluación médica en horas
- PS3 (No urgente): Orientación y seguimiento
