import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Line,
  Polyline,
  Circle,
  Text as SvgText,
} from 'react-native-svg';

interface DataPoint {
  date: string;
  value: number;
}

interface BiomarkerChartProps {
  data: DataPoint[];
  refMin: number;
  refMax: number;
  unit: string;
  lineColor?: string;
  width?: number;
  height?: number;
}

export const BiomarkerChart: React.FC<BiomarkerChartProps> = ({
  data,
  refMin,
  refMax,
  unit,
  lineColor = '#0D9488',
  width = 320,
  height = 180,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width, height }]}>
        <Text style={styles.emptyText}>Sem dados suficientes para gerar curva.</Text>
      </View>
    );
  }

  // Ordena por data
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Padding
  const padLeft = 45;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 30;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Encontra mínimos e máximos da escala Y
  const values = sorted.map((d) => d.value);
  const minVal = Math.min(...values, refMin);
  const maxVal = Math.max(...values, refMax);
  const yPadding = (maxVal - minVal) * 0.15 || 10;
  const yMin = Math.max(0, Math.floor(minVal - yPadding));
  const yMax = Math.ceil(maxVal + yPadding);
  const yRange = yMax - yMin || 1;

  // Função para converter valor em coordenada Y
  const getY = (val: number) => {
    return padTop + chartH - ((val - yMin) / yRange) * chartH;
  };

  // Função para converter índice em coordenada X
  const getX = (index: number) => {
    if (sorted.length === 1) return padLeft + chartW / 2;
    return padLeft + (index / (sorted.length - 1)) * chartW;
  };

  // Coordenadas da faixa de referência (verde/translúcida)
  const refMinY = getY(refMin);
  const refMaxY = getY(refMax);
  const refBandTop = Math.min(refMinY, refMaxY);
  const refBandHeight = Math.abs(refMinY - refMaxY);

  // Pontos da linha
  const polylinePoints = sorted
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(' ');

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Faixa de Referência Ideal (Verde claro) */}
        <Rect
          x={padLeft}
          y={refBandTop}
          width={chartW}
          height={refBandHeight}
          fill="rgba(16, 185, 129, 0.12)"
          rx={4}
        />

        {/* Linha de Referência Máxima */}
        <Line
          x1={padLeft}
          y1={refMaxY}
          x2={padLeft + chartW}
          y2={refMaxY}
          stroke="rgba(16, 185, 129, 0.5)"
          strokeDasharray="4,4"
          strokeWidth={1}
        />
        <SvgText
          x={padLeft - 6}
          y={refMaxY + 3}
          fill="#10B981"
          fontSize={10}
          fontWeight="600"
          textAnchor="end"
        >
          {refMax}
        </SvgText>

        {/* Linha de Referência Mínima (se refMin > 0) */}
        {refMin > 0 && (
          <>
            <Line
              x1={padLeft}
              y1={refMinY}
              x2={padLeft + chartW}
              y2={refMinY}
              stroke="rgba(16, 185, 129, 0.5)"
              strokeDasharray="4,4"
              strokeWidth={1}
            />
            <SvgText
              x={padLeft - 6}
              y={refMinY + 3}
              fill="#10B981"
              fontSize={10}
              fontWeight="600"
              textAnchor="end"
            >
              {refMin}
            </SvgText>
          </>
        )}

        {/* Linha de Dados */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.5}
        />

        {/* Pontos de Dados */}
        {sorted.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isOutOfRange = d.value < refMin || d.value > refMax;
          const pointColor = isOutOfRange ? '#EF4444' : '#10B981';

          // Formatar data: 2024-08-10 -> 08/24
          const parts = d.date.split('-');
          const dateLabel = parts.length >= 2 ? `${parts[1]}/${parts[0].slice(2)}` : d.date;

          return (
            <React.Fragment key={`pt-${i}`}>
              <Circle
                cx={cx}
                cy={cy}
                r={isOutOfRange ? 5.5 : 4.5}
                fill={pointColor}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              {/* Valor sobre o ponto */}
              <SvgText
                x={cx}
                y={cy - 9}
                fill={isOutOfRange ? '#DC2626' : '#1E293B'}
                fontSize={10}
                fontWeight="700"
                textAnchor="middle"
              >
                {d.value}
              </SvgText>
              {/* Rótulo da data no eixo X */}
              <SvgText
                x={cx}
                y={padTop + chartH + 18}
                fill="#64748B"
                fontSize={9}
                textAnchor="middle"
              >
                {dateLabel}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legenda inferior */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]} />
          <Text style={styles.legendText}>Faixa de Referência ({unit})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Alterado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Normal</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 14,
    height: 10,
    borderWidth: 1,
    borderRadius: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
  },
});
