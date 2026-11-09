import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Watch,
  Heart,
  Activity,
  Moon,
  AlertTriangle,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Wind,
  Footprints,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
import { Sparkline } from '../components/Sparkline';
import { TachogramChart } from '../components/TachogramChart';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface WearablesScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

export const WearablesScreen: React.FC<WearablesScreenProps> = ({ onNavigateToTab }) => {
  const {
    wearables,
    activeAlerts,
    isSimulatedAnomalyActive,
    injectWearableAnomalyScenario,
    resetWearableScenario,
  } = useHealthStore();

  const latest = wearables[wearables.length - 1];

  // Gráfico simples SVG para série temporal de BPM
  const chartW = SCREEN_WIDTH - 64;
  const chartH = 120;
  const padL = 30;
  const padR = 20;
  const padT = 20;
  const padB = 25;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const bpmValues = wearables.map((w) => w.restingHeartRate);
  const minBpm = Math.min(...bpmValues, 50);
  const maxBpm = Math.max(...bpmValues, 120);
  const bpmRange = maxBpm - minBpm || 1;

  const pointsStr = wearables
    .map((w, idx) => {
      const x = padL + (idx / (wearables.length - 1)) * innerW;
      const y = padT + innerH - ((w.restingHeartRate - minBpm) / bpmRange) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  // Dados para sparklines individuais dos cards
  const sparkBpm = wearables.slice(-14).map((w) => w.restingHeartRate);
  const sparkHrv = wearables.slice(-14).map((w) => w.hrv);
  const sparkSleep = wearables.slice(-14).map((w) => w.sleepHours);
  const sparkSteps = wearables.slice(-14).map((w) => w.steps);

  // Decomposição dos estágios de sono (Apple Health / Oura style)
  const totalSleep = latest?.sleepHours || 7.2;
  const deepSleep = latest?.deepSleepHours || (isSimulatedAnomalyActive ? 0.3 : 1.8);
  const remSleep = latest?.remSleepHours || (isSimulatedAnomalyActive ? 0.8 : 1.7);
  const lightSleep = Math.max(0.5, Number((totalSleep - deepSleep - remSleep).toFixed(1)));
  const deepPct = Math.round((deepSleep / totalSleep) * 100);
  const remPct = Math.round((remSleep / totalSleep) * 100);
  const lightPct = Math.max(5, 100 - deepPct - remPct);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Sinais Contínuos & Wearables</Text>
        <Text style={styles.subtitle}>
          Monitoramento fisiológico contínuo sincronizado com o Apple Watch e anéis inteligentes.
        </Text>
      </View>

      {/* Status do Dispositivo Pareado */}
      <View style={styles.deviceStatusCard}>
        <View style={styles.deviceIconBox}>
          <Watch color="#0D9488" size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deviceName}>Apple Watch Ultra 2</Text>
          <Text style={styles.deviceSub}>HealthKit Streaming • BLE GATT 0x180D • Há 2 min</Text>
        </View>
        <View style={styles.deviceConnectedBadge}>
          <View style={styles.connectedDot} />
          <Text style={styles.connectedText}>Ao Vivo</Text>
        </View>
      </View>

      {/* Caixa de Controle do Simulador Determinístico (RF-P03) */}
      <View style={styles.simulatorBox}>
        <View style={styles.simulatorHeader}>
          <Zap color="#E11D48" size={16} />
          <Text style={styles.simulatorTitle}>Controlador do Simulador de Palco</Text>
        </View>
        <Text style={styles.simulatorDesc}>
          Simule eventos fisiológicos agudos de arritmia e taquicardia noturna em tempo real para a banca.
        </Text>

        <View style={styles.simulatorActions}>
          <TouchableOpacity
            style={[
              styles.simButtonTrigger,
              isSimulatedAnomalyActive && styles.simButtonActive,
            ]}
            onPress={injectWearableAnomalyScenario}
          >
            <ShieldAlert color="#FFFFFF" size={16} />
            <Text style={styles.simButtonTriggerText}>
              {isSimulatedAnomalyActive
                ? '⚡ Anomalia Ativa (114 BPM)'
                : 'Disparar Taquicardia Noturna'}
            </Text>
          </TouchableOpacity>

          {isSimulatedAnomalyActive && (
            <TouchableOpacity
              style={styles.simButtonReset}
              onPress={resetWearableScenario}
            >
              <RotateCcw color="#475569" size={14} />
              <Text style={styles.simButtonResetText}>Restaurar Normal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Card de Alerta Proativo com Tacograma Noturno (RF-P04 / ETAPA 4) */}
      {activeAlerts.length > 0 ? (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle color="#E11D48" size={20} />
            <Text style={styles.alertTitle}>Alerta Clínico Detectado</Text>
          </View>
          <Text style={styles.alertMainText}>{activeAlerts[0].title}</Text>
          <Text style={styles.alertSubText}>{activeAlerts[0].description}</Text>

          {/* Gráfico do Tacograma do Disparo Noturno às 03:15 */}
          <Text style={styles.tacogramHeader}>Registro do Tacograma Noturno (00:00 - 06:30):</Text>
          <TachogramChart width={SCREEN_WIDTH - 64} height={100} />

          <View style={styles.contextBox}>
            <Text style={styles.contextTitle}>Contexto do Grafo Clínico:</Text>
            <Text style={styles.contextContent}>
              {activeAlerts[0].clinicalContext}
            </Text>
          </View>

          <View style={styles.alertButtons}>
            <TouchableOpacity
              style={styles.actionChatButton}
              onPress={() => onNavigateToTab('Assistente')}
            >
              <Text style={styles.actionChatButtonText}>Investigar no Assistente IA</Text>
              <ArrowRight color="#FFFFFF" size={14} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionShareButton}
              onPress={() => onNavigateToTab('Compartilhar')}
            >
              <Text style={styles.actionShareButtonText}>Compartilhar com Médico</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.normalCard}>
          <CheckCircle2 color="#10B981" size={20} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.normalTitle}>Ritmo Cardíaco & Sono Estáveis</Text>
            <Text style={styles.normalSub}>
              Sem indícios de fibrilação atrial, apneia ou taquicardia nos últimos 30 dias.
            </Text>
          </View>
        </View>
      )}

      {/* Gráfico da Série Temporal de FC (30 dias) */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Heart color="#E11D48" size={18} />
            <Text style={styles.chartTitle}>Frequência Cardíaca em Repouso (30 dias)</Text>
          </View>
          <Text
            style={[
              styles.chartCurrentBpm,
              isSimulatedAnomalyActive && styles.chartCurrentBpmAlert,
            ]}
          >
            {latest?.restingHeartRate} BPM
          </Text>
        </View>

        <Svg width={chartW} height={chartH}>
          {/* Limiar de Alerta 100 BPM */}
          <Line
            x1={padL}
            y1={padT + innerH - ((100 - minBpm) / bpmRange) * innerH}
            x2={padL + innerW}
            y2={padT + innerH - ((100 - minBpm) / bpmRange) * innerH}
            stroke="#FECDD3"
            strokeDasharray="4,4"
            strokeWidth={1}
          />
          <SvgText
            x={padL - 4}
            y={padT + innerH - ((100 - minBpm) / bpmRange) * innerH + 3}
            fill="#E11D48"
            fontSize={9}
            fontWeight="700"
            textAnchor="end"
          >
            100
          </SvgText>

          {/* Curva da Série Temporal */}
          <Polyline
            points={pointsStr}
            fill="none"
            stroke={isSimulatedAnomalyActive ? '#E11D48' : '#EF4444'}
            strokeWidth={2.5}
          />

          <Circle
            cx={padL + innerW}
            cy={padT + innerH - ((latest.restingHeartRate - minBpm) / bpmRange) * innerH}
            r={isSimulatedAnomalyActive ? 6 : 4}
            fill={isSimulatedAnomalyActive ? '#E11D48' : '#EF4444'}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </Svg>

        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>30 dias atrás</Text>
          <Text style={styles.chartFooterText}>Hoje</Text>
        </View>
      </View>

      {/* Decomposição dos Estágios de Sono (ETAPA 4) */}
      <View style={styles.sleepStageCard}>
        <View style={styles.sleepHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Moon color="#8B5CF6" size={18} />
            <Text style={styles.sleepTitle}>Arquitetura e Estágios do Sono</Text>
          </View>
          <Text style={styles.sleepTotalText}>{totalSleep}h total</Text>
        </View>

        {/* Barra Segmentada de Sono */}
        <View style={styles.sleepBarContainer}>
          <View style={[styles.sleepSegment, { width: `${deepPct}%`, backgroundColor: '#4C1D95' }]} />
          <View style={[styles.sleepSegment, { width: `${remPct}%`, backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.sleepSegment, { width: `${lightPct}%`, backgroundColor: '#DDD6FE' }]} />
        </View>

        {/* Legenda dos Estágios */}
        <View style={styles.sleepLegendRow}>
          <View style={styles.sleepLegendItem}>
            <View style={[styles.sleepDot, { backgroundColor: '#4C1D95' }]} />
            <Text style={styles.sleepLegendText}>Profundo: {deepSleep}h ({deepPct}%)</Text>
          </View>
          <View style={styles.sleepLegendItem}>
            <View style={[styles.sleepDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.sleepLegendText}>REM: {remSleep}h ({remPct}%)</Text>
          </View>
          <View style={styles.sleepLegendItem}>
            <View style={[styles.sleepDot, { backgroundColor: '#DDD6FE' }]} />
            <Text style={styles.sleepLegendText}>Leve: {lightSleep}h</Text>
          </View>
        </View>
      </View>

      {/* Grid de Métricas com Micro-Sparklines */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Activity color="#3B82F6" size={16} />
            <Text style={styles.metricLabel}>Variabilidade (HRV)</Text>
          </View>
          <View style={styles.metricRowWithSpark}>
            <Text style={styles.metricVal}>
              {latest?.hrv} <Text style={styles.metricUnit}>ms</Text>
            </Text>
            <Sparkline data={sparkHrv} color="#3B82F6" width={60} height={24} />
          </View>
          <Text style={styles.metricNote}>
            {isSimulatedAnomalyActive
              ? 'Queda drástica de recuperação'
              : 'Faixa saudável para 32 anos'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Wind color="#0D9488" size={16} />
            <Text style={styles.metricLabel}>Oxigenação (SpO2)</Text>
          </View>
          <View style={styles.metricRowWithSpark}>
            <Text style={styles.metricVal}>
              {latest?.spo2}%
            </Text>
            <Sparkline data={[98, 97, 98, 98, 99, 98, 98]} color="#0D9488" width={60} height={24} />
          </View>
          <Text style={styles.metricNote}>Saturação ideal contínua</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  deviceStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  deviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  deviceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  deviceConnectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  simulatorBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  simulatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  simulatorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#BE123C',
    textTransform: 'uppercase',
  },
  simulatorDesc: {
    fontSize: 11,
    color: '#881337',
    lineHeight: 16,
    marginBottom: 12,
  },
  simulatorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  simButtonTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  simButtonActive: {
    backgroundColor: '#9F1239',
  },
  simButtonTriggerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  simButtonReset: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  simButtonResetText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E11D48',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#BE123C',
    textTransform: 'uppercase',
  },
  alertMainText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  alertSubText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 8,
  },
  tacogramHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#881337',
    marginTop: 6,
  },
  contextBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  contextTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  contextContent: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionChatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 11,
    borderRadius: 11,
    gap: 6,
  },
  actionChatButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  actionShareButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionShareButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  normalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  normalTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  normalSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  chartCurrentBpm: {
    fontSize: 16,
    fontWeight: '900',
    color: '#EF4444',
  },
  chartCurrentBpmAlert: {
    color: '#E11D48',
    fontSize: 18,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartFooterText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  sleepStageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sleepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  sleepTotalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  sleepBarContainer: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sleepSegment: {
    height: '100%',
  },
  sleepLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sleepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sleepLegendText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  metricRowWithSpark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  metricUnit: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  metricNote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 14,
  },
});
