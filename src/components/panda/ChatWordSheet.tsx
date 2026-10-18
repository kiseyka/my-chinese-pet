// src/components/panda/ChatWordSheet.tsx
//
// Панель слова из реплики панды (тап по слову в чате).
//   - иероглиф, пиньинь, перевод из словаря приложения (тап по иероглифу — озвучка);
//   - у слова из нескольких иероглифов — каждый иероглиф с переводом из словаря
//     (помогает понять «吃过» или «冰淇淋», которых нет в словаре целиком);
//   - «Повторение» — если слово есть в словаре: отложить его, чтобы потом потренировать;
//   - «Спросить панду» — что слово значит именно в этой фразе. Это запрос к модели,
//     поэтому он тратит одно сообщение из дневного лимита. Ответ запоминается,
//     пока открыт чат: повторный тап по тому же слову не тратит лимит.

import ChatIcon from "@/assets/images/icons/message-circle-more.svg";
import ReviewIcon from "@/assets/images/icons/bookmark.svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { ActionChip } from "@/components/word/ActionChip";
import { WordHeader } from "@/components/word/WordHeader";
import {
  getChatMessagesLeft,
  usePandaChatStore,
} from "@/store/pandaChatStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { ChatError, explainWord } from "@/utils/panda/chatApi";
import {
  findWordByHanzi,
  type ChatSegment,
} from "@/utils/panda/chatSegments";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export interface ChatWordTarget {
  segment: ChatSegment;
  /** Вся реплика панды — чтобы панда объяснила слово в контексте. */
  sentence: string;
}

interface ChatWordSheetProps {
  target: ChatWordTarget | null;
  onClose: () => void;
}

type Explanation =
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error"; text: string };

const ERROR_TEXT = {
  quota: "Панда устала болтать сегодня. Приходи завтра!",
  other: "Панда не смогла ответить. Попробуй ещё раз.",
};

export function ChatWordSheet({ target, onClose }: ChatWordSheetProps) {
  const { t } = useTranslation();
  const review = useWordProgressStore((s) => s.review);
  const toggleReview = useWordProgressStore((s) => s.toggleReview);
  const usage = usePandaChatStore((s) => s.usage);
  const messagesLeft = getChatMessagesLeft(usage);

  // Ответы панды по словам — пока открыт чат
  const cache = useRef(new Map<string, Explanation>());
  const [, rerender] = useState(0);
  const update = (key: string, value: Explanation) => {
    cache.current.set(key, value);
    rerender((n) => n + 1);
  };

  const ask = async (shown: ChatWordTarget, key: string) => {
    if (cache.current.get(key)?.status === "loading") return;
    update(key, { status: "loading" });
    try {
      const text = await explainWord(shown.segment.text, shown.sentence);
      usePandaChatStore.getState().countSent();
      update(key, { status: "done", text });
    } catch (e) {
      const quota = e instanceof ChatError && e.kind === "quota";
      update(key, {
        status: "error",
        text: quota ? ERROR_TEXT.quota : ERROR_TEXT.other,
      });
    }
  };

  return (
    <BottomSheet item={target} onClose={onClose}>
      {(shown) => {
        const { segment } = shown;
        const word = segment.word;
        const key = `${segment.text}|${shown.sentence}`;
        const explanation = cache.current.get(key);
        const inReview = !!word && !!review[word.vocabularyId];
        const canAsk =
          messagesLeft > 0 &&
          explanation?.status !== "loading" &&
          explanation?.status !== "done";

        return (
          <>
            <WordHeader
              hanzi={segment.text}
              pinyin={segment.pinyin || word?.pinyin || ""}
              translation={
                word ? t(word.translation) : "Этого слова пока нет в словаре"
              }
            />

            {/* По иероглифам */}
            {Array.from(segment.text).length > 1 && (
              <View className="mt-4 gap-1">
                {Array.from(segment.text).map((char, i) => {
                  const charWord = findWordByHanzi(char);
                  return (
                    <View key={i} className="flex-row items-center gap-3">
                      <Hanzi size="sm">{char}</Hanzi>
                      {!!charWord && (
                        <Pinyin size="sm" style={{ minWidth: 40 }}>
                          {charWord.pinyin}
                        </Pinyin>
                      )}
                      <Text
                        className="flex-1 font-nunito text-small text-textSecondary"
                        numberOfLines={1}
                      >
                        {charWord ? t(charWord.translation) : "нет в словаре"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View className="mt-5 flex-row gap-2">
              {word && (
                <ActionChip
                  Icon={ReviewIcon}
                  label="Повторение"
                  active={inReview}
                  onPress={() => toggleReview(word.vocabularyId)}
                />
              )}
              <ActionChip
                Icon={ChatIcon}
                label="Спросить панду"
                active={explanation?.status === "done"}
                onPress={() => {
                  if (canAsk) ask(shown, key);
                }}
              />
            </View>

            {explanation && (
              <View className="mt-4 rounded-2xl bg-background/60 p-3">
                <Text
                  className={`font-nunito text-body ${
                    explanation.status === "error"
                      ? "text-error"
                      : explanation.status === "loading"
                        ? "text-textSecondary"
                        : "text-text"
                  }`}
                >
                  {explanation.status === "loading"
                    ? "Панда думает…"
                    : explanation.text}
                </Text>
              </View>
            )}

            {!explanation && messagesLeft === 0 && (
              <Text className="mt-4 font-nunito text-small text-textSecondary">
                На сегодня вопросы к панде кончились.
              </Text>
            )}
          </>
        );
      }}
    </BottomSheet>
  );
}
