import { quizData } from "@/content/quiz"; // путь под себя
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const ProfileScreen = () => {
  const { width, height } = useWindowDimensions();
  const cardHeight = Math.min(height * 0.45, 380);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const currentQuestion = quizData[currentIndex];
  const handleAnswer = (option: any) => {
    setSelected(option);
    setIsAnswered(true);

    if (option === quizData[currentIndex].correctAnswer) {
      setScore((s) => s + 1);
    }
  };
  const nextQuestion = () => {
    setSelected(null);
    setIsAnswered(false);
    currentIndex < quizData.length - 1
      ? setCurrentIndex((i) => i + 1)
      : setCurrentIndex(0);
  };
  const handleSelect = (option: string) => {
    setSelected(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };
  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          //   gap: 50,
          justifyContent: "space-between",
          alignItems: "center",
          height: "100%",
          paddingHorizontal: 20,
        }}
      >
        <Image
          source={require("@/assets/images/sakura.png")}
          style={{
            position: "absolute",
            top: 20,
            right: 0,
            width: 180,
            height: 180,
            zIndex: 10,
          }}
          resizeMode="cover"
        />
        <View>
          <Text>{t("games.card")}</Text>

          <View className="flex-row gap-2 mt-4 self-center">
            {quizData.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 40,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor:
                    index <= currentIndex ? "#B54230" : "#BDB4A0",
                }}
              />
            ))}
          </View>
        </View>

        <ImageBackground
          source={require("@/assets/images/card3.png")}
          resizeMode="stretch"
          className="mt-6 justify-center items-center"
          style={{
            height: cardHeight,
            width: "90%",
            aspectRatio: 3 / 4,
            alignSelf: "center",
          }}
          imageStyle={{
            width: "100%",
            height: "100%",
          }}
        >
          <View className="flex flex-col justify-between gap-10">
            <Text
              className="text-text"
              style={{
                fontSize: 64,
                textAlign: "center",
                fontFamily: "NotoSansSC",
              }}
            >
              {currentQuestion.question}
            </Text>

            <Text className="text-center text-xl text-primary">
              {currentQuestion.pinyin}
            </Text>
          </View>
        </ImageBackground>

        <View>
          <View className="flex-row flex-wrap justify-between gap-2">
            {currentQuestion.options.map((option) => {
              const isCorrect = option === currentQuestion.correctAnswer;

              return (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelect(option)}
                  disabled={isAnswered}
                  className={`w-[48%] py-4 px-4 rounded-xl border ${
                    isAnswered && isCorrect
                      ? "bg-primary border-[#E1D8C9]"
                      : "bg-[#F4ECDF] border-border"
                  }`}
                >
                  <Text
                    className={`text-center ${
                      isAnswered && isCorrect ? "text-white" : "text-text"
                    }`}
                  >
                    {t(option)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <TouchableOpacity onPress={nextQuestion}>
          <ImageBackground
            source={require("@/assets/images/button.png")}
            resizeMode="contain"
            className="w-72 h-20 justify-center items-center"
            imageStyle={{
              width: "100%",
              height: "100%",
            }}
          >
            <Text className="text-white font-bold">{t("common.next")}</Text>
          </ImageBackground>
        </TouchableOpacity>
      </View>
      <Image
        source={require("@/assets/images/bamboo.png")}
        style={{
          position: "absolute",
          bottom: 20,
          left: -55,
          width: 180,
          height: 280,
          zIndex: -2,
        }}
        resizeMode="cover"
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
