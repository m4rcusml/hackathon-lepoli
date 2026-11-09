import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Activity,
  FilePlus,
  Watch,
  MessageSquare,
  QrCode,
  ShieldAlert,
} from 'lucide-react-native';
import { useHealthStore } from './src/store/useHealthStore';
import { TimelineScreen } from './src/screens/TimelineScreen';
import { ExamIngestionScreen } from './src/screens/ExamIngestionScreen';
import { WearablesScreen } from './src/screens/WearablesScreen';
import { AssistantChatScreen } from './src/screens/AssistantChatScreen';
import { ShareScreen } from './src/screens/ShareScreen';

export type TabKey = 'Timeline' | 'Exames' | 'Dispositivos' | 'Assistente' | 'Compartilhar';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Timeline');
  const { activeAlerts, exams } = useHealthStore();

  const handleNavigate = (tab: string) => {
    if (
      tab === 'Timeline' ||
      tab === 'Exames' ||
      tab === 'Dispositivos' ||
      tab === 'Assistente' ||
      tab === 'Compartilhar'
    ) {
      setActiveTab(tab as TabKey);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Barra de Status Superior */}
      <View style={styles.topAppBar}>
        <View style={styles.topLogoContainer}>
          <View style={styles.logoPill}>
            <Activity color="#0D9488" size={16} />
          </View>
          <Text style={styles.topAppTitle}>Hub de Saúde Pessoal</Text>
        </View>
        <View style={styles.topTag}>
          <Text style={styles.topTagText}>Desafio Rivio</Text>
        </View>
      </View>

      {/* Conteúdo Dinâmico das Telas */}
      <View style={styles.screenContainer}>
        {activeTab === 'Timeline' && <TimelineScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Exames' && <ExamIngestionScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Dispositivos' && <WearablesScreen onNavigateToTab={handleNavigate} />}
        {activeTab === 'Assistente' && <AssistantChatScreen />}
        {activeTab === 'Compartilhar' && <ShareScreen />}
      </View>

      {/* Barra de Navegação Inferior (Bottom Tabs) */}
      <View style={styles.bottomTabBar}>
        {/* Tab 1: Timeline */}
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

        {/* Tab 2: Exames */}
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
            Digitalizar
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Wearables */}
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

        {/* Tab 4: Assistente */}
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

        {/* Tab 5: Compartilhar */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('Compartilhar')}
        >
          <QrCode
            color={activeTab === 'Compartilhar' ? '#0D9488' : '#94A3B8'}
            size={20}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Compartilhar' && styles.tabLabelActive,
            ]}
          >
            Médico (QR)
          </Text>
        </TouchableOpacity>
      </View>
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
    fontWeight: '800',
    color: '#0F172A',
  },
  topTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
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
    paddingHorizontal: 6,
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
    fontWeight: '700',
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
    backgroundColor: '#DC2626',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
