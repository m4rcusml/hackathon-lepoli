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
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Sinais Contínuos & Wearables</Text>
        <Text style={styles.subtitle}>
          Dados em tempo real de relógios e anéis inteligentes integrados ao mesmo histórico clínico.
        </Text>
      </View>

      {/* Status do Dispositivo */}
      <View style={styles.deviceStatusCard}>
        <View style={styles.deviceIconBox}>
          <Watch color="#0D9488" size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deviceName}>Apple Watch Series 9</Text>
          <Text style={styles.deviceSub}>Sincronizado via HealthKit • Há 4 minutos</Text>
        </View>
        <View style={styles.deviceConnectedBadge}>
          <View style={styles.connectedDot} />
          <Text style={styles.connectedText}>Ativo</Text>
        </View>
      </View>

      {/* Caixa de Controle do Simulador (A Aposta Matadora da Demo - RF-P03) */}
      <View style={styles.simulatorBox}>
        <View style={styles.simulatorHeader}>
          <Zap color="#E11D48" size={16} />
          <Text style={styles.simulatorTitle}>Controlador de Simulação da Live Demo</Text>
        </View>
        <Text style={styles.simulatorDesc}>
          Simule eventos fisiológicos agudos de forma determinística e estável em palco sem depender de conexões físicas.
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
                ? '⚡ Anomalia Disparada (Taquicardia)'
                : 'Simular Episódio de Taquicardia'}
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

      {/* Card de Alerta Proativo Ativo (RF-P04) */}
      {activeAlerts.length > 0 ? (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertTriangle color="#DC2626" size={20} />
            <Text style={styles.alertTitle}>Alerta Clínico Detectado</Text>
          </View>
          <Text style={styles.alertMainText}>{activeAlerts[0].title}</Text>
          <Text style={styles.alertSubText}>{activeAlerts[0].description}</Text>

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
              <Text style={styles.actionChatButtonText}>Perguntar ao Assistente IA</Text>
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
              Nenhum indício de arritmia ou apneia detectado nos últimos 30 dias.
            </Text>
          </View>
        </View>
      )}

      {/* Gráfico da Série Temporal de Frequência Cardíaca (30 dias) */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Heart color="#EF4444" size={18} />
            <Text style={styles.chartTitle}>Frequência Cardíaca Basal (30 dias)</Text>
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
          {/* Linha de Limiar de Alerta (100 BPM) */}
          <Line
            x1={padL}
            y1={padT + innerH - ((100 - minBpm) / bpmRange) * innerH}
            x2={padL + innerW}
            y2={padT + innerH - ((100 - minBpm) / bpmRange) * innerH}
            stroke="#FCA5A5"
            strokeDasharray="4,4"
            strokeWidth={1}
          />
          <SvgText
            x={padL - 4}
            y={padT + innerH - ((100 - minBpm) / bpmRange) * innerH + 3}
            fill="#EF4444"
            fontSize={9}
            textAnchor="end"
          >
            100
          </SvgText>

          {/* Curva da Série Temporal */}
          <Polyline
            points={pointsStr}
            fill="none"
            stroke={isSimulatedAnomalyActive ? '#DC2626' : '#EF4444'}
            strokeWidth={2.5}
          />

          {/* Destaque do último ponto */}
          <Circle
            cx={padL + innerW}
            cy={padT + innerH - ((latest.restingHeartRate - minBpm) / bpmRange) * innerH}
            r={isSimulatedAnomalyActive ? 6 : 4}
            fill={isSimulatedAnomalyActive ? '#DC2626' : '#EF4444'}
            stroke="#FFFFFF"
            strokeWidth={2}
          />
        </Svg>

        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterText}>30 dias atrás</Text>
          <Text style={styles.chartFooterText}>Hoje</Text>
        </View>
      </View>

      {/* Grid de Métricas Secundárias (HRV e Sono) */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Activity color="#3B82F6" size={16} />
            <Text style={styles.metricLabel}>Variabilidade (HRV)</Text>
          </View>
          <Text style={styles.metricVal}>
            {latest?.hrv} <Text style={styles.metricUnit}>ms</Text>
          </Text>
          <Text style={styles.metricNote}>
            {isSimulatedAnomalyActive
              ? 'Queda drástica de recuperação'
              : 'Faixa saudável para sua idade'}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Moon color="#8B5CF6" size={16} />
            <Text style={styles.metricLabel}>Sono Profundo</Text>
          </View>
          <Text style={styles.metricVal}>
            {latest?.deepSleepHours} <Text style={styles.metricUnit}>h</Text>
          </Text>
          <Text style={styles.metricNote}>
            {isSimulatedAnomalyActive
              ? 'Sono fragmentado e não reparador'
              : 'Ideal: > 1.5h por noite'}
          </Text>
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
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
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
    fontWeight: '700',
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
    fontWeight: '700',
    color: '#15803D',
  },
  simulatorBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 16,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#BE123C',
    textTransform: 'uppercase',
  },
  simulatorDesc: {
    fontSize: 12,
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  simButtonActive: {
    backgroundColor: '#9F1239',
  },
  simButtonTriggerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  simButtonReset: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  simButtonResetText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#EF4444',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  alertMainText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  alertSubText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10,
  },
  contextBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
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
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionChatButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  actionShareButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionShareButtonText: {
    color: '#334155',
    fontWeight: '600',
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
    fontWeight: '700',
    color: '#166534',
  },
  normalSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  chartCurrentBpm: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  chartCurrentBpmAlert: {
    color: '#DC2626',
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
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricUnit: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metricNote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 14,
  },
});
