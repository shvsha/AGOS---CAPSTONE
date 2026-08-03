import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'


export interface WasteSegment {
  label: string
  percent: number 
  color: string
}

interface WasteCompositionCardProps {
  totalKg: number
  segments: WasteSegment[]
  size?: number 
  strokeWidth?: number 
}

// Component 
export default function WasteCompositionCard({ totalKg, segments, size = 130, strokeWidth = 25, }: WasteCompositionCardProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let cumulativePercent = 0

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Waste Composition</Text>

      <View style={styles.divider} />

      <View style={styles.row}>

        {/* chart */}
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size}>
          
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#EEF0F3"
              strokeWidth={strokeWidth}
              fill="none"
            />

            {segments.map((seg, i) => {
              const segmentLength = (seg.percent / 100) * circumference
              const offset = circumference - (cumulativePercent / 100) * circumference
              cumulativePercent += seg.percent

              return (
                <Circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  strokeDashoffset={offset}
                  strokeLinecap="butt"
                  fill="none"
                  
                  rotation={-90}
                  origin={`${center}, ${center}`}
                />
              )
            })}
          </Svg>

          {/* Center lbl*/}
          <View style={[StyleSheet.absoluteFillObject, styles.centerLabel]}>
            <Text style={styles.centerValue}>{totalKg}</Text>
            <Text style={styles.centerUnit}>KG</Text>
          </View>
        </View>

        {/* legend */}
        <View style={styles.legend}>
          {segments.map((seg, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <Text style={styles.legendLabel}>{seg.label}</Text>
              <Text style={styles.legendPercent}>{seg.percent}%</Text>
            </View>
          ))}

        </View>

      </View>

    </View>
  )
}


//card css
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 15,
    marginTop: 1,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  title: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1A1A1A' 
  },

  divider: { 
    height: 1, 
    backgroundColor: '#e6e1e1', 
    marginVertical: 12 
  },

  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },

  centerLabel: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  centerValue: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1A1A1A' 
  },

  centerUnit: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#8A93A0', 
    marginTop: 1 
  },

  //legend css
  legend: { flex: 1, gap: 10 },

  legendRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },

  legendDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },

  legendLabel: { 
    flex: 1, 
    fontSize: 10.5, 
    color: '#333' 
  },

  legendPercent: { 
    fontSize: 10.5, 
    fontWeight: '700', 
    color: '#1A1A1A' 
  },

})
