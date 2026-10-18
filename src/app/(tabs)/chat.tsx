// src/app/(tabs)/chat.tsx
//
// ЧАТ С ПАНДОЙ. Пользователь пишет по-русски, по-китайски или пиньинем —
// панда отвечает коротко по-китайски, в основном словами, которые он уже учит,
// и на тему текущего этапа пути. Сервер: server/panda-chat (см. docs/panda-chat.md).
// Тап по иероглифам — озвучка.

import SendIcon from "@/assets/images/icons/arrow-right.svg";
import { Screen } from "@/components/layout/Screen";
import { BackButton } from "@/components/ui/BackButton";
import { Hanzi } from "@/components/ui/Hanzi";
import { Pinyin } from "@/components/ui/Pinyin";
import { useSpeakHanzi } from "@/hooks/useSpeakHanzi";
import {
  getChatMessagesLeft,
  usePandaChatStore,
  type ChatMessage,
} from "@/store/pandaChatStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useWordProgressStore } from "@/store/wordProgressStore";
import { colors } from "@/theme/colors";
import { askPanda, ChatError, type ChatErrorKind } from "@/utils/panda/chatApi";
import { getChatContext } from "@/utils/panda/chatContext";
import { useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Сколько последних сообщений отправлять серверу как историю. */
const HISTORY_SIZE = 8;
const MAX_INPUT_LENGTH = 300;

const ERROR_TEXT: Record<ChatErrorKind, string> = {
  no_url:
    "Чат ещё не подключён: нет адреса сервера (EXPO_PUBLIC_PANDA_CHAT_URL).",
  offline: "Панда не услышала — нет связи. Попробуй ещё раз.",
  timeout: "Панда думала слишком долго и сбилась. Попробуй ещё раз.",
  quota: "Панда устала болтать сегодня. Приходи завтра!",
  failed: "Панда задумалась и ничего не ответила. Попробуй ещё раз.",
};

function PandaBubble({ message }: { message: ChatMessage }) {
  const { speakForced } = useSpeakHanzi();
  const showPinyin = useSettingsStore((s) => s.showPinyin);

  return (
    <View className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 gap-1">
      <Pressable
        onPress={() => speakForced(message.text)}
        accessibilityRole="button"
        accessibilityLabel="Послушать"
      >
        <Hanzi size={24}>{message.text}</Hanzi>
      </Pressable>
      {showPinyin && !!message.pinyin && (
        <Pinyin size="sm">{message.pinyin}</Pinyin>
      )}
      {!!message.ru && (
        <Text className="font-nunito text-small text-textSecondary">
          {message.ru}
        </Text>
      )}
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
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const messages = usePandaChatStore((s) => s.messages);
  const usage = usePandaChatStore((s) => s.usage);
  const messagesLeft = getChatMessagesLeft(usage);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatErrorKind | null>(null);

  const canSend = input.trim().length > 0 && !sending && messagesLeft > 0;

  const send = async () => {
    if (!canSend) return;
    const text = input.trim();
    const store = usePandaChatStore.getState();

    setInput("");
    setError(null);
    setSending(true);
    store.addMessage({ role: "user", text });

    try {
      const history = usePandaChatStore
        .getState()
        .messages.slice(-HISTORY_SIZE)
        .map(({ role, text, ru }) => ({ role, text, ru }));
      const context = getChatContext(
        useWordProgressStore.getState().flashcardWords,
      );

      const reply = await askPanda({ messages: history, ...context });
      store.addMessage({
        role: "panda",
        text: reply.zh,
        pinyin: reply.pinyin,
        ru: reply.ru,
      });
      store.countSent();
    } catch (e) {
      setError(e instanceof ChatError ? e.kind : "failed");
    } finally {
      setSending(false);
    }
  };

  const scrollToEnd = () => listRef.current?.scrollToEnd({ animated: true });

  // Клавиатура. При edge-to-edge Android сам экран не сжимает, поэтому поднимаем
  // содержимое на высоту клавиатуры (минус нижний отступ, который у экрана уже есть).
  // Высоту даёт Reanimated по системным отступам — надёжнее событий Keyboard.
  const keyboard = useAnimatedKeyboard();
  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboard.height.value - insets.bottom),
  }));

  // Клавиатура выдвинулась — последние сообщения не должны уйти под неё
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () =>
      setTimeout(scrollToEnd, 50),
    );
    return () => sub.remove();
  }, []);

  return (
    <Screen className="bg-background">
      <Animated.View style={[{ flex: 1 }, keyboardStyle]}>
        {/* Шапка */}
        <View className="flex-row items-center gap-3 py-2">
          <BackButton />
          <Text className="flex-1 font-nunitoBold text-title text-text">
            Панда
          </Text>
          {Number.isFinite(messagesLeft) && (
            <Text className="font-nunito text-small text-textSecondary">
              Осталось сегодня: {messagesLeft}
            </Text>
          )}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ gap: 10, paddingVertical: 12, flexGrow: 1 }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            item.role === "panda" ? (
              <PandaBubble message={item} />
            ) : (
              <UserBubble message={item} />
            )
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6 gap-2">
              <Hanzi size="lg">你好！</Hanzi>
              <Text className="font-nunito text-body text-textSecondary text-center">
                Напиши панде что-нибудь — по-русски или по-китайски. Она
                отвечает словами, которые ты учишь.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View className="gap-2 pt-2">
              {sending && (
                <View className="self-start rounded-2xl rounded-tl-sm bg-surface px-4 py-3">
                  <Text className="font-nunito text-body text-textSecondary">
                    Панда думает…
                  </Text>
                </View>
              )}
              {error && (
                <Text className="font-nunito text-small text-error text-center">
                  {ERROR_TEXT[error]}
                </Text>
              )}
              {messagesLeft === 0 && !error && (
                <Text className="font-nunito text-small text-textSecondary text-center">
                  На сегодня сообщения кончились. Панда ждёт тебя завтра!
                </Text>
              )}
            </View>
          }
        />

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
    </Screen>
  );
}
