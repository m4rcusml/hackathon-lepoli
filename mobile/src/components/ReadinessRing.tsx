import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ReadinessRingProps {
  score: number; // 0 a 100
  isAnomaly: boolean;
  size?: number;
  strokeWidth?: number;
}

export const ReadinessRing: React.FC<ReadinessRingProps> = ({
  score,
  isAnomaly,
  size = 110,
  strokeWidth = 9,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  const ringColor = isAnomaly ? '#E11D48' : '#0D9488';
  const trackColor = isAnomaly ? '#FFE4E6' : '#CCFBF1';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track / Fundo do anel */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progresso Dinâmico */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Conteúdo Central */}
      <View style={styles.centerContent}>
        <Text style={[styles.scoreNumber, { color: ringColor }]}>{score}</Text>
        <Text style={styles.scoreMax}>/ 100</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  scoreMax: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
});
