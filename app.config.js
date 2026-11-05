const APP_VARIANT = process.env.APP_VARIANT ?? "production";

const IS_DEV = APP_VARIANT === "development";
const IS_PREVIEW = APP_VARIANT === "preview";

// Подставьте своё название приложения
const APP_NAME = "Hao Panda";
const BASE_ID = "com.kiseyka.lingopet";
const BASE_SCHEME = "lingopet";

const suffix = IS_DEV ? ".dev" : IS_PREVIEW ? ".preview" : "";
const labelSuffix = IS_DEV ? " (dev)" : IS_PREVIEW ? " (preview)" : "";
const schemeSuffix = IS_DEV ? "-dev" : IS_PREVIEW ? "-preview" : "";

export default {
  expo: {
    name: `${APP_NAME}${labelSuffix}`,
    slug: "my-chinese-pet",
    version: "1.0.0",
    orientation: "portrait",
    scheme: `${BASE_SCHEME}${schemeSuffix}`,
    userInterfaceStyle: "automatic",
    icon: "./assets/images/icon.png",
    ios: {
      bundleIdentifier: `${BASE_ID}${suffix}`,
    },
    android: {
      package: `${BASE_ID}${suffix}`,
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#E6F4FE",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-image",
      // «Слушай и повторяй»: звук в фоне и на экране блокировки; микрофон не нужен
      [
        "expo-audio",
        {
          enableBackgroundPlayback: true,
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "dbcfe450-d38d-48da-b9f5-dc46d6065b0b",
      },
    },
  },
};
