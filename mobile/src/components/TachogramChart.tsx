import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';

interface TachogramChartProps {
  width?: number;
  height?: number;
}

export const TachogramChart: React.FC<TachogramChartProps> = ({
  width = 300,
  height = 100,
}) => {
  // Simula o registro minuto a minuto na madrugada
  // Pontos normais (00:00 a 02:30 ~ 60-64 BPM), pico às 03:15 (114 BPM), recuperação às 04:45
  const pointsData = [
    { time: '00:00', bpm: 62 },
    { time: '01:00', bpm: 60 },
    { time: '02:00', bpm: 64 },
    { time: '02:45', bpm: 72 },
    { time: '03:00', bpm: 95 },
    { time: '03:15', bpm: 114 }, // Pico da taquicardia
    { time: '03:30', bpm: 108 },
    { time: '04:00', bpm: 88 },
    { time: '04:30', bpm: 70 },
    { time: '05:30', bpm: 63 },
    { time: '06:30', bpm: 65 },
  ];

  const padL = 28;
  const padR = 20;
  const padT = 16;
  const padB = 22;

  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const minBpm = 50;
  const maxBpm = 125;
  const range = maxBpm - minBpm;

  const getX = (idx: number) => padL + (idx / (pointsData.length - 1)) * innerW;
  const getY = (val: number) => padT + innerH - ((val - minBpm) / range) * innerH;

  const polylineStr = pointsData.map((d, i) => `${getX(i)},${getY(d.bpm)}`).join(' ');

  // Coordenadas do pico (03:15 -> idx 5)
  const peakX = getX(5);
  const peakY = getY(114);

  return (
    <View style={[styles.container, { width }]}>
      <Svg width={width} height={height}>
        {/* Linha de Limite Normal (100 BPM) */}
        <Line
          x1={padL}
          y1={getY(100)}
          x2={padL + innerW}
          y2={getY(100)}
          stroke="#FDA4AF"
          strokeDasharray="3,3"
          strokeWidth={1}
        />
        <SvgText
          x={padL - 4}
          y={getY(100) + 3}
          fill="#E11D48"
          fontSize={8}
          fontWeight="700"
          textAnchor="end"
        >
          100
        </SvgText>

        {/* Linha Basal Normal (60 BPM) */}
        <Line
          x1={padL}
          y1={getY(60)}
          x2={padL + innerW}
          y2={getY(60)}
          stroke="#E2E8F0"
          strokeDasharray="2,2"
          strokeWidth={1}
        />
        <SvgText
          x={padL - 4}
          y={getY(60) + 3}
          fill="#94A3B8"
          fontSize={8}
          textAnchor="end"
        >
          60
        </SvgText>

        {/* Traçado do Tacograma */}
        <Polyline
          points={polylineStr}
          fill="none"
          stroke="#E11D48"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Destaque do Pico */}
        <Circle cx={peakX} cy={peakY} r={5} fill="#E11D48" stroke="#FFFFFF" strokeWidth={2} />
        <Rect
          x={peakX - 26}
          y={peakY - 18}
          width={52}
          height={14}
          rx={4}
          fill="#BE123C"
        />
        <SvgText
          x={peakX}
          y={peakY - 8}
          fill="#FFFFFF"
          fontSize={8}
          fontWeight="800"
          textAnchor="middle"
        >
          114 BPM
        </SvgText>

        {/* Eixo de Horários */}
        <SvgText x={getX(0)} y={padT + innerH + 14} fill="#94A3B8" fontSize={8} textAnchor="start">
          00:00
        </SvgText>
        <SvgText x={peakX} y={padT + innerH + 14} fill="#E11D48" fontSize={8} fontWeight="700" textAnchor="middle">
          03:15
        </SvgText>
        <SvgText x={getX(pointsData.length - 1)} y={padT + innerH + 14} fill="#94A3B8" fontSize={8} textAnchor="end">
          06:30
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    marginVertical: 8,
  },
});
