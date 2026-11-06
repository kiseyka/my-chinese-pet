# Hao Panda — learn Chinese with a pet panda

A React Native app for learning Chinese characters (HSK 1–4). You study words through translation, writing and tone trainings, and progress feeds a virtual pet panda: she talks, plays mini-games, and lives in a room you decorate with coins earned from practice.

I started this project to move from web frontend into mobile development.

## Features

- **Learning path.** One path through HSK themes split into stages. Each stage has two tracks, translation and writing; a word counts as passed at 1 progress dot and mastered at 3.
- **Writing practice.** Stroke-by-stroke character writing on a canvas with stroke checking (data from `hanzi-writer-data`), from guided lessons to writing from memory.
- **Flashcards and custom sets.** Translation trainings, reverse translation, self-check mode and user-made word sets.
- **Dictionary.** Search, HSK filters, a word sheet with per-word progress and quick writing practice.
- **Tones trainer** and text-to-speech pronunciation (`expo-speech`).
- **Daily words** with spaced "Remember this?" reviews.
- **Pet panda.** Rive animations, a phrase of the day, riddles and mini-games that reward coins.
- **Shop and room.** Buy furniture, posters and backgrounds and see them applied in the panda's room.
- **Profile.** Activity log and progress summary.
- **Localization:** English and Russian UI.

## Tech stack

- **Expo SDK 56** with **Expo Router** (file-based routing)
- **React Native 0.85**, **React 19**, **TypeScript**
- **Zustand** for state, persisted to **AsyncStorage**, with store migrations
- **NativeWind** (Tailwind CSS for React Native)
- **Reanimated 4**, **Gesture Handler**, **react-native-svg**
- **Rive** for panda and room animations
- **i18next / react-i18next** for localization
- **EAS** build profiles with separate development / preview / production app variants

## Project structure

```
src/
  app/         routes (Expo Router): tabs, trainings, path, shop, profile
  components/  UI grouped by feature (writing, flashcards, path, panda, shop…)
  hooks/       screen and feature logic (screens stay mostly layout)
  store/       Zustand stores + migrations
  content/     static content: words, path themes, shop catalog, panda phrases
  utils/       pure logic: stages, progress, stroke checking, search
  i18n/        locales
docs/          code maps for larger features (path, writing, dictionary, panda…)
```

Larger features have a short code map in [`docs/`](docs), e.g. [`docs/writing.md`](docs/writing.md) and [`docs/path.md`](docs/path.md).

## Getting started

Requires Node.js and the Expo tooling. Some native modules (Rive, Nitro) don't run in Expo Go, so use a development build.

```bash
npm install

# development build
APP_VARIANT=development npx expo run:android
# or
APP_VARIANT=development npx expo run:ios

# then start the dev server
npx expo start
```

## Development notes

Work goes through feature branches and pull requests (`feat/…`, `fix/…`, `refactor/…`). I use AI coding assistants as part of my workflow; product decisions, design and review are mine.