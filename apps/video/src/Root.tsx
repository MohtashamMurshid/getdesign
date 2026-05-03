import "./index.css";
import { Composition } from "remotion";
import { LAUNCH_VIDEO_TOTAL_FRAMES } from "./generated-voiceover";
import { LaunchVideo } from "./LaunchVideo";
import { CLI_VIDEO_TOTAL_FRAMES, CliVideo } from "./CliVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        durationInFrames={LAUNCH_VIDEO_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="CliVideo"
        component={CliVideo}
        durationInFrames={CLI_VIDEO_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
