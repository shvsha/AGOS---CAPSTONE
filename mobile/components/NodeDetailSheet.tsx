import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native'
import { Feather } from '@expo/vector-icons'
import type { CanalStatus } from '@/components/CanalMapScreen'

export type WasteType = 'residual' | 'recyclable' | 'biodegradable' | 'special' | 'unclassified'

export interface NodeDetail {
  id: string | number
  title: string 
  status: CanalStatus
  statusLabel: string 
  waterLevelPercent: number
  sensorReadingCm: number
  lastUpdated: string 
  flowRate: number 
  flowStatusLabel: string 
  wasteType: WasteType
  clogPercentage: number
  severity: string
}

interface NodeDetailSheetProps {
  node: NodeDetail | null
  visible: boolean
  onClose: () => void
  onRespond?: (nodeId: string | number) => void
  onMarkCleared?: (nodeId: string | number) => void
}

//canal stats clr
const STATUS_COLORS: Record<CanalStatus, string> = {
  none: '#2F6FED',
  low: '#2ECC71',
  medium: '#A3D93B',
  high: '#F39C12',
  critical: '#E74C3C',
}

//waste classification
const WASTE_TYPE_LABELS: Record<WasteType, string> = {
  residual: 'Residual',
  recyclable: 'Recyclable',
  biodegradable: 'Biodegradable',
  special: 'Special waste',
  unclassified: 'Not yet classified',
}

//waste classification clr
const WASTE_TYPE_COLORS: Record<WasteType, string> = {
  residual: '#4B4B4B',
  recyclable: '#2F6FED',
  biodegradable: '#2ECC71',
  special: '#E74C3C',
  unclassified: '#B7BEC7',
}


export default function NodeDetailSheet({
  node,
  visible,
  onClose,
  onRespond,
  onMarkCleared,
}: NodeDetailSheetProps) {
  
  const sheetHeight = Dimensions.get('window').height

  const translateY = useRef(new Animated.Value(sheetHeight)).current

  
  useEffect(() => {
    if (visible && node) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start()
    }
  }, [visible, node?.id])

  const closeAnimated = () => {
    Animated.timing(translateY, {
      toValue: sheetHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose())
  }

  //bot sheet code
  const panResponder = useRef(
    PanResponder.create({
      
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, gesture) => Math.abs(gesture.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_evt, gesture) => Math.abs(gesture.dy) > 2,
      
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_evt, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy)
      },

      onPanResponderRelease: (_evt, gesture) => {
        const shouldDismiss = gesture.dy > 120 || gesture.vy > 0.8
        if (shouldDismiss) {
          Animated.timing(translateY, {
            toValue: sheetHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose())
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start()
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start()
      },
      
    })
  ).current
  
  if (!node || !visible) return null

  const statusColor = STATUS_COLORS[node.status]

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={closeAnimated} />

      <Animated.View style={[styles.sheet, { bottom: 0, transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={closeAnimated} hitSlop={10}>
          <Feather name="x" size={20} color="rgb(168, 161, 161)" />
        </TouchableOpacity>

        <View style={styles.titleRow}>

          <View style={styles.titleLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.title}>{node.title}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{node.statusLabel}</Text>
          </View>

        </View>

        <View style={styles.divider} />

        {/* waterr lvl */}
        <View style={styles.sectionHeader}>
          <Feather name="droplet" size={13} color="#2F6FED" />
          <Text style={styles.sectionTitle}>WATER LEVEL DATA</Text>
        </View>
        <Row label="Current level" value={`${node.waterLevelPercent}% capacity`} valueColor={statusColor} />

        <Row label="Sensor reading" value={`${node.sensorReadingCm} cm from sensor`} />

        <Row label="Last updated" value={node.lastUpdated} muted />

        <View style={styles.divider} />

        {/* water flow */}
        <View style={styles.sectionHeader}>
          <Feather name="activity" size={13} color="#2F6FED" />
          <Text style={styles.sectionTitle}>WATER FLOW DATA</Text>
        </View>

        <Row
          label="Flow rate"
          value={`${node.flowStatusLabel}  ${node.flowRate >= 0 ? '+' : ''}${node.flowRate} L/min`}
          valueColor="#E74C3C"
        />

        <View style={styles.divider} />

        {/* clog detection */}
        <View style={styles.sectionHeader}>
          <Feather name="slash" size={13} color="#2F6FED" />
          <Text style={styles.sectionTitle}>CLOG DETECTION</Text>
        </View>

        <Row
          label="Waste type"
          value={WASTE_TYPE_LABELS[node.wasteType]}
          valueColor={WASTE_TYPE_COLORS[node.wasteType]}
        />

        <Row label="Clog percentage" value={`${node.clogPercentage}%`} />

        <Row label="Severity" value={node.severity} />

      </Animated.View>
    </Modal>
  )
}

function Row({
  label,
  value,
  valueColor,
  muted,
}: {
  label: string
  value: string
  valueColor?: string
  muted?: boolean
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          valueColor ? { color: valueColor, fontWeight: '700' } : null,
          muted ? { color: '#8A93A0' } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.36)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    //bottom: 0,
    backgroundColor: '#F9FAFA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 35,
    paddingTop: 25,
    paddingBottom: 60,
  },

  handleArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 10,
  },

  handle: {
    alignSelf: 'center',
    width: 70,
    height: 5,
    borderRadius: 2,
    backgroundColor: '#D8DCE2',
    marginTop: 0,
    marginBottom: 30,
  },

  closeButton: { position: 'absolute', right: 16, top: 25 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },

  titleLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    flexShrink: 1 
  },

  statusDot: { 
    width: 9, 
    height: 9, 
    borderRadius: 4.5 
  },

  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1A1A1A' 
  },

  statusPill: { 
    borderRadius: 12, 
    paddingVertical: 4, 
    paddingHorizontal: 12 
  },

  statusPillText: { fontSize: 12, fontWeight: '700' },

  divider: { 
    height: 1, 
    backgroundColor: '#e6e1e1', 
    marginVertical: 12 
  },

  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 8 
  },

  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#2F6FED', 
    letterSpacing: 0.4 
  },

  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 },

  rowLabel: { fontSize: 13, color: '#5B6472' },
  rowValue: { fontSize: 13, color: '#1A1A1A', fontWeight: '600' },

  
})
