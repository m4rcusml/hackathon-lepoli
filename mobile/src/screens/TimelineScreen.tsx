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
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
import { BiomarkerChart } from '../components/BiomarkerChart';
import { ReadinessRing } from '../components/ReadinessRing';
import { Sparkline } from '../components/Sparkline';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TimelineScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

export const TimelineScreen: React.FC<TimelineScreenProps> = ({ onNavigateToTab }) => {
  const { user, biomarkers, exams, wearables, activeAlerts, isSimulatedAnomalyActive } = useHealthStore();
  const [selectedBiomarkerId, setSelectedBiomarkerId] = useState<string>('glicose');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  const latestWearable = wearables[wearables.length - 1];

  // Cálculo dinâmico do Score de Prontidão (Oura/Apple Health style)
  const readinessScore = isSimulatedAnomalyActive ? 52 : 78;

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

  const filteredBiomarkers = groupedBiomarkers.filter((item) => {
    if (categoryFilter === 'Todos') return true;
    if (categoryFilter === 'Alterados') return item.isOutOfRange;
    return item.definition.category === categoryFilter;
  });

  const activeBiomarkerData = groupedBiomarkers.find(
    (b) => b.definition.id === selectedBiomarkerId
  );

  // Sparklines com dados dos últimos 7 dias
  const last7DaysBpm = wearables.slice(-7).map((w) => w.restingHeartRate);
  const last7DaysHrv = wearables.slice(-7).map((w) => w.hrv);
  const last7DaysSleep = wearables.slice(-7).map((w) => w.sleepHours);

  // Dados de correlação para teste (ex: cruzar com Frequência Cardíaca)
  const correlationDataset = {
    name: 'FC Repouso',
    unit: 'BPM',
    color: '#E11D48',
    data: wearables.slice(-5).map((w) => ({
      date: w.date,
      value: w.restingHeartRate,
    })),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 1. HERO: Anel de Prontidão Cardiovascular (Apple Health / Oura Ring style) */}
      <View style={[styles.heroCard, isSimulatedAnomalyActive && styles.heroCardAlert]}>
        <View style={styles.heroLeft}>
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>{user.name} • {user.age} anos</Text>
          </View>
          <Text style={styles.heroTitle}>
            {isSimulatedAnomalyActive ? 'Atenção Cardíaca' : 'Prontidão Cardiovascular'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isSimulatedAnomalyActive
              ? 'Arritmia noturna detectada com queda acentuada de recuperação fisiológica.'
              : 'Seus sinais vitais e histórico metabólico estão em equilíbrio nos últimos 30 dias.'}
          </Text>
          <View style={styles.metricTags}>
            <View style={styles.tagItem}>
              <Text style={styles.tagLabel}>BPM Noturno:</Text>
              <Text style={[styles.tagValue, isSimulatedAnomalyActive && { color: '#E11D48' }]}>
                {latestWearable?.restingHeartRate} bpm
              </Text>
            </View>
            <View style={styles.tagItem}>
              <Text style={styles.tagLabel}>Sono Profundo:</Text>
              <Text style={styles.tagValue}>{latestWearable?.deepSleepHours}h</Text>
            </View>
          </View>
        </View>

        <View style={styles.heroRight}>
          <ReadinessRing score={readinessScore} isAnomaly={isSimulatedAnomalyActive} size={105} />
        </View>
      </View>

      {/* 2. Alerta Proativo em Destaque (RF-P04) */}
      {activeAlerts.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertIconWrapper}>
              <ShieldAlert color="#E11D48" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{activeAlerts[0].title}</Text>
              <Text style={styles.alertTimestamp}>{activeAlerts[0].timestamp}</Text>
            </View>
          </View>
          <Text style={styles.alertDescription}>{activeAlerts[0].description}</Text>
          
          <View style={styles.alertDataBox}>
            <Text style={styles.alertDataText}>
              <Text style={{ fontWeight: '700' }}>Registrado:</Text> {activeAlerts[0].valueDetected} (Seu habitual: {activeAlerts[0].baselineValue})
            </Text>
          </View>

          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.alertPrimaryButton}
              onPress={() => onNavigateToTab('Assistente')}
            >
              <Text style={styles.alertPrimaryButtonText}>Investigar no Chat IA</Text>
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

      {/* 3. Cards de Sinais Vitais com Sparklines Integrados */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Sinais Vitais (Últimos 7 dias)</Text>
        <TouchableOpacity onPress={() => onNavigateToTab('Dispositivos')}>
          <Text style={styles.sectionLink}>Ver detalhes</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.vitalsRow}>
        {/* Card BPM */}
        <View style={[styles.vitalCard, isSimulatedAnomalyActive && styles.vitalCardAlert]}>
          <View style={styles.vitalHeaderRow}>
            <View style={styles.vitalIconTitle}>
              <Heart color={isSimulatedAnomalyActive ? '#E11D48' : '#EF4444'} size={16} />
              <Text style={styles.vitalLabel}>Frequência</Text>
            </View>
            <Sparkline
              data={last7DaysBpm}
              color={isSimulatedAnomalyActive ? '#E11D48' : '#EF4444'}
              width={54}
              height={22}
            />
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
          <View style={styles.vitalHeaderRow}>
            <View style={styles.vitalIconTitle}>
              <Activity color={isSimulatedAnomalyActive ? '#EA580C' : '#3B82F6'} size={16} />
              <Text style={styles.vitalLabel}>HRV</Text>
            </View>
            <Sparkline
              data={last7DaysHrv}
              color={isSimulatedAnomalyActive ? '#EA580C' : '#3B82F6'}
              width={54}
              height={22}
            />
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
          <View style={styles.vitalHeaderRow}>
            <View style={styles.vitalIconTitle}>
              <Moon color="#8B5CF6" size={16} />
              <Text style={styles.vitalLabel}>Sono</Text>
            </View>
            <Sparkline data={last7DaysSleep} color="#8B5CF6" width={54} height={22} />
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

      {/* 4. Gráfico do Biomarcador Selecionado com Seletores e Correlação (RF-P02) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Evolução Histórica do Biomarcador</Text>
        <Text style={styles.sectionBadge}>
          {activeBiomarkerData?.measurements.length || 0} aferições
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

          {/* Componente BiomarkerChart Aprimorado com Tooltip e Correlação */}
          <BiomarkerChart
            data={activeBiomarkerData.measurements.map((m) => ({
              date: m.date,
              value: m.value,
              labName: m.labName,
            }))}
            refMin={activeBiomarkerData.definition.refMin}
            refMax={activeBiomarkerData.definition.refMax}
            unit={activeBiomarkerData.definition.unit}
            lineColor="#0D9488"
            width={SCREEN_WIDTH - 64}
            height={200}
            correlationData={
              activeBiomarkerData.definition.id === 'ferritina' || activeBiomarkerData.definition.id === 'glicose'
                ? correlationDataset
                : undefined
            }
          />
        </View>
      )}

      {/* 5. Lista de Biomarcadores com Filtros */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Selecione para Inspecionar</Text>
      </View>

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
                        {item.trend === 'up' && <TrendingUp size={12} color="#E11D48" />}
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
  heroCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroCardAlert: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 10,
  },
  metricTags: {
    flexDirection: 'row',
    gap: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  tagValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  alertCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  alertIconWrapper: {
    backgroundColor: '#FFE4E6',
    padding: 8,
    borderRadius: 10,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#BE123C',
  },
  alertTimestamp: {
    fontSize: 10,
    color: '#E11D48',
  },
  alertDescription: {
    fontSize: 12,
    color: '#881337',
    lineHeight: 17,
    marginBottom: 10,
  },
  alertDataBox: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertDataText: {
    fontSize: 11,
    color: '#9F1239',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  alertPrimaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E11D48',
    paddingVertical: 10,
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
    borderColor: '#FECDD3',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertSecondaryButtonText: {
    color: '#BE123C',
    fontWeight: '700',
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
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
  sectionBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalCardAlert: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  vitalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vitalIconTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vitalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  vitalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  vitalValueAlert: {
    color: '#E11D48',
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  vitalSub: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chartBiomarkerName: {
    fontSize: 15,
    fontWeight: '800',
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
    backgroundColor: '#ECFDF5',
  },
  statusBadgeWarning: {
    backgroundColor: '#FFF1F2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadgeTextSuccess: {
    color: '#047857',
  },
  statusBadgeTextWarning: {
    color: '#BE123C',
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
    fontSize: 11,
    fontWeight: '700',
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
    borderLeftColor: '#E11D48',
  },
  biomarkerRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biomarkerRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  biomarkerRowCategory: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  biomarkerRowValues: {
    alignItems: 'flex-end',
  },
  biomarkerValueText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  biomarkerValueTextAlert: {
    color: '#E11D48',
  },
  biomarkerUnitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  biomarkerTrendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  biomarkerDateText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  noDataText: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
