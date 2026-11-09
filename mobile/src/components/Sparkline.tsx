import React from 'react';
import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#0D9488',
  width = 80,
  height = 30,
  strokeWidth = 2,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = data
    .map((val, idx) => {
      const x = pad + (idx / (data.length - 1)) * innerW;
      const y = pad + innerH - ((val - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  const lastVal = data[data.length - 1];
  const lastX = pad + innerW;
  const lastY = pad + innerH - ((lastVal - min) / range) * innerH;

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={lastX} cy={lastY} r={3} fill={color} />
      </Svg>
    </View>
  );
};
