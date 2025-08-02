# Задача: Whisper Live — субтитры в реальном времени

## 📋 Описание

Создать веб-приложение для транскрибации речи в реальном времени с использованием Whisper AI модели, работающей прямо в
браузере через WebAssembly. Приложение должно захватывать аудио с микрофона, преобразовывать речь в текст и отображать
субтитры в режиме реального времени.

## 🎯 Цели

1. Реализовать захват аудио с микрофона через Web Audio API
2. Интегрировать Whisper модель через Transformers.js (WASM)
3. Создать режим телесуфлёра для стримеров и докладчиков
4. Добавить автоматический перевод на другие языки
5. Обеспечить низкую задержку (< 2 секунд)

## 🔧 Технические требования

### Основные компоненты:

1. **Захват аудио**
   - Web Audio API для доступа к микрофону
   - AudioWorklet для обработки аудио в отдельном потоке
   - Буферизация аудио чанков (30 секунд макс)
   - VAD (Voice Activity Detection) для определения речи

2. **Whisper интеграция**
   - Модель: whisper-tiny или whisper-base (для скорости)
   - Transformers.js для загрузки и выполнения модели
   - Web Workers для обработки в фоне
   - Кеширование модели в IndexedDB

3. **UI/UX**
   - Минималистичный интерфейс с фокусом на субтитрах
   - Настраиваемый размер и стиль текста
   - Полноэкранный режим телесуфлёра
   - История транскрипций с возможностью экспорта

4. **Функции**
   - Распознавание на 100+ языках
   - Автоперевод через внешнее API или локальную модель
   - Горячие клавиши для управления
   - Сохранение настроек в localStorage

## 📐 Архитектура

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Микрофон      │────▶│  Audio Worklet   │────▶│  Web Worker     │
│  (getUserMedia) │     │  (обработка)     │     │  (Whisper)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                            │
                                                            ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   UI Layer      │◀────│  Translation     │◀────│  Text Output    │
│  (субтитры)     │     │  (опционально)   │     │  (результат)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## 🎨 Дизайн-требования

### Режимы отображения:

1. **Компактный режим**
   - Плавающая панель с субтитрами
   - Прозрачный фон
   - Возможность перетаскивания

2. **Режим телесуфлёра**
   - Полноэкранный режим
   - Крупный текст на темном фоне
   - Автопрокрутка с настраиваемой скоростью
   - Индикатор текущей строки

3. **Режим истории**
   - Полная транскрипция с таймкодами
   - Поиск по тексту
   - Экспорт в SRT, VTT, TXT форматы

### Цветовые схемы:

- Светлая/темная темы
- Высококонтрастный режим
- Настраиваемые цвета текста и фона

## 💻 Примерная структура кода

```javascript
// Основной класс приложения
class WhisperLive {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.processor = null;
    this.whisperWorker = null;
    this.transcriptionHistory = [];
  }

  async initialize() {
    // Загрузка модели Whisper
    await this.loadWhisperModel();

    // Инициализация аудио
    await this.setupAudioCapture();

    // Настройка UI
    this.setupUI();
  }

  async loadWhisperModel() {
    // Загрузка через Transformers.js
    const { pipeline } = await import('@xenova/transformers');
    this.transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
  }

  async setupAudioCapture() {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // AudioWorklet для обработки
    await this.audioContext.audioWorklet.addModule('audio-processor.js');
    this.processor = new AudioWorkletNode(this.audioContext, 'audio-processor');

    source.connect(this.processor);
    this.processor.port.onmessage = this.handleAudioData.bind(this);
  }

  handleAudioData(event) {
    // Отправка аудио в Web Worker для транскрипции
    this.whisperWorker.postMessage({
      type: 'transcribe',
      audio: event.data.audio,
    });
  }
}
```

## 🚀 План реализации

### Фаза 1: MVP (2-3 дня)

1. Базовый захват аудио
2. Интеграция Whisper-tiny модели
3. Простой UI с отображением текста
4. Сохранение транскрипции

### Фаза 2: Основные функции (2-3 дня)

1. Режим телесуфлёра
2. Настройки отображения
3. История с поиском
4. Экспорт в разные форматы

### Фаза 3: Продвинутые функции (3-4 дня)

1. Автоперевод текста
2. VAD для оптимизации
3. Горячие клавиши
4. Улучшенная производительность

## 📦 Зависимости

- @xenova/transformers (для Whisper)
- workbox (для кеширования)
- Опционально: Google Translate API или LibreTranslate

## 🎯 Критерии успеха

- Задержка транскрипции < 2 секунд
- Точность распознавания > 90% для четкой речи
- Работа без интернета после загрузки модели
- Поддержка минимум 10 языков
- Плавная работа на устройствах среднего класса

## 📱 Совместимость

- Chrome 89+
- Edge 89+
- Firefox 76+ (с ограничениями)
- Safari 14.1+ (с ограничениями)

## 🔗 Референсы

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (для сравнения)
- [Whisper Web](https://huggingface.co/spaces/Xenova/whisper-web)
- [OBS Studio](https://obsproject.com/) (для идей телесуфлёра)
- [Otter.ai](https://otter.ai/) (для UX идей)
