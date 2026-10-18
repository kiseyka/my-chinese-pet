// src/app/(tabs)/chat.tsx
//
// ЧАТ С ПАНДОЙ. Пользователь пишет по-русски, по-китайски или пиньинем —
// панда отвечает коротко по-китайски, в основном словами, которые он уже учит,
// и на тему текущего этапа пути. Сервер: server/panda-chat (см. docs/panda-chat.md).
// Реплика панды разбита на слова, пиньинь подписан над каждым словом (глазик в шапке
// прячет его). Тап по слову — панель слова: перевод из словаря, «Повторение»,
// «Спросить панду». Перевод всей фразы спрятан под кнопкой «Перевод».
// Список перевёрнут (inverted): новые сообщения сами оказываются внизу у поля ввода,
// прокручивать после каждого ответа не нужно.

import SendIcon from "@/assets/images/icons/arrow-right.svg";
import VolumeIcon from "@/assets/images/icons/volume.svg";
import {
  ChatWordSheet,
  type ChatWordTarget,
} from "@/components/panda/ChatWordSheet";
import { PandaText } from "@/components/panda/PandaText";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import { PinyinToggle } from "@/components/ui/PinyinToggle";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import {
  getChatMessagesLeft,
  usePandaChatStore,
  type ChatMessage,
} from "@/store/pandaChatStore";
import { useProfileStore } from "@/store/profileStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { askPanda, ChatError, type ChatErrorKind } from "@/utils/panda/chatApi";
import { getChatContext } from "@/utils/panda/chatContext";
import type { ChatSegment } from "@/utils/panda/chatSegments";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Сколько последних сообщений отправлять серверу как историю. */
const HISTORY_SIZE = 12;
const MAX_INPUT_LENGTH = 300;

const ERROR_TEXT: Record<ChatErrorKind, string> = {
  no_url:
    "Чат ещё не подключён: нет адреса сервера (EXPO_PUBLIC_PANDA_CHAT_URL).",
  offline: "Панда не услышала — нет связи.",
  timeout: "Панда думала слишком долго и сбилась.",
  quota: "Панда устала болтать сегодня. Приходи завтра!",
  failed: "Панда задумалась и ничего не ответила.",
};

