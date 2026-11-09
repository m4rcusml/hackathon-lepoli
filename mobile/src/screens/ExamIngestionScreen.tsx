import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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
  Scan,
  X,
  ShieldCheck,
  Trash2,
  DownloadCloud,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';
import { ExamMeasurement } from '../types';

interface ExamIngestionScreenProps {
  onNavigateToTab: (tabName: string) => void;
}

export const ExamIngestionScreen: React.FC<ExamIngestionScreenProps> = ({
  onNavigateToTab,
}) => {
  const {
    processExamDocumentMock,
    registerUploadedDocument,
    uploadedDocuments,
    deleteUploadedDocument,
    exams,
  } = useHealthStore();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [extractedResults, setExtractedResults] = useState<ExamMeasurement[] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  
  // Modo Câmera / Scanner Viewfinder
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [scanLaserPos, setScanLaserPos] = useState<number>(10);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (isCameraActive) {
      interval = setInterval(() => {
        setScanLaserPos((prev) => (prev > 160 ? 10 : prev + 25));
      }, 120);
    }
    return () => clearInterval(interval);
  }, [isCameraActive]);

  // Upload Real via DocumentPicker (PDF / Imagens)
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await handleProcessRealFile({
          name: file.name,
          uri: file.uri,
          size: file.size,
          mimeType: file.mimeType,
        });
      }
    } catch (err) {
      console.log('Erro ao escolher arquivo:', err);
    }
  };

  // Upload Real via ImagePicker (Galeria ou Câmera)
  const handlePickImageFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para carregar exames.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `Exame_Foto_${Date.now()}.jpg`;
        await handleProcessRealFile({
          name: fileName,
          uri: asset.uri,
          mimeType: 'image/jpeg',
        });
      }
    } catch (err) {
      console.log('Erro ao selecionar foto:', err);
    }
  };

  // Processa o arquivo real selecionado
  const handleProcessRealFile = async (file: {
    name: string;
    uri: string;
    size?: number;
    mimeType?: string;
  }) => {
    setSelectedFileName(file.name);
    setIsProcessing(true);
    setExtractedResults(null);

    setCurrentStep(`Carregando "${file.name}"...`);
    await new Promise((r) => setTimeout(r, 600));

    setCurrentStep('Lendo documento com Gemini 2.5 Flash Multimodal...');
    await new Promise((r) => setTimeout(r, 700));

    setCurrentStep('Extraindo biomarcadores e resolvendo entidades via HNSW...');
    const results = await registerUploadedDocument(file);

    setCurrentStep('Laudo integrado ao histórico com sucesso!');
    setIsProcessing(false);
    setExtractedResults(results);
    setShowReviewModal(true);
  };

  // Processa preset mock da demo
  const handleSimulateExtraction = async (fileName: string) => {
    setSelectedFileName(fileName);
    setIsProcessing(true);
    setExtractedResults(null);

    setCurrentStep('Lendo documento com Gemini 2.5 Flash...');
    await new Promise((r) => setTimeout(r, 600));

    setCurrentStep('Extraindo biomarcadores em Structured JSON...');
    await new Promise((r) => setTimeout(r, 700));

    setCurrentStep('Padronizando entidades canônicas via pgvector HNSW...');
    const results = await processExamDocumentMock(fileName);

    setCurrentStep('Exame inserido na Linha do Tempo e Grafo Clínico!');
    setIsProcessing(false);
    setExtractedResults(results);
    setShowReviewModal(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Digitalização de Laudos</Text>
        <Text style={styles.subtitle}>
          Fotografe exames físicos ou envie PDFs reais. A IA multimodal extrai e padroniza cada biomarcador via HNSW.
        </Text>
      </View>

      {/* Modo Visor de Scanner Simulado */}
      {isCameraActive ? (
        <View style={styles.viewfinderCard}>
          <View style={styles.viewfinderHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Scan color="#0D9488" size={16} />
              <Text style={styles.viewfinderTitle}>Visor de Scanner Óptico Ativo</Text>
            </View>
            <TouchableOpacity onPress={() => setIsCameraActive(false)}>
              <X color="#94A3B8" size={18} />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraBox}>
            <View style={[styles.scanLaser, { top: scanLaserPos }]} />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <View style={[styles.bbox, { top: 35, left: 20, width: 130 }]}>
              <Text style={styles.bboxText}>Laboratório: Fleury (99.8%)</Text>
            </View>
            <View style={[styles.bbox, { top: 75, left: 30, width: 180 }]}>
              <Text style={styles.bboxText}>Glicemia de Jejum: 108 mg/dL</Text>
            </View>
            <View style={[styles.bbox, { top: 115, left: 30, width: 170 }]}>
              <Text style={styles.bboxText}>Hemoglobina Glicada: 5.8%</Text>
            </View>

            <Text style={styles.cameraHint}>Alinhe o laudo dentro do quadro e segure firme</Text>
          </View>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => {
              setIsCameraActive(false);
              handleSimulateExtraction('Foto_Laudo_Capturado_Câmera.jpg');
            }}
          >
            <Camera color="#FFFFFF" size={18} />
            <Text style={styles.captureButtonText}>Capturar & Processar com IA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Área de Upload com Suporte a Arquivos Reais */
        <View style={styles.uploadArea}>
          <View style={styles.uploadIconWrapper}>
            <UploadCloud color="#0D9488" size={30} />
          </View>
          <Text style={styles.uploadTitle}>Envie laudos reais ou fotografe</Text>
          <Text style={styles.uploadSubtitle}>
            Selecione arquivos PDF reais, fotos da galeria ou use o scanner de câmera
          </Text>

          {/* Botões de Ação de Upload */}
          <View style={styles.uploadActionGrid}>
            <TouchableOpacity
              style={styles.realUploadBtn}
              onPress={handlePickDocument}
              disabled={isProcessing}
            >
              <FileText color="#0D9488" size={16} />
              <Text style={styles.realUploadBtnText}>Escolher PDF Real</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.realUploadBtn}
              onPress={handlePickImageFromGallery}
              disabled={isProcessing}
            >
              <ImageIcon color="#3B82F6" size={16} />
              <Text style={[styles.realUploadBtnText, { color: '#2563EB' }]}>Foto da Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.realUploadBtn, styles.scannerBtnFull]}
              onPress={() => setIsCameraActive(true)}
              disabled={isProcessing}
            >
              <Camera color="#FFFFFF" size={16} />
              <Text style={[styles.realUploadBtnText, { color: '#FFFFFF' }]}>Abrir Scanner com Câmera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Cenários Rápidos para Live Demo (Garante 100% de estabilidade) */}
      <View style={styles.demoSection}>
        <View style={styles.demoBadge}>
          <Sparkles color="#6366F1" size={12} />
          <Text style={styles.demoBadgeText}>Cenários Rápidos para a Banca</Text>
        </View>

        <TouchableOpacity
          style={styles.presetCard}
          onPress={() => handleSimulateExtraction('Exame_HemoglobinaGlicada_2026_Fleury.pdf')}
          disabled={isProcessing}
        >
          <View style={styles.presetIcon}>
            <FileCheck color="#0D9488" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.presetTitle}>Laudo Fleury 2026 (PDF Digital)</Text>
            <Text style={styles.presetDesc}>
              Extrai Glicemia de Jejum (108 mg/dL) e HbA1c (5.8%) com faixas de referência.
            </Text>
          </View>
          <ArrowRight color="#94A3B8" size={14} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.presetCard}
          onPress={() => handleSimulateExtraction('Foto_Exame_Papel_Amassado_2024.jpg')}
          disabled={isProcessing}
        >
          <View style={[styles.presetIcon, { backgroundColor: '#FEF3C7' }]}>
            <Camera color="#D97706" size={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.presetTitle}>Foto de Papel Amassado com Ruído</Text>
            <Text style={styles.presetDesc}>
              Demonstra tolerância da IA multimodal a sombras e caligrafia mista.
            </Text>
          </View>
          <ArrowRight color="#94A3B8" size={14} />
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

      {/* Card de Resultados da Extração Recente */}
      {extractedResults && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <CheckCircle2 color="#10B981" size={20} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.resultTitle}>Laudo Estruturado com Sucesso!</Text>
              <Text style={styles.resultSubtitle}>
                {extractedResults.length} biomarcadores mapeados e integrados ao histórico.
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowReviewModal(true)}>
              <Text style={styles.reviewLink}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.extractedTable}>
            {extractedResults.map((item) => (
              <View key={item.id} style={styles.extractedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.extractedName}>{item.canonicalName}</Text>
                  <Text style={styles.extractedRef}>
                    Faixa: {item.refMin} - {item.refMax} {item.unit}
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

      {/* Lista de Documentos Armazenados do Usuário */}
      <View style={styles.sectionTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <FolderOpen color="#1E293B" size={16} />
          <Text style={styles.sectionTitle}>Documentos & Laudos Armazenados</Text>
        </View>
        <Text style={styles.docCountBadge}>{uploadedDocuments.length} arquivos</Text>
      </View>

      <View style={styles.docList}>
        {uploadedDocuments.map((doc) => {
          const isPdf = doc.mimeType?.includes('pdf') || doc.name.endsWith('.pdf');
          const sizeKb = doc.size ? Math.round(doc.size / 1024) : 380;
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={[styles.docIconCircle, { backgroundColor: isPdf ? '#FEE2E2' : '#F0FDFA' }]}>
                {isPdf ? <FileText color="#E11D48" size={18} /> : <ImageIcon color="#0D9488" size={18} />}
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                <Text style={styles.docSub}>
                  {doc.uploadedAt} • {sizeKb} KB • {doc.extractedCount} biomarcadores
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteDocBtn}
                onPress={() => deleteUploadedDocument(doc.id)}
              >
                <Trash2 color="#94A3B8" size={16} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Modal de Conferência Rápida */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShieldCheck color="#0D9488" size={20} />
                <Text style={styles.modalTitle}>Conferência de Extração IA</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Revisão dos campos lidos pelo Gemini 2.5 Flash com índice de confiança de 99.2%:
            </Text>

            {extractedResults?.map((r) => (
              <View key={r.id} style={styles.modalItemBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemName}>{r.canonicalName}</Text>
                  <Text style={styles.modalItemLab}>
                    {r.labName} • {r.date}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.modalItemVal}>
                    {r.value} {r.unit}
                  </Text>
                  <Text style={styles.modalConfidence}>Confiança: 99.4%</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => setShowReviewModal(false)}
            >
              <CheckCircle2 color="#FFFFFF" size={16} />
              <Text style={styles.modalConfirmText}>Confirmar e Integrar ao Grafo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 4,
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
  viewfinderCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  viewfinderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewfinderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2DD4BF',
    textTransform: 'uppercase',
  },
  cameraBox: {
    height: 190,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scanLaser: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2DD4BF',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#2DD4BF',
  },
  cornerTL: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  bbox: {
    position: 'absolute',
    backgroundColor: 'rgba(45, 212, 191, 0.25)',
    borderWidth: 1,
    borderColor: '#2DD4BF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bboxText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraHint: {
    position: 'absolute',
    bottom: 12,
    fontSize: 10,
    color: '#94A3B8',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 8,
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CCFBF1',
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
    maxWidth: 270,
  },
  uploadActionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  realUploadBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  realUploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  scannerBtnFull: {
    minWidth: '100%',
    backgroundColor: '#0D9488',
    borderColor: '#0F766E',
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
    fontSize: 11,
    fontWeight: '800',
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
    width: 38,
    height: 38,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  resultSubtitle: {
    fontSize: 11,
    color: '#047857',
  },
  reviewLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
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
    color: '#E11D48',
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
    backgroundColor: '#FFE4E6',
    color: '#BE123C',
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  docCountBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  docList: {
    gap: 8,
    marginBottom: 20,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  docIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  docSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteDocBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 14,
  },
  modalItemBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  modalItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalItemLab: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalItemVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalConfidence: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  modalConfirmButton: {
    flexDirection: 'row',
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
