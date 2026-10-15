// src/components/writing/modals/PracticeChoiceModal.tsx
//
// Окно перед тренировкой письма: шапка с выбранным словом или иероглифом
// (тап по иероглифу или пиньиню — озвучка) и уровнем изучения;
// для слова из поиска — где оно лежит и «Показать» ступень;
// выбор, что писать (у двусложного слова — слово целиком или один из иероглифов),
// переключатель «Повторение», свои наборы (раскрывающаяся строка),
// экзамен по выбранному слову и выбор формата
// (быстрая или полная тренировка).
//
// Панель, анимации и свайп — в BottomSheet; блоки окна — в PracticeChoiceParts.

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SetsAccordion } from "@/components/word/SetsAccordion";
import { WordHeader } from "@/components/word/WordHeader";
import { WordLocationRow } from "@/components/word/WordLocationRow";
import type { Word } from "@/content/flashcards/types";
import type { WritingExamStatus } from "@/store/wordProgressStore";
import type { FreeFormat } from "@/utils/writing/plans";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CharacterChoice,
  ExamStatusCard,
  FormatButtons,
  LevelPill,
  ReviewToggleCard,
} from "./PracticeChoiceParts";

/** Какой тултип открыт (одновременно — только один). */
type OpenHint = "translation" | "level" | "exam" | null;

interface PracticeChoiceModalProps {
  /** Слово из сетки; null — окно закрыто. */
  word: Word | null;
  /** Иероглифы двусложного слова для отдельной практики (у односложного — пусто). */
  characters: Word[];
  getLevel: (word: Word) => number;
  /** Слово или иероглиф в списке «Повторение». */
  isInReview: (word: Word) => boolean;
  onToggleReview: (word: Word) => void;
  /** Статус экзамена по письму для слова или иероглифа. */
  getExamStatus: (word: Word) => WritingExamStatus;
  /** Текущее время — для «экзамен через 9 ч». */
  now: number;
  onStartExam: (word: Word) => void;
  onStart: (word: Word, format: FreeFormat) => void;
  /** Где лежит слово («HSK 2 · Ступень 7») — только для слова из поиска. */
  location?: string;
  /** «Показать» ступень слова. */
  onShowInStep?: () => void;
  onClose: () => void;
}

/** Что показывает панель: слово и его иероглифы (снимок на момент открытия). */
interface SheetItem {
  word: Word;
  characters: Word[];
}

export function PracticeChoiceModal({
  word,
  characters,
  getLevel,
  isInReview,
  onToggleReview,
  getExamStatus,
  now,
  onStartExam,
  onStart,
  location,
  onShowInStep,
  onClose,
}: PracticeChoiceModalProps) {
  const { t } = useTranslation(["sets"]);

  // Что тренировать: при открытии — слово целиком
  const [target, setTarget] = useState<Word | null>(word);
  const [openHint, setOpenHint] = useState<OpenHint>(null);
  // «Добавить в набор» раскрыта (при каждом открытии окна — свёрнута)
  const [setsOpen, setSetsOpen] = useState(false);

  const toggleHint = (hint: Exclude<OpenHint, null>) =>
    setOpenHint((current) => (current === hint ? null : hint));
  const closeHint = () => setOpenHint(null);

  // characters в родителе пересчитываются только при смене слова, так что item стабилен
  const item = useMemo<SheetItem | null>(
    () => (word ? { word, characters } : null),
    [word, characters],
  );

  return (
    <BottomSheet
      item={item}
      onClose={onClose}
      onOpen={(opened) => {
        setTarget(opened.word);
        setSetsOpen(false);
        closeHint();
      }}
      onBackgroundTap={closeHint}
    >
      {({ word: shown, characters: shownCharacters }) => {
        // В шапке — то, что выбрано: слово целиком или один иероглиф
        const selected = target ?? shown;
        const isTwoChar = shownCharacters.length > 0;
        const selectedIsWord =
          isTwoChar && selected.vocabularyId === shown.vocabularyId;

        return (
          <>
            {/* Шапка: выбранное слово или иероглиф, тап — озвучка */}
            <WordHeader
              hanzi={selected.hanzi}
              pinyin={selected.pinyin}
              translation={t(selected.translation)}
              translationHintVisible={openHint === "translation"}
              onToggleTranslationHint={() => toggleHint("translation")}
              onCloseTranslationHint={closeHint}
            />

            <LevelPill
              level={getLevel(selected)}
              hintVisible={openHint === "level"}
              onToggleHint={() => toggleHint("level")}
              onCloseHint={closeHint}
            />

            {location && (
              <WordLocationRow
                className="mt-4"
                location={location}
                onShow={onShowInStep}
              />
            )}

            {isTwoChar && (
              <CharacterChoice
                word={shown}
                characters={shownCharacters}
                selectedId={selected.vocabularyId}
                getLevel={getLevel}
                onSelect={(option) => {
                  setTarget(option);
                  closeHint();
                }}
              />
            )}

            <ReviewToggleCard
              inReview={isInReview(selected)}
              onToggle={() => onToggleReview(selected)}
            />

            {/* Свои наборы — строка раскрывается */}
            <SetsAccordion
              className="mt-3"
              word={selected}
              expanded={setsOpen}
              onToggle={() => {
                setSetsOpen((value) => !value);
                closeHint();
              }}
            />

            {/* Экзамен по выбранному слову или иероглифу — всегда на месте */}
            <ExamStatusCard
              status={getExamStatus(selected)}
              now={now}
              isWord={selectedIsWord}
              onStart={() => onStartExam(selected)}
              hintVisible={openHint === "exam"}
              onToggleHint={() => toggleHint("exam")}
              onCloseHint={closeHint}
            />

            <FormatButtons onStart={(format) => onStart(selected, format)} />
          </>
        );
      }}
    </BottomSheet>
  );
}