function PandaBubble({
  message,
  onWordPress,
}: {
  message: ChatMessage;
  onWordPress: (segment: ChatSegment, sentence: string) => void;
}) {
  const { speakForced } = useSpeakHanzi();
  const [showTranslation, setShowTranslation] = useState(false);

  return (
    <View className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 gap-2">
      {/* Слова: пиньинь над каждым, тап по слову — панель слова */}
      <PandaText
        text={message.text}
        syllables={message.syllables}
        words={message.words}
        onWordPress={(segment) => onWordPress(segment, message.text)}
      />

      {showTranslation && !!message.ru && (
        <Text className="font-nunito text-small text-textSecondary">
          {message.ru}
        </Text>
      )}

      {/* Послушать фразу и открыть перевод */}
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={() => speakForced(message.text)}
          hitSlop={8}
          className="active:opacity-60"
          accessibilityRole="button"
          accessibilityLabel="Послушать"
        >
          <VolumeIcon width={20} height={20} color={colors.primary} />
        </Pressable>
        {!!message.ru && (
          <Pressable
            onPress={() => setShowTranslation((value) => !value)}
            hitSlop={8}
            className="active:opacity-60"
            accessibilityRole="button"
          >
            <Text className="font-nunito text-small text-primary">
              {showTranslation ? "Скрыть перевод" : "Перевод"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <View className="self-end max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3">
      <Text className="font-nunito text-body text-white">{message.text}</Text>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const messages = usePandaChatStore((s) => s.messages);
  /** Для перевёрнутого списка: самое новое — первым. */
  const newestFirst = useMemo(() => [...messages].reverse(), [messages]);
  const usage = usePandaChatStore((s) => s.usage);
  const messagesLeft = getChatMessagesLeft(usage);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatErrorKind | null>(null);
  const [wordTarget, setWordTarget] = useState<ChatWordTarget | null>(null);

  const canSend = input.trim().length > 0 && !sending && messagesLeft > 0;

  /** Спросить панду: последнее сообщение в истории — от пользователя. */
  const requestReply = async () => {
    const store = usePandaChatStore.getState();
    setError(null);
    setSending(true);

    try {
      const history = usePandaChatStore
        .getState()
        .messages.slice(-HISTORY_SIZE)
        // Реплики панды — со словами через пробел: так модель видит формат, который
        // должна выдать (см. server/panda-chat/src/prompt.ts)
        .map(({ role, text, ru, words }) => ({
          role,
          text: words?.length ? words.join(" ") : text,
          ru,
        }));
      const context = getChatContext(
        useWordProgressStore.getState().flashcardWords,
      );

      const reply = await askPanda({
        messages: history,
        name: useProfileStore.getState().name,
        ...context,
      });
      store.addMessage({
        role: "panda",
        text: reply.zh,
        pinyin: reply.pinyin,
        syllables: reply.syllables,
        words: reply.words,
        ru: reply.ru,
      });
      store.countSent();
    } catch (e) {
      setError(e instanceof ChatError ? e.kind : "failed");
    } finally {
      setSending(false);
    }
  };

  const send = () => {
    if (!canSend) return;
    usePandaChatStore.getState().addMessage({ role: "user", text: input.trim() });
    setInput("");
    requestReply();
  };

  /** Панда не ответила — спросить ещё раз, не печатая сообщение заново. */
  const lastIsUser = messages[messages.length - 1]?.role === "user";
  const canRetry = !!error && error !== "quota" && lastIsUser && !sending;

  // Клавиатура. При edge-to-edge Android сам экран не сжимает, поэтому поднимаем
  // содержимое на высоту клавиатуры (минус нижний отступ, который у экрана уже есть).
  // Высоту даёт Reanimated по системным отступам — надёжнее событий Keyboard.
  const keyboard = useAnimatedKeyboard();
  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboard.height.value - insets.bottom),
  }));

  return (
    <Screen className="bg-background">
      <Animated.View style={[{ flex: 1 }, keyboardStyle]}>
        {/* Шапка */}
        <View className="flex-row items-center gap-3 py-2">
          <BackButton />
          <Text className="flex-1 font-nunitoBold text-title text-text">
            Панда
          </Text>
          <PinyinToggle />
          {Number.isFinite(messagesLeft) && (
            <Text className="font-nunito text-small text-textSecondary">
              Осталось сегодня: {messagesLeft}
            </Text>
          )}
        </View>

        {messages.length === 0 && !sending ? (
          <View className="flex-1 items-center justify-center px-6 gap-2">
            <Hanzi size="lg">你好！</Hanzi>
            <Text className="font-nunito text-body text-textSecondary text-center">
              Напиши панде что-нибудь — по-русски или по-китайски. Она отвечает
              словами, которые ты учишь.
            </Text>
          </View>
        ) : (
          <FlatList
            inverted
            data={newestFirst}
            keyExtractor={(item) => item.id}
            className="flex-1"
            contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            renderItem={({ item }) =>
              item.role === "panda" ? (
                <PandaBubble
                  message={item}
                  onWordPress={(segment, sentence) =>
                    setWordTarget({ segment, sentence })
                  }
                />
              ) : (
                <UserBubble message={item} />
              )
            }
            // В перевёрнутом списке «шапка» — внизу, сразу над полем ввода
            ListHeaderComponent={
              <View className="gap-2">
                {sending && (
                  <View className="self-start rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
                    <Text className="font-nunito text-body text-textSecondary">
                      Панда думает…
                    </Text>
                  </View>
                )}
                {error && (
                  <View className="items-center gap-2">
                    <Text className="font-nunito text-small text-error text-center">
                      {ERROR_TEXT[error]}
                    </Text>
                    {canRetry && (
                      <Pressable
                        onPress={requestReply}
                        className="rounded-full border border-primary px-4 py-2 active:opacity-70"
                        accessibilityRole="button"
                      >
                        <Text className="font-nunito text-body text-primary">
                          Спросить ещё раз
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
                {messagesLeft === 0 && !error && (
                  <Text className="font-nunito text-small text-textSecondary text-center">
                    На сегодня сообщения кончились. Панда ждёт тебя завтра!
                  </Text>
                )}
              </View>
            }
          />
        )}

        {/* Поле ввода */}
        <View className="flex-row items-end gap-2 pt-2 pb-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Сообщение панде"
            placeholderTextColor={colors.textSecondary}
            maxLength={MAX_INPUT_LENGTH}
            multiline
            editable={messagesLeft > 0}
            className="flex-1 min-h-12 max-h-32 rounded-2xl bg-surface px-4 py-3 font-nunito text-body text-text"
            accessibilityLabel="Сообщение панде"
          />
          <Pressable
            onPress={send}
            disabled={!canSend}
            className={`items-center justify-center rounded-full bg-primary ${
              canSend ? "active:opacity-70" : "opacity-40"
            }`}
            style={{ width: 48, height: 48 }}
            accessibilityRole="button"
            accessibilityLabel="Отправить"
          >
            <SendIcon width={24} height={24} color="white" />
          </Pressable>
        </View>
      </Animated.View>

      <ChatWordSheet target={wordTarget} onClose={() => setWordTarget(null)} />
    </Screen>
  );
}
