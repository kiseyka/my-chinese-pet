// src/components/writing/gallery/GallerySaveDialog.tsx
//
// «Сохранить в галерею?» — окно с только что написанным иероглифом.
// Если в галерее уже есть этот иероглиф, рядом показано старое написание,
// и кнопка называется «Заменить».

import { Dialog, DialogButton } from "@/components/ui/Dialog";
import type { WritingPoint } from "@/store/gameStore";
import { useGalleryStore } from "@/store/galleryStore";
import { Text, View } from "react-native";
import { HanziView } from "../canvas/HanziView";

const PREVIEW = 112;

export interface GalleryCandidate {
  hanzi: string;
  strokes: WritingPoint[][];
}

interface GallerySaveDialogProps {
  candidate: GalleryCandidate | null;
  onClose: () => void;
}

export function GallerySaveDialog({
  candidate,
  onClose,
}: GallerySaveDialogProps) {
  const existing = useGalleryStore((s) =>
    candidate ? s.items[candidate.hanzi] : undefined,
  );
  const save = useGalleryStore((s) => s.save);

  if (!candidate) return null;

  return (
    <Dialog
      visible
      onClose={onClose}
      title={existing ? "Заменить в галерее?" : "Сохранить в галерею?"}
      message={
        existing
          ? `В галерее уже есть ${candidate.hanzi}. Новое написание заменит старое.`
          : "Написание появится в профиле."
      }
      actions={
        <>
          <DialogButton label="Отмена" onPress={onClose} />
          <DialogButton
            label={existing ? "Заменить" : "Сохранить"}
            variant="primary"
            onPress={() => {
              save(candidate.hanzi, candidate.strokes);
              onClose();
            }}
          />
        </>
      }
    >
      <View className="flex-row justify-center gap-4">
        {existing && (
          <View className="items-center gap-1 opacity-60">
            <View className="overflow-hidden rounded-xl bg-surface">
              <HanziView size={PREVIEW} rawStrokes={existing.strokes} />
            </View>
            <Text className="font-nunito text-caption text-textSecondary">
              было
            </Text>
          </View>
        )}
        <View className="items-center gap-1">
          <View className="overflow-hidden rounded-xl bg-surface">
            <HanziView size={PREVIEW} rawStrokes={candidate.strokes} />
          </View>
          {existing && (
            <Text className="font-nunito text-caption text-primary">новое</Text>
          )}
        </View>
      </View>
    </Dialog>
  );
}
