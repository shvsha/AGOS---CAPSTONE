import { useState, useMemo } from 'react'
import { View, Text, Button, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { useAuth } from '@/lib/AuthContext'
import CanalMapScreen from '@/components/CanalMapScreen'
import NodeDetailSheet, { type NodeDetail, type WasteType } from '@/components/NodeDetailSheet'
import WasteCompositionCard from '@/components/WasteCompositionCard'

const BASE_URL = 'http://192.168.1.6:8000'

// sample 16.22860098998172, 120.48818553308658   16.22774706142387, 120.48824221434968 subusub nad tay ac nodes
const nodes = [
  { id: 1, latitude: 16.22860098998172, longitude: 120.48818553308658, status: 'critical' as const, label: 'Nejal St' },
  { id: 2, latitude: 16.22774706142387, longitude: 120.48824221434968, status: 'medium' as const, label: 'Aquitania St.' },
]

const STATUS_LABELS: Record<string, string> = {
  none: 'No issues',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

//hardcoded nodes
const nodeDetailOverrides: Record<string | number, Partial<NodeDetail>> = {
  1: {
    title: 'Node 4 – Purok 1',
    waterLevelPercent: 94,
    sensorReadingCm: 8.2,
    lastUpdated: '2 mins ago',
    flowRate: -12,
    flowStatusLabel: 'Stagnant',
    wasteType: 'residual',
    clogPercentage: 70,
    severity: 'High',
  },
  2: {
    title: 'Node 2 – Aquitania St.',
    waterLevelPercent: 58,
    sensorReadingCm: 5.1,
    lastUpdated: '5 mins ago',
    flowRate: 4,
    flowStatusLabel: 'Normal',
    wasteType: 'residual',
    clogPercentage: 22,
    severity: 'Low',
  },
}

//bot sheet 
function getNodeDetail(node: (typeof nodes)[number]): NodeDetail {
  const override = nodeDetailOverrides[node.id] ?? {}
  return {
    id: node.id,
    title: node.label ?? `Node ${node.id}`,
    status: node.status,
    statusLabel: STATUS_LABELS[node.status] ?? node.status,
    waterLevelPercent: 0,
    sensorReadingCm: 0,
    lastUpdated: 'No data yet',
    flowRate: 0,
    flowStatusLabel: 'Unknown',
    wasteType: 'unclassified' as WasteType,
    clogPercentage: 0,
    severity: 'Unknown',
    ...override,
  }
}

//cards data
const stats = {
  monitoringPointsTotal: 9,
  monitoringPointsOffline: 0,
  criticalNodesCount: 1,
  obstructedCanalsCount: 1,
  obstructedCanalsPercentOfTotal: 14,
  averageWaterLevelPercent: 64,
  averageWaterLevelChangePercent: 8,
}

//waste compo data
const wasteComposition = {
  totalKg: 40,
  segments: [
    { label: 'Recyclable Waste', percent: 37.5, color: '#7ED99A' },
    { label: 'Biodegradable Waste', percent: 25, color: '#7EB6E8' },
    { label: 'Residual Waste', percent: 25, color: '#F0B87E' },
    { label: 'Special Waste', percent: 12.5, color: '#E88888' },
  ],
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  subtitleColor,
}: {
  icon: keyof typeof Feather.glyphMap
  title: string
  value: string
  subtitle: string
  subtitleColor?: string
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <Feather name={icon} size={14} color="#5B6472" />
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={[styles.statCardSubtitle, subtitleColor ? { color: subtitleColor } : null]}>
        {subtitle}
      </Text>
    </View>
  )
}

//deafault code
export default function TabOneScreen() {
  const { logout } = useAuth()

  const [result, setResult] = useState('Not tested yet')
  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(null)

  const selectedNode = useMemo(() => {
    if (selectedNodeId === null) return null
    const node = nodes.find((n) => n.id === selectedNodeId)
    return node ? getNodeDetail(node) : null
  }, [selectedNodeId])

  const handleRespond = (nodeId: string | number) => {
    // TODO: wire up to your respond/dispatch flow
    setSelectedNodeId(null)
  }

  const handleMarkCleared = (nodeId: string | number) => {
    // TODO: wire up to your API to mark the node cleared
    setSelectedNodeId(null)
  }


  const testConnection = async () => {
    setResult('Testing...')
    try {
      const res = await fetch(`${BASE_URL}/api/auth/mobile-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'ballpenandpencil619@gmail.com', password: 'yO4N9aivlL' }),
      })
      const data = await res.json()
      setResult(`Status ${res.status}: ${JSON.stringify(data)}`)
    } catch (err: any) {
      setResult(`FAILED: ${err.message}`)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>Localized Canal Map</Text>
        
      </View>

      <View style={styles.wrapper}>
        
        {/* mapp */}
        <CanalMapScreen
          nodes={nodes}
          centerLat={16.22860098998172}
          centerLng={120.48818553308658}
          overallRiskLevel="Medium"
          onMarkerPress={(id) => setSelectedNodeId(id)}
        />

        {/* cards  */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>

            {/* monitoring points */}
            <StatCard
              icon="map-pin"
              title="Monitoring Points"
              value={String(stats.monitoringPointsTotal)}
              subtitle={`Online \u2022 ${stats.monitoringPointsOffline} offline`}
            />

            {/* critcal nodes  */}
            <StatCard
              icon="alert-triangle"
              title="Critical Nodes"
              value={String(stats.criticalNodesCount)}
              subtitle="Immediate action is needed"
              subtitleColor="#E74C3C"
            />
          </View>

          <View style={styles.statsRow}>

            {/* obstructed canlas  */}
            <StatCard
              icon="slash" //la aq mahanap na maganda hihe
              title="Obstructed Canals"
              value={String(stats.obstructedCanalsCount)}
              subtitle={`${stats.obstructedCanalsPercentOfTotal}% of total`}
            />

            {/* avg water level  */}
            <StatCard
              icon="droplet"
              title="Average water level"
              value={`${stats.averageWaterLevelPercent}%`}
              subtitle={`\u2191 ${stats.averageWaterLevelChangePercent}% since last hour`}
            />
          </View>
        </View>

        {/* waste somposition */}
          <WasteCompositionCard
            totalKg={wasteComposition.totalKg}
            segments={wasteComposition.segments}
          />


      </View>

      {/* default code */}
      <Text style={styles.text}>{result}</Text>
      <Button title="Test Backend Connection" onPress={testConnection} />

      <Pressable onPress={logout}>
        <Text style={styles.text}>Log out (temp)</Text>
      </Pressable>

      {/* bot sheet */}
      <NodeDetailSheet
        node={selectedNode}
        visible={selectedNode !== null}
        onClose={() => setSelectedNodeId(null)}
        onRespond={handleRespond}
        onMarkCleared={handleMarkCleared}
      />

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDF2F7' },
  container: {
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },

  text: {
    fontSize: 16,
    textAlign: 'center',
  },

  topBar: {
    width: '100%',
    paddingTop: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#1A1A1A' },

  wrapper: {
    width: '100%',
    backgroundColor: '#fafcfd',
    borderRadius: 12,
    overflow: 'hidden',
  },


  //cards css
  statsGrid: { padding: 12, gap: 10 },

  statsRow: { flexDirection: 'row', gap: 10 },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  statCardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 6 
  },

  statCardTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#5B6472' 
  },

  statCardValue: { fontSize: 20, 
    fontWeight: '700', 
    color: '#1A1A1A', 
    marginBottom: 2 
  },

  statCardSubtitle: { fontSize: 11, color: '#8A93A0' },


})

