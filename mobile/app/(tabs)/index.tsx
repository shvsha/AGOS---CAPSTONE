import { useState, useMemo } from 'react'
import { View, Text, Button, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'

import { useAuth } from '@/lib/AuthContext'
import CanalMapScreen, { type CanalStatus } from '@/components/maps/CanalMapScreen'
import NodeDetailSheet, { type NodeDetail } from '@/components/maps/NodeDetailSheet'
import WasteCompositionCard from '@/components/maps/WasteCompositionCard'
import { useMapData } from '@/hooks/useMapData'
import { useRainfallCondition } from '@/hooks/useRainfallCondition'
import { SensorNodeApi } from '@/types/map'

const BASE_URL = 'http://192.168.1.6:8000'

// Rosario, La Union
const FALLBACK_CENTER = { lat: 16.23031273833657, lng: 120.48632076236241 }

function formatRelativeTime(timestamp: string | null) {
  if (!timestamp) return 'No data yet'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function getNodeDetail(node: SensorNodeApi): NodeDetail {
  const depth = node.hotspot_details?.canal_depth
  const waterLevelPercent =
    node.water_level != null && depth
      ? Math.min(100, Math.max(0, (node.water_level / depth) * 100))
      : null

  const status: CanalStatus = node.condition ?? 'Normal'

  return {
    id: node.node_id,
    title: node.hotspot_details?.name
      ? `${node.node_name} – ${node.hotspot_details.name}`
      : node.node_name,
    status,
    statusLabel: status,
    waterLevelPercent,
    sensorReadingCm: node.water_level,
    lastUpdated: formatRelativeTime(node.last_reading_at),
    flowRate: node.water_flow_rate,
    clogPercentage: node.clog_pct,
  }
}

function StatCard({ icon, title, value, subtitle, subtitleColor, }: {
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

export default function TabOneScreen() {
  const { logout } = useAuth()

  const [result, setResult] = useState('Not tested yet')
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)

  const { nodes, mappableNodes, stats, composition, loading, error, refetch } = useMapData()
  const { riskLevel } = useRainfallCondition()

  const totalWasteKg = useMemo(
    () => Math.round(composition.reduce((sum) => sum, 0)), // placeholder
    [composition]
  )

  const canalNodes = useMemo(
    () =>
      mappableNodes.map((n) => ({
        id: n.node_id,
        latitude: n.hotspot_details!.latitude,
        longitude: n.hotspot_details!.longitude,
        status: (n.condition ?? 'Normal') as CanalStatus,
        label: n.node_name,
      })),
    [mappableNodes]
  )

  const center = useMemo(() => {
    if (mappableNodes.length === 0) return FALLBACK_CENTER
    const lat = mappableNodes.reduce((sum, n) => sum + n.hotspot_details!.latitude, 0) / mappableNodes.length
    const lng = mappableNodes.reduce((sum, n) => sum + n.hotspot_details!.longitude, 0) / mappableNodes.length
    return { lat, lng }
  }, [mappableNodes])

  const selectedNode = useMemo(() => {
    if (selectedNodeId === null) return null
    const node = nodes.find((n) => n.node_id === selectedNodeId)
    return node ? getNodeDetail(node) : null
  }, [selectedNodeId, nodes])

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
        {error && (
          <View style={styles.centerBox}>
            <Text style={styles.errorText}>Failed to load map data.</Text>
            <Pressable onPress={refetch} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {loading && !error && (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#2F6FED" />
          </View>
        )}

        {!loading && !error && (
          <>
            <CanalMapScreen
              nodes={canalNodes}
              centerLat={center.lat}
              centerLng={center.lng}
              riskLevel={riskLevel}
              onMarkerPress={(id) => setSelectedNodeId(id as number)}
            />

            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  icon="map-pin"
                  title="Monitoring Points"
                  value={String(stats.monitoringPointsTotal)}
                  subtitle="Sensor nodes in this barangay"
                />

                <StatCard
                  icon="alert-triangle"
                  title="Critical Nodes"
                  value={String(stats.criticalNodesCount)}
                  subtitle="Immediate action is needed"
                  subtitleColor="#E74C3C"
                />
              </View>

              <View style={styles.statsRow}>
                <StatCard
                  icon="slash"
                  title="Obstructed Canals"
                  value={String(stats.obstructedCanalsCount)}
                  subtitle={`${stats.obstructedCanalsPercentOfTotal}% of total`}
                />

                <StatCard
                  icon="droplet"
                  title="Average water level"
                  value={stats.averageWaterLevelCm != null ? `${stats.averageWaterLevelCm} cm` : '—'}
                  subtitle="Across all nodes"
                />
              </View>
            </View>

            <WasteCompositionCard
              totalKg={Math.round(composition.reduce((sum, seg: any) => sum, 0))}
              segments={composition.map((c) => ({ label: c.type, percent: c.percent, color: c.color }))}
            />
          </>
        )}
      </View>

      <Text style={styles.text}>{result}</Text>
      <Button title="Test Backend Connection" onPress={testConnection} />

      <Pressable onPress={logout}>
        <Text style={styles.text}>Log out (temp)</Text>
      </Pressable>

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
  container: { alignItems: 'center', padding: 15, gap: 10 },
  text: { fontSize: 16, textAlign: 'center' },
  topBar: { width: '100%', paddingTop: 45, alignItems: 'center', justifyContent: 'center' },
  topBarText: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  wrapper: { width: '100%', backgroundColor: '#fafcfd', borderRadius: 12, overflow: 'hidden' },
  centerBox: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#D81010', fontWeight: '600', marginBottom: 10 },
  retryButton: { borderWidth: 1, borderColor: '#D8DCE2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  retryText: { color: '#5B6472', fontSize: 13 },
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
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statCardTitle: { fontSize: 12, fontWeight: '600', color: '#5B6472' },
  statCardValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  statCardSubtitle: { fontSize: 11, color: '#8A93A0' },
})