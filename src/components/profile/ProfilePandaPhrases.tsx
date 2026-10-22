// src/components/profile/ProfilePandaPhrases.tsx
//
// «Фразы панды» в профиле: фразы, которые панда уже рассказала (мысль phrase),
// новые сверху. Это не журнал реплик, а маленькая коллекция для чтения: слова
// разбираются тапом, перевод — под плашкой, у вопросов виден ответ и реакция панды.

import { PandaPhraseView } from "@/components/panda/PandaPhraseView";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import { findPandaPhrase, type PandaPhrase } from "@/content/panda/thoughtPhrases";
import { usePandaStore } from "@/store/pandaStore";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

export function ProfilePandaPhrases() {
  const { t } = useTranslation("pandaThoughts");
  const collected = usePandaStore((s) => s.collectedPhrases);

  const phrases = useMemo(
    () =>
      [...collected]
        .reverse()
        .map((item) => findPandaPhrase(item.phraseId))
        .filter((phrase): phrase is PandaPhrase => !!phrase),
    [collected],
  );

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-nunitoBold text-title text-text">
          {t("profile.title")}
        </Text>
        {phrases.length > 0 && <PinyinToggle />}
      </View>

      {phrases.length === 0 ? (
        <Text className="font-nunito text-small text-textSecondary">
          {t("profile.empty")}
        </Text>
      ) : (
        <View className="gap-3">
          {phrases.map((phrase, i) => (
            <View key={phrase.id} className="gap-3">
              {i > 0 && <View className="h-px bg-border" />}
              <PhraseRow phrase={phrase} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PhraseRow({ phrase }: { phrase: PandaPhrase }) {
  const answer = usePandaStore((s) => s.answers[phrase.id]);
  return (
    <PandaPhraseView
      phrase={phrase}
      size={24}
      compact
      answer={answer}
      from="profile"
    />
  );
}
