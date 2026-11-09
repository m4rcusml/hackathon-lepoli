import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Rect,
  Line,
  Polyline,
  Circle,
  Text as SvgText,
} from 'react-native-svg';

export interface DataPoint {
  date: string;
  value: number;
  labName?: string;
}

export type TimePeriod = '3M' | '6M' | '1A' | '5A' | 'Tudo';

interface BiomarkerChartProps {
  data: DataPoint[];
  refMin: number;
  refMax: number;
  unit: string;
  lineColor?: string;
  width?: number;
  height?: number;
  allowPeriodSelection?: boolean;
  correlationData?: {
    name: string;
    unit: string;
    color: string;
    data: DataPoint[];
  };
}

export const BiomarkerChart: React.FC<BiomarkerChartProps> = ({
  data,
  refMin,
  refMax,
  unit,
  lineColor = '#0D9488',
  width = 320,
  height = 190,
  allowPeriodSelection = true,
  correlationData,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('Tudo');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showCorrelation, setShowCorrelation] = useState<boolean>(false);

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { width, height }]}>
        <Text style={styles.emptyText}>Sem dados suficientes para gerar curva.</Text>
      </View>
    );
  }

  // Filtragem por período
  const now = new Date();
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const filtered = sorted.filter((d) => {
    if (selectedPeriod === 'Tudo') return true;
    const itemDate = new Date(d.date);
    const diffMonths = (now.getFullYear() - itemDate.getFullYear()) * 12 + (now.getMonth() - itemDate.getMonth());
    if (selectedPeriod === '3M') return diffMonths <= 3;
    if (selectedPeriod === '6M') return diffMonths <= 6;
    if (selectedPeriod === '1A') return diffMonths <= 12;
    if (selectedPeriod === '5A') return diffMonths <= 60;
    return true;
  });

  const displayData = filtered.length > 0 ? filtered : sorted;

  // Dimensões do gráfico
  const padLeft = 45;
  const padRight = 30;
  const padTop = 26;
  const padBottom = 32;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Escala Y do biomarcador principal
  const values = displayData.map((d) => d.value);
  const minVal = Math.min(...values, refMin);
  const maxVal = Math.max(...values, refMax);
  const yPadding = (maxVal - minVal) * 0.16 || 10;
  const yMin = Math.max(0, Math.floor(minVal - yPadding));
  const yMax = Math.ceil(maxVal + yPadding);
  const yRange = yMax - yMin || 1;

  const getY = (val: number) => {
    return padTop + chartH - ((val - yMin) / yRange) * chartH;
  };

  const getX = (index: number) => {
    if (displayData.length === 1) return padLeft + chartW / 2;
    return padLeft + (index / (displayData.length - 1)) * chartW;
  };

  const refMinY = getY(refMin);
  const refMaxY = getY(refMax);
  const refBandTop = Math.min(refMinY, refMaxY);
  const refBandHeight = Math.abs(refMinY - refMaxY);

  const polylinePoints = displayData
    .map((d, i) => `${getX(i)},${getY(d.value)}`)
    .join(' ');

  // Dados de correlação secundária (normalizados para a altura)
  let correlationPoints = '';
  if (showCorrelation && correlationData && correlationData.data.length > 0) {
    const cVals = correlationData.data.map((c) => c.value);
    const cMin = Math.min(...cVals);
    const cMax = Math.max(...cVals);
    const cRange = cMax - cMin || 1;
    correlationPoints = correlationData.data
      .map((d, i) => {
        const cx = padLeft + (i / (correlationData.data.length - 1)) * chartW;
        const cy = padTop + chartH - ((d.value - cMin) / cRange) * chartH;
        return `${cx},${cy}`;
      })
      .join(' ');
  }

  const activePoint = selectedPointIndex !== null ? displayData[selectedPointIndex] : null;

  return (
    <View style={styles.container}>
      {/* Barra de Filtro de Período e Correlação */}
      {allowPeriodSelection && (
        <View style={styles.controlsRow}>
          <View style={styles.periodRow}>
            {(['3M', '6M', '1A', '5A', 'Tudo'] as TimePeriod[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodChip,
                  selectedPeriod === period && styles.periodChipActive,
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setSelectedPointIndex(null);
                }}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    selectedPeriod === period && styles.periodChipTextActive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {correlationData && (
            <TouchableOpacity
              style={[
                styles.correlationToggle,
                showCorrelation && styles.correlationToggleActive,
              ]}
              onPress={() => setShowCorrelation(!showCorrelation)}
            >
              <Text
                style={[
                  styles.correlationToggleText,
                  showCorrelation && styles.correlationToggleTextActive,
                ]}
              >
                {showCorrelation ? '✕ Ocultar ' + correlationData.name : '+ Cruzar ' + correlationData.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tooltip flutuante quando o usuário clica num ponto */}
      {activePoint && (
        <View style={styles.tooltipCard}>
          <View style={styles.tooltipHeader}>
            <Text style={styles.tooltipDate}>{activePoint.date}</Text>
            <Text style={styles.tooltipLab}>{activePoint.labName || 'Laboratório'}</Text>
          </View>
          <Text style={styles.tooltipValue}>
            {activePoint.value} {unit}{' '}
            <Text style={styles.tooltipSub}>
              ({activePoint.value > refMax ? `+${(activePoint.value - refMax).toFixed(1)} acima` : activePoint.value < refMin ? `-${(refMin - activePoint.value).toFixed(1)} abaixo` : 'Na faixa ideal'})
            </Text>
          </Text>
        </View>
      )}

      {/* SVG Principal */}
      <Svg width={width} height={height}>
        {/* Faixa de Referência Ideal */}
        <Rect
          x={padLeft}
          y={refBandTop}
          width={chartW}
          height={refBandHeight}
          fill="rgba(16, 185, 129, 0.12)"
          rx={6}
        />

        {/* Linha Máxima */}
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
          fontWeight="700"
          textAnchor="end"
        >
          {refMax}
        </SvgText>

        {/* Linha Mínima */}
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
              fontWeight="700"
              textAnchor="end"
            >
              {refMin}
            </SvgText>
          </>
        )}

        {/* Linha de Correlação Cruzada Secundária (se ativa) */}
        {showCorrelation && correlationPoints && (
          <Polyline
            points={correlationPoints}
            fill="none"
            stroke={correlationData?.color || '#EF4444'}
            strokeWidth={2}
            strokeDasharray="4,3"
          />
        )}

        {/* Linha Principal de Dados */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.8}
        />

        {/* Pontos de Dados Clicáveis */}
        {displayData.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isOutOfRange = d.value < refMin || d.value > refMax;
          const isSelected = selectedPointIndex === i;
          const pointColor = isOutOfRange ? '#E11D48' : '#10B981';

          const parts = d.date.split('-');
          const dateLabel = parts.length >= 2 ? `${parts[1]}/${parts[0].slice(2)}` : d.date;

          return (
            <React.Fragment key={`pt-${i}`}>
              {/* Círculo invisível maior para clique */}
              <Circle
                cx={cx}
                cy={cy}
                r={16}
                fill="transparent"
                onPress={() => setSelectedPointIndex(isSelected ? null : i)}
              />
              {/* Ponto visível */}
              <Circle
                cx={cx}
                cy={cy}
                r={isSelected ? 7 : isOutOfRange ? 5.5 : 4.5}
                fill={pointColor}
                stroke="#FFFFFF"
                strokeWidth={2.5}
              />
              <SvgText
                x={cx}
                y={cy - 10}
                fill={isOutOfRange ? '#BE123C' : '#0F172A'}
                fontSize={10}
                fontWeight="800"
                textAnchor="middle"
              >
                {d.value}
              </SvgText>
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

      {/* Legenda Informativa */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]} />
          <Text style={styles.legendText}>Faixa de Referência ({unit})</Text>
        </View>
        {showCorrelation && correlationData && (
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: correlationData.color }]} />
            <Text style={[styles.legendText, { color: correlationData.color, fontWeight: '700' }]}>
              {correlationData.name} ({correlationData.unit})
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 4,
  },
  periodChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  periodChipActive: {
    backgroundColor: '#0D9488',
  },
  periodChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  periodChipTextActive: {
    color: '#FFFFFF',
  },
  correlationToggle: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  correlationToggleActive: {
    backgroundColor: '#E11D48',
    borderColor: '#BE123C',
  },
  correlationToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  correlationToggleTextActive: {
    color: '#FFFFFF',
  },
  tooltipCard: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tooltipDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tooltipLab: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2DD4BF',
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tooltipSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FCA5A5',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 14,
    height: 10,
    borderWidth: 1,
    borderRadius: 2,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
  },
});
