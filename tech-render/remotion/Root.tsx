import React from "react";
import { Composition } from "remotion";
import { DiagramExplainer, type TimelineProps } from "../src/DiagramExplainer";

const EMPTY: TimelineProps = {
  spec: {} as TimelineProps["spec"],
  beats: [],
  totalMs: 1000,
  fps: 30,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DiagramExplainer"
      component={DiagramExplainer}
      durationInFrames={30}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={EMPTY}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.max(
          Math.ceil(((props.totalMs + (props.spec.tailMs ?? 900)) / 1000) * props.fps),
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
