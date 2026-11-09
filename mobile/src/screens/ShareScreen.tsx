import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  ExternalLink,
} from 'lucide-react-native';
import { useHealthStore } from '../store/useHealthStore';

export const ShareScreen: React.FC = () => {
  const { doctorSession, generateDoctorAccessSession, revokeDoctorAccessSession } = useHealthStore();
  const [copied, setCopied] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<string>('01h 59m 40s');

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
          Estilo Open Finance: autorize seu médico a visualizar o histórico completo e os sinais do wearable na consulta em 1 página.
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
              size={190}
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

      {/* Botões de Ação */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => generateDoctorAccessSession()}
        >
          <RefreshCw color="#0D9488" size={16} />
          <Text style={styles.regenerateButtonText}>Gerar Novo Token (2h)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => revokeDoctorAccessSession()}
        >
          <Lock color="#991B1B" size={16} />
          <Text style={styles.revokeButtonText}>Revogar Acesso</Text>
        </TouchableOpacity>
      </View>

      {/* Políticas e Garantias de Privacidade */}
      <View style={styles.securityBox}>
        <Text style={styles.securityTitle}>Garantias de Segurança do Acesso:</Text>

        <View style={styles.securityItem}>
          <CheckCircle2 color="#10B981" size={16} />
          <Text style={styles.securityItemText}>
            <Text style={{ fontWeight: '700' }}>Estritamente Somente-Leitura (Read-Only):</Text> O médico não pode alterar ou apagar nenhum laudo.
          </Text>
        </View>

        <View style={styles.securityItem}>
          <CheckCircle2 color="#10B981" size={16} />
          <Text style={styles.securityItemText}>
            <Text style={{ fontWeight: '700' }}>Expiração Automática:</Text> O link é destruído assim que o cronômetro zerar ou você revogar.
          </Text>
        </View>

        <View style={styles.securityItem}>
          <CheckCircle2 color="#10B981" size={16} />
          <Text style={styles.securityItemText}>
            <Text style={{ fontWeight: '700' }}>Briefing Pré-Consulta por IA:</Text> O médico recebe um resumo clínico de 30 segundos dos pontos de atenção.
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
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
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
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
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
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  qrContainer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  noSessionBox: {
    width: 190,
    height: 190,
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
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  qrSubInstructions: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
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
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  regenerateButton: {
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
  regenerateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  revokeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  revokeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  securityBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  securityItemText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});
