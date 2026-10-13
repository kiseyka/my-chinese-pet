// src/components/writing/modals/PracticeChoiceModal.tsx
//
// Окно перед тренировкой письма: шапка с выбранным словом или иероглифом и уровнем изучения,
// выбор, что писать (у двусложного слова — слово целиком или один из иероглифов),
// переключатель «Повторение», экзамен по выбранному слову и выбор формата
// (быстрая или полная тренировка).
//
// Панель, анимации и свайп — в BottomSheet; блоки окна — в PracticeChoiceParts.

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import type { Word } from "@/content/flashcards/types";
import type { WritingExamStatus } from "@/store/wordProgressStore";
import type { FreeFormat } from "@/utils/writing/plans";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import {
  CharacterChoice,
  ExamStatusCard,
  FormatButtons,
  LevelPill,
  ReviewToggleCard,
} from "./PracticeChoiceParts";

/** Какой тултип открыт (одновременно — только один). */
type OpenHint = "level" | "exam" | null;

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
  onClose,
}: PracticeChoiceModalProps) {
  const { t } = useTranslation(["sets"]);

  // Что тренировать: при открытии — слово целиком
  const [target, setTarget] = useState<Word | null>(word);
  const [openHint, setOpenHint] = useState<OpenHint>(null);

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
            {/* Шапка: выбранное слово или иероглиф */}
            <View className="items-center gap-1">
              <Hanzi size="lg">{selected.hanzi}</Hanzi>
              <Pinyin size="md">{selected.pinyin}</Pinyin>
              <Text
                className="text-center font-nunito text-body text-text"
                numberOfLines={2}
              >
                {t(selected.translation)}
              </Text>
            </View>

            <LevelPill
              level={getLevel(selected)}
              hintVisible={openHint === "level"}
              onToggleHint={() => toggleHint("level")}
              onCloseHint={closeHint}
            />

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
