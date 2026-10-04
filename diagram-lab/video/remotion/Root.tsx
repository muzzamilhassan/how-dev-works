import React from "react";
import { Composition } from "remotion";
import { InsertExplainer, type TimelineProps } from "../src/InsertExplainer";

const EMPTY: TimelineProps = { fps: 30, beats: [], totalMs: 1000 };

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="InsertExplainer"
      component={InsertExplainer}
      durationInFrames={30}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={EMPTY}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(
          Math.ceil(((props.totalMs + 900) / 1000) * props.fps),
          10
        ),
        fps: 30,
        width: 1920,
        height: 1080,
        props,
      })}
    />
  );
};
