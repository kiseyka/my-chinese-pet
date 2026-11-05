#!/usr/bin/env python3
"""
Озвучка китайских слов для режима «Слушай и повторяй».

Голос: Kokoro v1.0, zf_xiaoyi (sid 48), лицензия Apache 2.0, работает офлайн
через sherpa-onnx. Русский перевод не генерируем — его говорит системный голос
(expo-speech) прямо в приложении.

Подготовка (один раз):
  pip install sherpa-onnx soundfile numpy
  ffmpeg должен быть в PATH
  Модель (~350 МБ, в репозиторий НЕ кладём):
    https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2
    распаковать в папку и передать её в --model

Запуск:
  npx tsx scripts/tts/export_words.ts 1 > /tmp/hsk1.json
  python3 scripts/tts/generate_zh.py --words /tmp/hsk1.json --model ~/tts/kokoro-multi-lang-v1_0

Что делает:
  1. Нейтральные тоны. В словаре Kokoro они записаны как полные (谢谢 → xièxiè,
     东西 → dōngxī «восток-запад»). Для слов, где в нашем пиньине есть слог без
     тона, строим свою запись произношения: звуки — из словаря модели по иероглифам,
     тоны — из нашего пиньиня (нейтральный — без тона), плюс правила тонов 不 и 一.
     Своя запись важнее словаря модели.
  2. Генерирует каждое слово, обрезает тишину по краям, выравнивает громкость.
  3. Кодирует в mp3 (моно, 24 кГц, 32 кбит/с) → assets/audio/zh/<ключ>.mp3.
     Уже готовые файлы не перегенерирует (--force — перегенерировать).
  4. Пересобирает манифест src/content/audio/zhAudio.ts по всем файлам папки:
     id слова → require(файл). Соответствие id ↔ файл — в assets/audio/zh/index.json.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIO_DIR = os.path.join(ROOT, "assets", "audio", "zh")
INDEX_PATH = os.path.join(AUDIO_DIR, "index.json")
MANIFEST_PATH = os.path.join(ROOT, "src", "content", "audio", "zhAudio.ts")

VOICE_SID = 48  # zf_xiaoyi
SPEED = 0.9
SAMPLE_RATE = 24000

ARROWS = {"1": "→", "2": "↗", "3": "↓", "4": "↘"}
ARROW_CHARS = set(ARROWS.values())


def file_key(word_id: str) -> str:
    """Имя файла без иероглифов: стабильный короткий хеш id."""
    return "w_" + hashlib.sha1(word_id.encode("utf8")).hexdigest()[:12]


def pinyin_tones(pinyin: str) -> list[str]:
    """Тоны слогов: '1'–'4', '5' — нейтральный. Слоги — через пробел, дефис, апостроф."""
    tones = []
    for syllable in re.split(r"[\s\-'’]+", pinyin.strip()):
        if not syllable:
            continue
        tone = "5"
        for ch in unicodedata.normalize("NFD", syllable):
            tone = {"̄": "1", "́": "2", "̌": "3", "̀": "4"}.get(ch, tone)
        tones.append(tone)
    return tones


def load_lexicon(path: str) -> dict[str, str]:
    lexicon: dict[str, str] = {}
    with open(path, encoding="utf8") as f:
        for line in f:
            parts = line.rstrip("\n").split(" ", 1)
            if len(parts) == 2:
                lexicon.setdefault(parts[0], parts[1])
    return lexicon


def retone(phones: str, tone: str) -> str:
    """Заменить тон слога: стрелку — на нужную, нейтральный — без стрелки."""
    tokens = phones.split()
    out = []
    placed = False
    for token in tokens:
        if token in ARROW_CHARS:
            if tone in ARROWS and not placed:
                out.append(ARROWS[tone])
                placed = True
            continue
        out.append(token)
    return " ".join(out)


def build_override(word: dict, lexicon: dict[str, str]) -> str | None:
    """Своя запись для слова с нейтральным тоном (или None, если не нужна / не получилось)."""
    hanzi, tones = word["hanzi"], pinyin_tones(word["pinyin"])
    if "5" not in tones or len(tones) != len(hanzi):
        return None
    # 不 и 一 перед четвёртым тоном → второй; 一 перед 1–3 тоном → четвёртый
    tones = list(tones)
    for i, ch in enumerate(hanzi[:-1]):
        nxt = tones[i + 1]
        if ch in "不一" and nxt == "4" and tones[i] in ("4", "1"):
            tones[i] = "2"
        elif ch == "一" and nxt in ("1", "2", "3") and tones[i] == "1":
            tones[i] = "4"
    parts = []
    for ch, tone in zip(hanzi, tones):
        phones = lexicon.get(ch)
        if not phones:
            return None
        parts.append(retone(phones, tone))
    return f"{hanzi} {' '.join(parts)}"


def make_tts(model_dir: str, extra_lexicon: str):
    import sherpa_onnx

    d = model_dir.rstrip("/") + "/"
    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=d + "model.onnx",
                voices=d + "voices.bin",
                tokens=d + "tokens.txt",
                data_dir=d + "espeak-ng-data",
                dict_dir=d + "dict",
                lexicon=",".join([d + "lexicon-us-en.txt", extra_lexicon, d + "lexicon-zh.txt"]),
            ),
            num_threads=4,
        ),
        rule_fsts=f"{d}date-zh.fst,{d}phone-zh.fst,{d}number-zh.fst",
        max_num_sentences=1,
    )
    return sherpa_onnx.OfflineTts(config)


def render(tts, text: str) -> np.ndarray:
    audio = tts.generate(text, sid=VOICE_SID, speed=SPEED)
    x = np.array(audio.samples, dtype=np.float32)
    if audio.sample_rate != SAMPLE_RATE:
        from scipy.signal import resample_poly

        x = resample_poly(x, SAMPLE_RATE, audio.sample_rate).astype(np.float32)
    loud = np.nonzero(np.abs(x) > 0.01)[0]
    if len(loud):
        x = x[max(loud[0] - int(0.05 * SAMPLE_RATE), 0) : loud[-1] + int(0.1 * SAMPLE_RATE)]
    peak = float(np.abs(x).max()) or 1.0
    return x / peak * 0.85


def encode_mp3(samples: np.ndarray, out_path: str):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, samples, SAMPLE_RATE)
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", tmp.name, "-ac", "1",
             "-ar", str(SAMPLE_RATE), "-b:a", "32k", out_path],
            check=True,
        )
    os.unlink(tmp.name)


def write_manifest(index: dict[str, str]):
    lines = [
        "// src/content/audio/zhAudio.ts",
        "//",
        "// СГЕНЕРИРОВАНО scripts/tts/generate_zh.py — руками не править.",
        "// Озвучка китайских слов (Kokoro, голос zf_xiaoyi): id слова → файл.",
        "",
        "export const ZH_AUDIO: Record<string, number> = {",
    ]
    for word_id in sorted(index):
        lines.append(f'  {json.dumps(word_id, ensure_ascii=False)}: require("@/assets/audio/zh/{index[word_id]}.mp3"),')
    lines += ["};", ""]
    os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf8") as f:
        f.write("\n".join(lines))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--words", required=True, help="JSON из export_words.ts")
    parser.add_argument("--model", required=True, help="папка kokoro-multi-lang-v1_0")
    parser.add_argument("--force", action="store_true", help="перегенерировать готовые")
    args = parser.parse_args()

    with open(args.words, encoding="utf8") as f:
        words = json.load(f)
    lexicon = load_lexicon(os.path.join(args.model, "lexicon-zh.txt"))

    os.makedirs(AUDIO_DIR, exist_ok=True)
    index: dict[str, str] = {}
    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH, encoding="utf8") as f:
            index = json.load(f)

    overrides = [o for o in (build_override(w, lexicon) for w in words) if o]
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf8") as lex:
        lex.write("\n".join(overrides) + "\n")
    tts = make_tts(args.model, lex.name)
    print(f"Своё произношение (нейтральный тон): {len(overrides)} слов", file=sys.stderr)

    made = 0
    for word in words:
        key = file_key(word["id"])
        out_path = os.path.join(AUDIO_DIR, key + ".mp3")
        index[word["id"]] = key
        if os.path.exists(out_path) and not args.force:
            continue
        encode_mp3(render(tts, word["hanzi"]), out_path)
        made += 1
    os.unlink(lex.name)

    with open(INDEX_PATH, "w", encoding="utf8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1, sort_keys=True)
    write_manifest(index)
    print(f"Готово: новых {made}, всего в манифесте {len(index)}", file=sys.stderr)


if __name__ == "__main__":
    main()
