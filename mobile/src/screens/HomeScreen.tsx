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
  Activity,
  Heart,
  Moon,
  ShieldAlert,
  ArrowRight,
  Camera,
  Watch,
  MessageSquare,
  QrCode,
  FileCheck,
  TrendingUp,
  Sparkles,
  LogOut,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
import { ReadinessRing } from '../components/ReadinessRing';
import { Sparkline } from '../components/Sparkline';

interface HomeScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToTab }) => {
  const { user, exams, wearables, activeAlerts, isSimulatedAnomalyActive, logout } = useHealthStore();

  const latestWearable = wearables[wearables.length - 1];
  const readinessScore = isSimulatedAnomalyActive ? 52 : 78;

  // Sparklines de 7 dias
  const last7DaysBpm = wearables.slice(-7).map((w) => w.restingHeartRate);
  const last7DaysSleep = wearables.slice(-7).map((w) => w.sleepHours);
  const last7DaysHrv = wearables.slice(-7).map((w) => w.hrv);

  // Últimos 3 exames do paciente
  const recentExams = exams.slice(0, 3);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. Header do Usuário */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.greetingText}>Olá, {user.name} 👋</Text>
          <Text style={styles.userSubText}>
            {user.age} anos • {user.biologicalSex} • Histórico Unificado
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut color="#64748B" size={16} />
        </TouchableOpacity>
      </View>

      {/* 2. Card de Prontidão Diária (Hero Enxuto) */}
      <View style={[styles.heroCard, isSimulatedAnomalyActive && styles.heroCardAlert]}>
        <View style={styles.heroTextSide}>
          <View style={styles.heroBadge}>
            <Sparkles color="#0D9488" size={12} />
            <Text style={styles.heroBadgeText}>Índice Diário de Saúde</Text>
          </View>
          <Text style={styles.heroTitle}>
            {isSimulatedAnomalyActive ? 'Atenção Cardiovascular' : 'Prontidão Fisiológica'}
          </Text>
          <Text style={styles.heroDesc}>
            {isSimulatedAnomalyActive
              ? 'Arritmia noturna detectada com queda acentuada na variabilidade cardíaca.'
              : 'Seus sinais vitais e histórico metabólico estão em equilíbrio nos últimos 30 dias.'}
          </Text>

          <View style={styles.heroKeyStats}>
            <Text style={styles.keyStatItem}>
              <Text style={{ fontWeight: '800' }}>{latestWearable?.restingHeartRate} bpm</Text> repouso
            </Text>
            <Text style={styles.keyStatDivider}>•</Text>
            <Text style={styles.keyStatItem}>
              <Text style={{ fontWeight: '800' }}>{latestWearable?.deepSleepHours}h</Text> sono prof.
            </Text>
          </View>
        </View>

        <View style={styles.heroRingSide}>
          <ReadinessRing score={readinessScore} isAnomaly={isSimulatedAnomalyActive} size={94} />
        </View>
      </View>

      {/* 3. Alerta Proativo Ativo (se houver) */}
      {activeAlerts.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertRow}>
            <View style={styles.alertIconCircle}>
              <ShieldAlert color="#E11D48" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{activeAlerts[0].title}</Text>
              <Text style={styles.alertDesc}>{activeAlerts[0].description}</Text>
            </View>
          </View>
          <View style={styles.alertActionRow}>
            <TouchableOpacity
              style={styles.alertActionBtn}
              onPress={() => onNavigateToTab('Assistente')}
            >
              <Text style={styles.alertActionBtnText}>Investigar com Assistente IA</Text>
              <ArrowRight color="#FFFFFF" size={12} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertQrBtn}
              onPress={() => onNavigateToTab('Compartilhar')}
            >
              <Text style={styles.alertQrBtnText}>Gerar QR Code Médico</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. Snapshot de Sinais Vitais com Sparklines */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Sinais Vitais (Apple Watch)</Text>
        <TouchableOpacity onPress={() => onNavigateToTab('Dispositivos')}>
          <Text style={styles.sectionLink}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vitalsGrid}>
        {/* Card BPM */}
        <View style={[styles.vitalMiniCard, isSimulatedAnomalyActive && styles.vitalMiniCardAlert]}>
          <View style={styles.vitalMiniHeader}>
            <Heart color={isSimulatedAnomalyActive ? '#E11D48' : '#EF4444'} size={14} />
            <Text style={styles.vitalMiniLabel}>Frequência</Text>
          </View>
          <View style={styles.vitalValueRow}>
            <Text style={[styles.vitalValueText, isSimulatedAnomalyActive && { color: '#E11D48' }]}>
              {latestWearable?.restingHeartRate || 62}{' '}
              <Text style={styles.vitalUnit}>BPM</Text>
            </Text>
            <Sparkline
              data={last7DaysBpm}
              color={isSimulatedAnomalyActive ? '#E11D48' : '#EF4444'}
              width={48}
              height={18}
            />
          </View>
        </View>

        {/* Card Sono */}
        <View style={styles.vitalMiniCard}>
          <View style={styles.vitalMiniHeader}>
            <Moon color="#8B5CF6" size={14} />
            <Text style={styles.vitalMiniLabel}>Sono</Text>
          </View>
          <View style={styles.vitalValueRow}>
            <Text style={styles.vitalValueText}>
              {latestWearable?.sleepHours || 7.2}{' '}
              <Text style={styles.vitalUnit}>h</Text>
            </Text>
            <Sparkline data={last7DaysSleep} color="#8B5CF6" width={48} height={18} />
          </View>
        </View>

        {/* Card HRV */}
        <View style={[styles.vitalMiniCard, isSimulatedAnomalyActive && styles.vitalMiniCardAlert]}>
          <View style={styles.vitalMiniHeader}>
            <Activity color={isSimulatedAnomalyActive ? '#EA580C' : '#3B82F6'} size={14} />
            <Text style={styles.vitalMiniLabel}>HRV</Text>
          </View>
          <View style={styles.vitalValueRow}>
            <Text style={styles.vitalValueText}>
              {latestWearable?.hrv || 56}{' '}
              <Text style={styles.vitalUnit}>ms</Text>
            </Text>
            <Sparkline
              data={last7DaysHrv}
              color={isSimulatedAnomalyActive ? '#EA580C' : '#3B82F6'}
              width={48}
              height={18}
            />
          </View>
        </View>
      </View>

      {/* 5. Central de Ações Rápidas (Grade 2x2) */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Exames')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#CCFBF1' }]}>
            <Camera color="#0D9488" size={20} />
          </View>
          <Text style={styles.actionCardTitle}>Digitalizar Exame</Text>
          <Text style={styles.actionCardSub}>Upload de PDF ou foto de papel antigo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Dispositivos')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Watch color="#E11D48" size={20} />
          </View>
          <Text style={styles.actionCardTitle}>Sinais Contínuos</Text>
          <Text style={styles.actionCardSub}>Tacograma e simulador de arritmia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Assistente')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#E0E7FF' }]}>
            <MessageSquare color="#4F46E5" size={20} />
          </View>
          <Text style={styles.actionCardTitle}>Assistente IA</Text>
          <Text style={styles.actionCardSub}>Chat contextualizado com GraphRAG</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => onNavigateToTab('Compartilhar')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <QrCode color="#D97706" size={20} />
          </View>
          <Text style={styles.actionCardTitle}>Acesso Médico</Text>
          <Text style={styles.actionCardSub}>Gerar QR Code Open Health efêmero</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Últimos Exames Processados */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Últimos Laudos Registrados</Text>
        <TouchableOpacity onPress={() => onNavigateToTab('Timeline')}>
          <Text style={styles.sectionLink}>Ver Linha do Tempo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentExamsCard}>
        {recentExams.map((exam, index) => {
          const isOutOfRange = exam.status !== 'normal';
          return (
            <View
              key={exam.id}
              style={[
                styles.recentExamRow,
                index < recentExams.length - 1 && styles.recentExamRowBorder,
              ]}
            >
              <View style={styles.recentExamInfo}>
                <Text style={styles.recentExamName}>{exam.canonicalName}</Text>
                <Text style={styles.recentExamLab}>
                  {exam.labName} • {exam.date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    styles.recentExamValue,
                    isOutOfRange && { color: '#E11D48' },
                  ]}
                >
                  {exam.value} {exam.unit}
                </Text>
                <Text
                  style={[
                    styles.recentExamBadge,
                    isOutOfRange ? styles.recentExamBadgeAlert : styles.recentExamBadgeOk,
                  ]}
                >
                  {isOutOfRange ? 'Alterado' : 'Normal'}
                </Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.fullTimelineButton}
          onPress={() => onNavigateToTab('Timeline')}
        >
          <Text style={styles.fullTimelineButtonText}>
            Acessar Gráficos e Linha do Tempo Completa
          </Text>
          <ChevronRight color="#0D9488" size={16} />
        </TouchableOpacity>
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  userSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroCardAlert: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  heroTextSide: {
    flex: 1,
    paddingRight: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 8,
  },
  heroKeyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keyStatItem: {
    fontSize: 11,
    color: '#334155',
  },
  keyStatDivider: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  heroRingSide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  alertIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#BE123C',
  },
  alertDesc: {
    fontSize: 11,
    color: '#881337',
    marginTop: 2,
    lineHeight: 15,
  },
  alertActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  alertActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E11D48',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  alertActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  alertQrBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertQrBtnText: {
    color: '#BE123C',
    fontWeight: '700',
    fontSize: 11,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  vitalMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalMiniCardAlert: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  vitalMiniHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  vitalMiniLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  vitalValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitalValueText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  actionCard: {
    width: (Dimensions.get('window').width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  recentExamsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentExamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentExamRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentExamInfo: {
    flex: 1,
  },
  recentExamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  recentExamLab: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  recentExamValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  recentExamBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  recentExamBadgeOk: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  recentExamBadgeAlert: {
    backgroundColor: '#FFE4E6',
    color: '#BE123C',
  },
  fullTimelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  fullTimelineButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
});
