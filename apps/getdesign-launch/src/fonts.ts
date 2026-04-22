import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: fontSans } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const { fontFamily: fontMono } = loadJetBrains("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
