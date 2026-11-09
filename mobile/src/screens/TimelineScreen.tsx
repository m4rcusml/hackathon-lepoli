import React, { useState } from 'react';
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
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
import { BiomarkerChart } from '../components/BiomarkerChart';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimelineScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({ onNavigateToTab }) => {
  const { user, biomarkers, exams, wearables, activeAlerts, isSimulatedAnomalyActive } = useHealthStore();
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string>('glicose');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  // Última leitura do wearable
  const latestWearable = wearables[wearables.length - 1];

  // Agrupa os exames por biomarcador
  const groupedBiomarkers = Object.values(biomarkers).map((bm) => {
    const measurements = exams.filter((e) => e.biomarkerId === bm.id);
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (latest && previous) {
      if (latest.value > previous.value) trend = 'up';
      else if (latest.value < previous.value) trend = 'down';
    }

    const isOutOfRange = latest ? latest.value < bm.refMin || latest.value > bm.refMax : false;

    return {
      definition: bm,
      measurements,
      latest,
      trend,
      isOutOfRange,
    };
  });

  // Filtragem por categoria
  const filteredBiomarkers = groupedBiomarkers.filter((item) => {
    if (categoryFilter === 'Todos') return true;
    if (categoryFilter === 'Alterados') return item.isOutOfRange;
    return item.definition.category === categoryFilter;
  });

  const activeBiomarkerData = groupedBiomarkers.find(
    (b) => b.definition.id === selectedBiomarkerId
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cabeçalho do Perfil */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user.name} 👋</Text>
          <Text style={styles.subGreeting}>
            {user.age} anos • {user.biologicalSex} • Histórico Unificado
          </Text>
        </View>
        <View style={styles.healthBadge}>
          <Text style={styles.healthBadgeText}>
            {activeAlerts.length > 0 ? 'Atenção Requerida' : 'Sinais Estáveis'}
          </Text>
        </View>
      </View>

      {/* Alerta Proativo em Destaque (RF-P04) */}
      {activeAlerts.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIconWrapper}>
              <ShieldAlert color="#DC2626" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{activeAlerts[0].title}</Text>
              <Text style={styles.alertTimestamp}>{activeAlerts[0].timestamp}</Text>
            </View>
          </View>
          <Text style={styles.alertDescription}>{activeAlerts[0].description}</Text>
          
          <View style={styles.alertDataBox}>
            <Text style={styles.alertDataText}>
              <Text style={{ fontWeight: '700' }}>Detectado:</Text> {activeAlerts[0].valueDetected} (Seu habitual: {activeAlerts[0].baselineValue})
            </Text>
          </View>

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.alertPrimaryButton}
              onPress={() => onNavigateToTab('Assistente')}
            >
              <Text style={styles.alertPrimaryButtonText}>Consultar Assistente IA</Text>
              <ArrowRight color="#FFFFFF" size={14} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertSecondaryButton}
              onPress={() => onNavigateToTab('Compartilhar')}
            >
              <Text style={styles.alertSecondaryButtonText}>Gerar QR Code Médico</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cards de Sinais Vitais em Tempo Real (Wearables) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sinais Vitais (Apple Watch)</Text>
        <TouchableOpacity onPress={() => onNavigateToTab('Dispositivos')}>
          <Text style={styles.sectionLink}>Ver detalhes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vitalsRow}>
        {/* Card BPM */}
        <View style={[styles.vitalCard, isSimulatedAnomalyActive && styles.vitalCardAlert]}>
          <View style={styles.vitalIconTitle}>
            <Heart color={isSimulatedAnomalyActive ? '#DC2626' : '#EF4444'} size={18} />
            <Text style={styles.vitalLabel}>Frequência</Text>
          </View>
          <Text style={[styles.vitalValue, isSimulatedAnomalyActive && styles.vitalValueAlert]}>
            {latestWearable?.restingHeartRate || 62}{' '}
            <Text style={styles.vitalUnit}>BPM</Text>
          </Text>
          <Text style={styles.vitalSub}>
            {isSimulatedAnomalyActive ? '⚠️ Taquicardia noturna' : 'Em repouso normal'}
          </Text>
        </View>

        {/* Card HRV */}
        <View style={[styles.vitalCard, isSimulatedAnomalyActive && styles.vitalCardAlert]}>
          <View style={styles.vitalIconTitle}>
            <Activity color={isSimulatedAnomalyActive ? '#EA580C' : '#3B82F6'} size={18} />
            <Text style={styles.vitalLabel}>HRV (Stress)</Text>
          </View>
          <Text style={styles.vitalValue}>
            {latestWearable?.hrv || 56}{' '}
            <Text style={styles.vitalUnit}>ms</Text>
          </Text>
          <Text style={styles.vitalSub}>
            {isSimulatedAnomalyActive ? 'Queda severa (-62%)' : 'Recuperação ótima'}
          </Text>
        </View>

        {/* Card Sono */}
        <View style={styles.vitalCard}>
          <View style={styles.vitalIconTitle}>
            <Moon color="#8B5CF6" size={18} />
            <Text style={styles.vitalLabel}>Sono</Text>
          </View>
          <Text style={styles.vitalValue}>
            {latestWearable?.sleepHours || 7.2}{' '}
            <Text style={styles.vitalUnit}>h</Text>
          </Text>
          <Text style={styles.vitalSub}>
            {latestWearable?.deepSleepHours || 1.8}h profundo
          </Text>
        </View>
      </View>

      {/* Gráfico do Biomarcador Selecionado (Linha do Tempo com Faixas de Referência - RF-P02) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Evolução Histórica do Biomarcador</Text>
        <Text style={styles.sectionBadge}>
          {activeBiomarkerData?.measurements.length || 0} exames registrados
        </Text>
      </View>

      {activeBiomarkerData && (
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <View>
              <Text style={styles.chartBiomarkerName}>
                {activeBiomarkerData.definition.canonicalName}
              </Text>
              <Text style={styles.chartBiomarkerDesc}>
                {activeBiomarkerData.definition.description}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                activeBiomarkerData.isOutOfRange
                  ? styles.statusBadgeWarning
                  : styles.statusBadgeSuccess,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  activeBiomarkerData.isOutOfRange
                    ? styles.statusBadgeTextWarning
                    : styles.statusBadgeTextSuccess,
                ]}
              >
                {activeBiomarkerData.isOutOfRange ? 'Alterado' : 'Dentro da Faixa'}
              </Text>
            </View>
          </View>

          {/* Gráfico SVG com Faixa de Referência */}
          <BiomarkerChart
            data={activeBiomarkerData.measurements.map((m) => ({
              date: m.date,
              value: m.value,
            }))}
            refMin={activeBiomarkerData.definition.refMin}
            refMax={activeBiomarkerData.definition.refMax}
            unit={activeBiomarkerData.definition.unit}
            lineColor="#0D9488"
            width={SCREEN_WIDTH - 64}
            height={190}
          />

          {/* Últimos registros do biomarcador selecionado */}
          <View style={styles.historyList}>
            <Text style={styles.historyListTitle}>Histórico de Coletas:</Text>
            {activeBiomarkerData.measurements.map((m) => (
              <View key={m.id} style={styles.historyItem}>
                <View>
                  <Text style={styles.historyLab}>{m.labName}</Text>
                  <Text style={styles.historyDate}>{m.date}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.historyValue,
                      m.status !== 'normal' && styles.historyValueAlert,
                    ]}
                  >
                    {m.value} {m.unit}
                  </Text>
                  <Text style={styles.historyRef}>
                    Ref: {m.refMin}-{m.refMax}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Lista de Biomarcadores Acompanhados */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Selecione para Inspecionar</Text>
      </View>

      {/* Filtros em Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['Todos', 'Alterados', 'Glicêmico', 'Lipídico', 'Hematológico', 'Hormonal'].map(
          (category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                categoryFilter === category && styles.filterChipActive,
              ]}
              onPress={() => setCategoryFilter(category)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === category && styles.filterChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Cards da Lista de Biomarcadores */}
      <View style={styles.biomarkerGrid}>
        {filteredBiomarkers.map((item) => {
          const isSelected = item.definition.id === selectedBiomarkerId;
          return (
            <TouchableOpacity
              key={item.definition.id}
              style={[
                styles.biomarkerRowCard,
                isSelected && styles.biomarkerRowCardSelected,
                item.isOutOfRange && styles.biomarkerRowCardOutOfRange,
              ]}
              onPress={() => setSelectedBiomarkerId(item.definition.id)}
            >
              <View style={styles.biomarkerRowMain}>
                <View>
                  <Text style={styles.biomarkerRowTitle}>
                    {item.definition.canonicalName}
                  </Text>
                  <Text style={styles.biomarkerRowCategory}>
                    {item.definition.category} • Ref: {item.definition.refMin}-
                    {item.definition.refMax} {item.definition.unit}
                  </Text>
                </View>

                <View style={styles.biomarkerRowValues}>
                  {item.latest ? (
                    <>
                      <Text
                        style={[
                          styles.biomarkerValueText,
                          item.isOutOfRange && styles.biomarkerValueTextAlert,
                        ]}
                      >
                        {item.latest.value}{' '}
                        <Text style={styles.biomarkerUnitText}>
                          {item.definition.unit}
                        </Text>
                      </Text>
                      <View style={styles.biomarkerTrendBox}>
                        {item.trend === 'up' && <TrendingUp size={12} color="#DC2626" />}
                        {item.trend === 'down' && <TrendingDown size={12} color="#10B981" />}
                        <Text style={styles.biomarkerDateText}>{item.latest.date}</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.noDataText}>Sem dados</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  healthBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  healthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  alertIconWrapper: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 10,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  alertTimestamp: {
    fontSize: 11,
    color: '#DC2626',
  },
  alertDescription: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 10,
  },
  alertDataBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertDataText: {
    fontSize: 12,
    color: '#991B1B',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DC2626',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  alertPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  alertSecondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertSecondaryButtonText: {
    color: '#991B1B',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalCardAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF1F2',
  },
  vitalIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  vitalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  vitalValueAlert: {
    color: '#DC2626',
  },
  vitalUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  vitalSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chartBiomarkerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartBiomarkerDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    maxWidth: 200,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeWarning: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextSuccess: {
    color: '#15803D',
  },
  statusBadgeTextWarning: {
    color: '#B91C1C',
  },
  historyList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  historyListTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  historyLab: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  historyDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  historyValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyValueAlert: {
    color: '#DC2626',
  },
  historyRef: {
    fontSize: 10,
    color: '#64748B',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  biomarkerGrid: {
    gap: 8,
  },
  biomarkerRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  biomarkerRowCardSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  biomarkerRowCardOutOfRange: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  biomarkerRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biomarkerRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  biomarkerRowCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  biomarkerRowValues: {
    alignItems: 'flex-end',
  },
  biomarkerValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  biomarkerValueTextAlert: {
    color: '#DC2626',
  },
  biomarkerUnitText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  biomarkerTrendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  biomarkerDateText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  noDataText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
