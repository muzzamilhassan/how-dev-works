import React from "react";
import { Composition } from "remotion";
import { DocShort, type DocProps } from "./DocShort";

const EMPTY: DocProps = {
  scenes: [],
  totalMs: 100,
  fps: 30,
  music: null,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DocShort"
      component={DocShort}
      durationInFrames={10}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={EMPTY}
      calculateMetadata={({ props }) => {
        const last = props.scenes[props.scenes.length - 1];
        const total = last ? last.start + last.dur : 1;
        return {
          durationInFrames: Math.max(Math.ceil((total + 0.5) * 30), 10),
          fps: 30,
          width: 1920,
          height: 1080,
          props,
        };
      }}
    />
  );
};
