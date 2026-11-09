import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Home,
  Activity,
  FilePlus,
  Watch,
  MessageSquare,
  QrCode,
  ShieldAlert,
  LogOut,
  X,
} from 'lucide-react-native';
import { useHealthStore } from './src/store/useHealthStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { ExamIngestionScreen } from './src/screens/ExamIngestionScreen';
import { WearablesScreen } from './src/screens/WearablesScreen';
import { AssistantChatScreen } from './src/screens/AssistantChatScreen';
import { ShareScreen } from './src/screens/ShareScreen';

export type TabKey = 'Home' | 'Timeline' | 'Exames' | 'Dispositivos' | 'Assistente';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Home');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const { isAuthenticated, activeAlerts, exams, logout } = useHealthStore();

  const handleNavigate = (tab: string) => {
    if (tab === 'Compartilhar') {
      setShowShareModal(true);
      return;
    }
    if (
      tab === 'Home' ||
      tab === 'Timeline' ||
      tab === 'Exames' ||
      tab === 'Dispositivos' ||
      tab === 'Assistente'
    ) {
      setActiveTab(tab as TabKey);
    }
  };

  // 1. Fluxo de Autenticação / Login
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <AuthScreen />
      </SafeAreaView>
    );
  }

  // 2. Aplicação Principal Autenticada
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Barra Superior / Header Executivo */}
      <View style={styles.topAppBar}>
        <View style={styles.topLogoContainer}>
          <View style={styles.logoPill}>
            <Activity color="#0D9488" size={16} />
          </View>
          <Text style={styles.topAppTitle}>Hub de Saúde Pessoal</Text>
        </View>

        <View style={styles.topActionGroup}>
          {/* Botão de Acesso Rápido ao QR Code Médico */}
          <TouchableOpacity
            style={styles.qrHeaderButton}
            onPress={() => setShowShareModal(true)}
          >
            <QrCode color="#0D9488" size={16} />
            <Text style={styles.qrHeaderButtonText}>QR Médico</Text>
          </TouchableOpacity>

          {/* Botão Sair / Logout */}
          <TouchableOpacity
            style={styles.logoutHeaderButton}
            onPress={logout}
          >
            <LogOut color="#64748B" size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo da Tela Selecionada */}
      <View style={styles.screenContainer}>
        {activeTab === 'Home' && <HomeScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Timeline' && <TimelineScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Exames' && <ExamIngestionScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Dispositivos' && <WearablesScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Assistente' && <AssistantChatScreen />}
      </View>

      {/* Barra de Navegação Inferior (Bottom Tabs) */}
      <View style={styles.bottomTabBar}>
        {/* Tab 1: Home Enxuta */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Home')}
        >
          <Home
            color={activeTab === 'Home' ? '#0D9488' : '#94A3B8'}
            size={20}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Home' && styles.tabLabelActive,
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Timeline de Biomarcadores */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Timeline')}
        >
          <Activity
            color={activeTab === 'Timeline' ? '#0D9488' : '#94A3B8'}
            size={20}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Timeline' && styles.tabLabelActive,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Digitalizar / Upload de Exames */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Exames')}
        >
          <View>
            <FilePlus
              color={activeTab === 'Exames' ? '#0D9488' : '#94A3B8'}
              size={20}
            />
            {exams.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{exams.length}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Exames' && styles.tabLabelActive,
            ]}
          >
            Exames
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Wearables e Sinais Contínuos */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Dispositivos')}
        >
          <View>
            <Watch
              color={activeTab === 'Dispositivos' ? '#0D9488' : '#94A3B8'}
              size={20}
            />
            {activeAlerts.length > 0 && (
              <View style={styles.badgeAlert}>
                <ShieldAlert color="#FFFFFF" size={9} />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Dispositivos' && styles.tabLabelActive,
            ]}
          >
            Wearables
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Assistente Clínico GraphRAG */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Assistente')}
        >
          <MessageSquare
            color={activeTab === 'Assistente' ? '#0D9488' : '#94A3B8'}
            size={20}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Assistente' && styles.tabLabelActive,
            ]}
          >
            Assistente
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Compartilhamento com o Médico (QR Code Efêmero) */}
      <Modal visible={showShareModal} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View style={{ width: 32 }} />
            <Text style={styles.modalHeaderTitle}>Open Health Gateway</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowShareModal(false)}
            >
              <X color="#0F172A" size={20} />
            </TouchableOpacity>
          </View>
          <ShareScreen />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoPill: {
    backgroundColor: '#F0FDFA',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  topAppTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  topActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  qrHeaderButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  logoutHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#0D9488',
    fontWeight: '800',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#0D9488',
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  badgeAlert: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E11D48',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
