import React from "react";
import { Composition } from "remotion";
import { DocShort, type DocProps } from "./DocShort";

const EMPTY: DocProps = {
  scenes: [],
  totalMs: 100,
  fps: 30,
  music: null,
};

// DocWide = the LANDSCAPE (1920x1080) episode master — long documentaries are
// 16:9, like the genre reference channels. DocShort (1080x1920) stays for the
// native VERTICAL promo Shorts renders (build-episode.mjs renders each short
// with --frames off the same timeline).
const docMeta = (width: number, height: number) =>
  ({ props }: { props: DocProps }) => {
    const last = props.scenes[props.scenes.length - 1];
    const total = last ? last.start + last.dur : 1;
    return {
      durationInFrames: Math.max(Math.ceil((total + 0.5) * 30), 10),
      fps: 30,
      width,
      height,
      props,
    };
  };

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DocWide"
        component={DocShort}
        durationInFrames={10}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={EMPTY}
        calculateMetadata={docMeta(1920, 1080)}
      />
      <Composition
        id="DocShort"
        component={DocShort}
        durationInFrames={10}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={EMPTY}
        calculateMetadata={docMeta(1080, 1920)}
      />
    </>
  );
};
