import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";

import { levels } from "@/content/flashcards/levels"; // 👈 твой levels.ts
import { useTranslation } from "react-i18next";

export default function LevelGameScreen() {
  const { levelId } = useLocalSearchParams();
  const { t } = useTranslation();
  console.log(levelId);
  // 🔥 находим уровень
  const level = levels.find((l) => l.id === levelId);

  if (!level) {
    return (
      <View>
        <Text>Level not found</Text>
      </View>
    );
  }

  const questions = level.questions;

  // ================= STATE =================
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  // ================= LOGIC =================
  const handleSelect = (option: string) => {
    if (isAnswered) return;

    setSelected(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setIsAnswered(false);

    const isLast = currentIndex >= questions.length - 1;

    if (isLast) {
      // 👉 конец уровня
      console.log("LEVEL FINISHED", {
        score,
        total: questions.length,
      });

      // пока просто сбрасываем (позже сделаем Result screen)
      setCurrentIndex(0);
      setScore(0);
      return;
    }

    setCurrentIndex((i) => i + 1);
  };

  // ================= UI =================
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "space-between" }}>
      {/* PROGRESS */}
      <View>
        <Text>{level.title}</Text>

        <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
          {questions.map((_, index) => (
            <View
              key={index}
              style={{
                height: 6,
                flex: 1,
                backgroundColor: index <= currentIndex ? "#B54230" : "#D6D0C2",
                borderRadius: 10,
              }}
            />
          ))}
        </View>
      </View>

      {/* QUESTION CARD */}
      <ImageBackground
        source={require("@/assets/images/card3.png")}
        style={{
          height: 250,
          justifyContent: "center",
          alignItems: "center",
        }}
        resizeMode="stretch"
      >
        <Text
          style={{
            fontSize: 60,
            fontFamily: "NotoSansSC",
          }}
        >
          {currentQuestion.hanzi}
        </Text>

        <Text style={{ marginTop: 10, color: "#7D2619" }}>
          {currentQuestion.pinyin}
        </Text>
      </ImageBackground>

      {/* OPTIONS */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {currentQuestion.options.map((option) => {
          const isCorrect = option === currentQuestion.correctAnswer;

          return (
            <TouchableOpacity
              key={option}
              onPress={() => handleSelect(option)}
              disabled={isAnswered}
              style={{
                width: "48%",
                padding: 14,
                borderRadius: 10,
                backgroundColor:
                  isAnswered && isCorrect ? "#7D2619" : "#F4ECDF",
                borderWidth: 1,
                borderColor: "#DFD4C2",
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: isAnswered && isCorrect ? "white" : "#2C241E",
                }}
              >
                {t(option)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* NEXT BUTTON */}
      <TouchableOpacity onPress={nextQuestion}>
        <View
          style={{
            height: 50,
            backgroundColor: "#7D2619",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white" }}>{t("common.next")}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}
