// src/components/profile/ProfileGallery.tsx
//
// Галерея в профиле: сохранённые написания сеткой по 4, новые первыми.
// Тап — окно с крупным написанием: «Переписать» (быстрая тренировка этого
// иероглифа; новое написание можно сохранить вместо старого) и «Удалить»
// (с подтверждением в том же окне).

import { Dialog, DialogButton } from "@/components/ui/Dialog";
import { Pinyin } from "@/components/ui/Pinyin";
import { HanziView } from "@/components/writing/canvas/HanziView";
import { useGameStore } from "@/store/gameStore";
import {
  sortGallery,
  useGalleryStore,
  type GalleryItem,
} from "@/store/galleryStore";
import { getCharacterWord } from "@/utils/writing/words";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

const COLUMNS = 4;
const GAP = 8;

export function ProfileGallery() {
  const router = useRouter();
  const items = useGalleryStore((s) => s.items);
  const remove = useGalleryStore((s) => s.remove);
  const sorted = useMemo(() => sortGallery(items), [items]);

  const [width, setWidth] = useState(0);
  const cell = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

  const [opened, setOpened] = useState<GalleryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => {
    setOpened(null);
    setConfirmDelete(false);
  };

  const word = opened ? getCharacterWord(opened.hanzi) : undefined;

  const rewrite = () => {
    if (!word) return;
    close();
    useGameStore.getState().setReturnTo("/profile");
    router.push({
      pathname: "/games/writing/free" as any,
      params: { wordId: word.vocabularyId, format: "quick" },
    });
  };

  return (
    <View className="rounded-2xl bg-surface p-4">
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="font-nunitoBold text-title text-text">Галерея</Text>
        {sorted.length > 0 && (
          <Text className="font-nunito text-small text-textSecondary">
            {sorted.length}
          </Text>
        )}
      </View>

      {sorted.length === 0 ? (
        <Text className="font-nunito text-small text-textSecondary">
          Здесь будут твои лучшие написания. Получилось красиво — на экране итогов
          тапни по своему иероглифу и сохрани его.
        </Text>
      ) : (
        <View
          className="flex-row flex-wrap"
          style={{ gap: GAP }}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {cell > 0 &&
            sorted.map((item) => (
              <Pressable
                key={item.hanzi}
                onPress={() => setOpened(item)}
                className="overflow-hidden rounded-xl bg-background active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel={`${item.hanzi}: твоё написание`}
              >
                <HanziView size={cell} rawStrokes={item.strokes} />
              </Pressable>
            ))}
        </View>
      )}

      {opened && (
        <Dialog
          visible
          onClose={close}
          title={confirmDelete ? `Удалить ${opened.hanzi}?` : opened.hanzi}
          message={
            confirmDelete
              ? "Написание пропадёт из галереи."
              : `Сохранено ${new Date(opened.savedAt).toLocaleDateString("ru-RU")}`
          }
          actions={
            confirmDelete ? (
              <>
                <DialogButton
                  label="Отмена"
                  onPress={() => setConfirmDelete(false)}
                />
                <DialogButton
                  label="Удалить"
                  variant="danger"
                  onPress={() => {
                    remove(opened.hanzi);
                    close();
                  }}
                />
              </>
            ) : (
              <>
                <DialogButton
                  label="Удалить"
                  onPress={() => setConfirmDelete(true)}
                />
                <DialogButton
                  label="Переписать"
                  variant="primary"
                  disabled={!word}
                  onPress={rewrite}
                />
              </>
            )
          }
        >
          {!confirmDelete && (
            <View className="items-center gap-2">
              <View className="overflow-hidden rounded-2xl bg-surface">
                <HanziView size={200} rawStrokes={opened.strokes} />
              </View>
              {word?.pinyin ? <Pinyin>{word.pinyin}</Pinyin> : null}
            </View>
          )}
        </Dialog>
      )}
    </View>
  );
}
