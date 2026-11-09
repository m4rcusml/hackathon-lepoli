import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {
  QrCode,
  ShieldCheck,
  Clock,
  Copy,
  RefreshCw,
  Lock,
  Eye,
  CheckCircle2,
  X,
  FileBadge,
  Sliders,
  AlertCircle,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';

export const ShareScreen: React.FC = () => {
  const { user, doctorSession, generateDoctorAccessSession, revokeDoctorAccessSession, activeAlerts } = useHealthStore();
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>('01h 59m 40s');

  // Toggles de Escopo Granular (Open Health Protocol)
  const [shareExams, setShareExams] = useState<boolean>(true);
  const [shareWearables, setShareWearables] = useState<boolean>(true);
  const [shareAlerts, setShareAlerts] = useState<boolean>(true);
  const [shareChatNotes, setShareChatNotes] = useState<boolean>(false);

  // Modais
  const [showDoctorPreview, setShowDoctorPreview] = useState<boolean>(false);
  const [showEmergencyCard, setShowEmergencyCard] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!doctorSession?.expiresAt) return;
      const diffMs = new Date(doctorSession.expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setTimeLeft('Expirado');
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}h ${minutes
            .toString()
            .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [doctorSession]);

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <QrCode color="#0D9488" size={24} />
        </View>
        <Text style={styles.title}>Compartilhamento com o Médico</Text>
        <Text style={styles.subtitle}>
          Estilo Open Finance: autorize seu médico a visualizar o histórico completo e os sinais do wearable em 1 página segura.
        </Text>
      </View>

      {/* Cartão Central do QR Code Efêmero (RF-P06) */}
      <View style={styles.qrCard}>
        <View style={styles.badgeRow}>
          <View style={styles.openHealthBadge}>
            <ShieldCheck color="#0F766E" size={14} />
            <Text style={styles.openHealthText}>Open Health Protocol v1</Text>
          </View>
          <View style={styles.timerBadge}>
            <Clock color="#EA580C" size={12} />
            <Text style={styles.timerText}>Expira em: {timeLeft}</Text>
          </View>
        </View>

        <View style={styles.qrContainer}>
          {doctorSession?.accessUrl ? (
            <QRCode
              value={doctorSession.accessUrl}
              size={180}
              color="#0F172A"
              backgroundColor="#FFFFFF"
            />
          ) : (
            <View style={styles.noSessionBox}>
              <Text style={styles.noSessionText}>Nenhuma sessão ativa.</Text>
            </View>
          )}
        </View>

        <Text style={styles.qrInstructions}>
          Aponte a câmera do computador do consultório para este código.
        </Text>
        <Text style={styles.qrSubInstructions}>
          O médico acessa o Cockpit Clínico imediatamente sem precisar de login.
        </Text>

        {/* Link de Contingência */}
        <TouchableOpacity style={styles.copyLinkRow} onPress={handleCopyLink}>
          <Text style={styles.urlPreview} numberOfLines={1}>
            {doctorSession?.accessUrl || 'https://lepoli-health.app/doctor/consultation'}
          </Text>
          <View style={styles.copyBadge}>
            {copied ? (
              <>
                <CheckCircle2 color="#16A34A" size={14} />
                <Text style={[styles.copyBadgeText, { color: '#16A34A' }]}>Copiado!</Text>
              </>
            ) : (
              <>
                <Copy color="#0D9488" size={14} />
                <Text style={styles.copyBadgeText}>Copiar</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Toggles Granulares de Permissão Estilo Open Finance (ETAPA 6) */}
      <View style={styles.permissionsCard}>
        <View style={styles.permissionsHeader}>
          <Sliders color="#0D9488" size={16} />
          <Text style={styles.permissionsTitle}>Escopo Granular de Consentimento:</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Histórico de Exames de Sangue</Text>
            <Text style={styles.toggleDesc}>Laudos de 2022 a 2026 com faixas de referência</Text>
          </View>
          <Switch
            value={shareExams}
            onValueChange={setShareExams}
            trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
            thumbColor={shareExams ? '#0D9488' : '#F1F5F9'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Sinais Vitais de Wearables</Text>
            <Text style={styles.toggleDesc}>BPM, HRV e arquitetura de sono dos últimos 30 dias</Text>
          </View>
          <Switch
            value={shareWearables}
            onValueChange={setShareWearables}
            trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
            thumbColor={shareWearables ? '#0D9488' : '#F1F5F9'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Alertas de Arritmia & Taquicardia</Text>
            <Text style={styles.toggleDesc}>Episódios detectados pelo Apple Watch</Text>
          </View>
          <Switch
            value={shareAlerts}
            onValueChange={setShareAlerts}
            trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
            thumbColor={shareAlerts ? '#0D9488' : '#F1F5F9'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Conversas Pessoais com Assistente</Text>
            <Text style={styles.toggleDesc}>Desmarcado por padrão para proteger sua privacidade</Text>
          </View>
          <Switch
            value={shareChatNotes}
            onValueChange={setShareChatNotes}
            trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
            thumbColor={shareChatNotes ? '#0D9488' : '#F1F5F9'}
          />
        </View>
      </View>

      {/* Botões de Simulação e Ação */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.simulateDoctorButton}
          onPress={() => setShowDoctorPreview(true)}
        >
          <Eye color="#FFFFFF" size={16} />
          <Text style={styles.simulateDoctorText}>Simular Visão do Médico</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyCardButton}
          onPress={() => setShowEmergencyCard(true)}
        >
          <FileBadge color="#0D9488" size={16} />
          <Text style={styles.emergencyCardText}>Cartão de Emergência</Text>
        </TouchableOpacity>
      </View>

      {/* Controles de Ciclo de Vida do Token */}
      <View style={styles.sessionControlRow}>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => generateDoctorAccessSession()}
        >
          <RefreshCw color="#0D9488" size={14} />
          <Text style={styles.regenerateButtonText}>Renovar Token (2h)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => revokeDoctorAccessSession()}
        >
          <Lock color="#E11D48" size={14} />
          <Text style={styles.revokeButtonText}>Revogar Imediatamente</Text>
        </TouchableOpacity>
      </View>

      {/* Modal: Preview da Visão do Médico (ETAPA 6) */}
      <Modal visible={showDoctorPreview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Eye color="#0D9488" size={20} />
                <Text style={styles.modalTitle}>Preview: Cockpit do Médico</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDoctorPreview(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              É exatamente assim que o cardiologista visualizará o prontuário efêmero em sua tela:
            </Text>

            <View style={styles.previewBox}>
              <View style={styles.previewTop}>
                <Text style={styles.previewPatient}>Daniel Vaz, 32 anos (Masculino)</Text>
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyText}>Acesso Somente-Leitura</Text>
                </View>
              </View>

              <View style={styles.briefingBox}>
                <Text style={styles.briefingTitle}>Briefing Pré-Consulta por IA (GraphRAG):</Text>
                <Text style={styles.briefingText}>
                  • Ferritina: 22 ng/mL (Abaixo da ref. 30-400 em out/2025).{'\n'}
                  • Glicemia: 104 mg/dL (Curva ascendente nos últimos 3 anos).{'\n'}
                  • Wearable: 3 picos noturnos de taquicardia em repouso (108-114 BPM) com queda de 62% no HRV.{'\n'}
                  • Hipótese sugerida: Sintomas adrenérgicos secundários à queda de ferro de depósito.
                </Text>
              </View>

              <View style={styles.scopeSummary}>
                <Text style={styles.scopeSummaryText}>
                  Permissões ativas: {shareExams ? '✓ Exames' : ''} {shareWearables ? '✓ Wearables' : ''} {shareAlerts ? '✓ Alertas' : ''}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowDoctorPreview(false)}
            >
              <Text style={styles.closeModalButtonText}>Fechar Visualização</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Cartão de Emergência Rápido (ETAPA 6) */}
      <Modal visible={showEmergencyCard} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FileBadge color="#E11D48" size={20} />
                <Text style={[styles.modalTitle, { color: '#BE123C' }]}>Cartão de Emergência SOS</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEmergencyCard(false)}>
                <X color="#64748B" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.emergencyCardBody}>
              <View style={styles.emergencyField}>
                <Text style={styles.emergencyLabel}>Paciente:</Text>
                <Text style={styles.emergencyVal}>{user.name} ({user.age} anos)</Text>
              </View>
              <View style={styles.emergencyField}>
                <Text style={styles.emergencyLabel}>Condições Clínicas:</Text>
                <Text style={styles.emergencyVal}>Histórico de arritmia e dislipidemia familiar</Text>
              </View>
              <View style={styles.emergencyField}>
                <Text style={styles.emergencyLabel}>Medicações Ativas:</Text>
                <Text style={styles.emergencyVal}>Vitamina D (2000 UI/dia)</Text>
              </View>
              <View style={styles.emergencyField}>
                <Text style={styles.emergencyLabel}>Contato de Emergência:</Text>
                <Text style={styles.emergencyVal}>(11) 98765-4321 (Esposa)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeModalButton, { backgroundColor: '#E11D48' }]}
              onPress={() => setShowEmergencyCard(false)}
            >
              <Text style={styles.closeModalButtonText}>Salvar na Carteira Digital</Text>
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
    alignItems: 'center',
    marginBottom: 18,
    paddingTop: 8,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 320,
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  openHealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  openHealthText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C2410C',
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  noSessionBox: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  noSessionText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  qrInstructions: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  qrSubInstructions: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  copyLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    gap: 8,
  },
  urlPreview: {
    flex: 1,
    fontSize: 10,
    color: '#475569',
    fontFamily: 'monospace',
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  copyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  permissionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  permissionsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  simulateDoctorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  simulateDoctorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  emergencyCardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  emergencyCardText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '800',
  },
  sessionControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regenerateButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  revokeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
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
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewPatient: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  readOnlyBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readOnlyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  briefingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  briefingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 4,
  },
  briefingText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 15,
  },
  scopeSummary: {
    alignItems: 'flex-end',
  },
  scopeSummaryText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  closeModalButton: {
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  emergencyCardBody: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  emergencyField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emergencyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9F1239',
  },
  emergencyVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#881337',
  },
});
