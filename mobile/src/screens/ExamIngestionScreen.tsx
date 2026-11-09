import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  FileText,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
import { ExamMeasurement } from '../types';

interface ExamIngestionScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

export const ExamIngestionScreen: React.FC<ExamIngestionScreenProps> = ({
  onNavigateToTab,
}) => {
  const { processExamDocumentMock, exams } = useHealthStore();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [extractedResults, setExtractedResults] = useState<ExamMeasurement[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleSimulateExtraction = async (fileName: string) => {
    setSelectedFileName(fileName);
    setIsProcessing(true);
    setExtractedResults(null);

    // Passo 1: Leitura do arquivo
    setCurrentStep('Lendo documento com Gemini Multimodal...');
    await new Promise((r) => setTimeout(r, 600));

    // Passo 2: Extração estruturada
    setCurrentStep('Extraindo biomarcadores em Structured JSON...');
    await new Promise((r) => setTimeout(r, 700));

    // Passo 3: Entity Resolution com HNSW
    setCurrentStep('Padronizando entidades canônicas via pgvector HNSW...');
    const results = await processExamDocumentMock(fileName);

    setCurrentStep('Exame inserido na Linha do Tempo e Grafo Clínico!');
    setIsProcessing(false);
    setExtractedResults(results);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Digitalização Inteligente</Text>
        <Text style={styles.subtitle}>
          Fotografe exames em papel de 10 anos atrás ou suba PDFs de laboratórios. A IA lê e estrutura cada resultado.
        </Text>
      </View>

      {/* Área de Captura Principal */}
      <View style={styles.uploadArea}>
        <View style={styles.uploadIconWrapper}>
          <UploadCloud color="#0D9488" size={32} />
        </View>
        <Text style={styles.uploadTitle}>Envie seu laudo para processamento</Text>
        <Text style={styles.uploadSubtitle}>
          Suporta PDFs, fotos com sombras, amassados e laudos antigos escaneados
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() =>
              handleSimulateExtraction('Foto_Laudo_Amassado_Glicose_2024.jpg')
            }
            disabled={isProcessing}
          >
            <Camera color="#FFFFFF" size={16} />
            <Text style={styles.primaryActionButtonText}>Fotografar Exame</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() =>
              handleSimulateExtraction('Laudo_Fleury_Glicada_Checkup.pdf')
            }
            disabled={isProcessing}
          >
            <FileText color="#0D9488" size={16} />
            <Text style={styles.secondaryActionButtonText}>Anexar PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cenários Rápidos para Live Demo (Garante 100% de estabilidade) */}
      <View style={styles.demoSection}>
        <View style={styles.demoBadge}>
          <Sparkles color="#6366F1" size={14} />
          <Text style={styles.demoBadgeText}>Cenários Rápidos para Demonstração</Text>
        </View>

        <TouchableOpacity
          style={styles.presetCard}
          onPress={() =>
            handleSimulateExtraction('Exame_HemoglobinaGlicada_2026_Fleury.pdf')
          }
          disabled={isProcessing}
        >
          <View style={styles.presetIcon}>
            <FileCheck color="#0D9488" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.presetTitle}>Laudo Fleury 2026 (PDF Digital)</Text>
            <Text style={styles.presetDesc}>
              Extrai Glicemia de Jejum (108 mg/dL) e HbA1c (5.8%) com faixas de referência.
            </Text>
          </View>
          <ArrowRight color="#94A3B8" size={16} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetCard}
          onPress={() =>
            handleSimulateExtraction('Foto_Exame_Papel_Amassado_2024.jpg')
          }
          disabled={isProcessing}
        >
          <View style={[styles.presetIcon, { backgroundColor: '#FEF3C7' }]}>
            <Camera color="#D97706" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.presetTitle}>Foto de Papel Amassado com Ruído</Text>
            <Text style={styles.presetDesc}>
              Demonstra tolerância da IA a sombras e caligrafia mista de laboratório.
            </Text>
          </View>
          <ArrowRight color="#94A3B8" size={16} />
        </TouchableOpacity>
      </View>

      {/* Feedback de Processamento em Tempo Real */}
      {isProcessing && (
        <View style={styles.processingCard}>
          <ActivityIndicator size="small" color="#0D9488" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.processingTitle}>Processando "{selectedFileName}"</Text>
            <Text style={styles.processingStep}>{currentStep}</Text>
          </View>
        </View>
      )}

      {/* Resultados da Extração Recente (Structured Output) */}
      {extractedResults && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <CheckCircle2 color="#10B981" size={22} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.resultTitle}>Laudo Estruturado com Sucesso!</Text>
              <Text style={styles.resultSubtitle}>
                {extractedResults.length} biomarcadores mapeados e integrados ao histórico.
              </Text>
            </View>
          </View>

          <View style={styles.extractedTable}>
            {extractedResults.map((item) => (
              <View key={item.id} style={styles.extractedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.extractedName}>{item.canonicalName}</Text>
                  <Text style={styles.extractedRef}>
                    Faixa de Referência: {item.refMin} - {item.refMax} {item.unit}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.extractedVal,
                      item.status !== 'normal' && styles.extractedValAlert,
                    ]}
                  >
                    {item.value} {item.unit}
                  </Text>
                  <Text
                    style={[
                      styles.extractedStatusBadge,
                      item.status !== 'normal'
                        ? styles.extractedStatusBadgeAlert
                        : styles.extractedStatusBadgeOk,
                    ]}
                  >
                    {item.status === 'normal' ? 'Normal' : 'Atenção'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.viewTimelineButton}
            onPress={() => onNavigateToTab('Timeline')}
          >
            <Text style={styles.viewTimelineButtonText}>
              Ver Evolução na Linha do Tempo
            </Text>
            <ArrowRight color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>
      )}

      {/* Estatísticas de Digitalização */}
      <View style={styles.statsCard}>
        <View style={styles.statsItem}>
          <Layers color="#0D9488" size={18} />
          <Text style={styles.statsNumber}>{exams.length}</Text>
          <Text style={styles.statsLabel}>Aferições no Grafo</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Clock color="#3B82F6" size={18} />
          <Text style={styles.statsNumber}>4 anos</Text>
          <Text style={styles.statsLabel}>Janela de Histórico</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsItem}>
          <Sparkles color="#8B5CF6" size={18} />
          <Text style={styles.statsNumber}>100%</Text>
          <Text style={styles.statsLabel}>Structured JSON</Text>
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
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CCFBF1',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 260,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionButtonText: {
    color: '#0D9488',
    fontWeight: '700',
    fontSize: 13,
  },
  demoSection: {
    marginBottom: 20,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  presetDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#5EEAD4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  processingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#134E4A',
  },
  processingStep: {
    fontSize: 11,
    color: '#0D9488',
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065F46',
  },
  resultSubtitle: {
    fontSize: 11,
    color: '#047857',
  },
  extractedTable: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginBottom: 14,
    gap: 8,
  },
  extractedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  extractedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  extractedRef: {
    fontSize: 11,
    color: '#64748B',
  },
  extractedVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  extractedValAlert: {
    color: '#DC2626',
  },
  extractedStatusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  extractedStatusBadgeOk: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
  },
  extractedStatusBadgeAlert: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  viewTimelineButton: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewTimelineButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  statsLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#E2E8F0',
  },
});
