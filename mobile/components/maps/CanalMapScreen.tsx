import { useMemo, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { WebView } from 'react-native-webview'
import { Feather } from '@expo/vector-icons'
import { FloodRiskLevel, RISK_STYLE } from '@/constants/rainfall'

// canal stats — matches backend's SensorNodeSerializer.get_condition() exactly
export type CanalStatus = 'Normal' | 'Warning' | 'Critical'

export interface CanalNode {
  id: string | number
  latitude: number
  longitude: number
  status: CanalStatus
  label?: string
}

interface CanalMapScreenProps {
  nodes: CanalNode[]
  centerLat: number
  centerLng: number
  zoom?: number
  riskLevel?: FloodRiskLevel | null
  onMarkerPress?: (nodeId: string | number) => void
}

// matches web's CONDITION_COLORS (colorMode='clog') exactly
const STATUS_COLORS: Record<CanalStatus, string> = {
  Normal: '#1565BC',
  Warning: '#FF9705',
  Critical: '#D81010',
}
const DEFAULT_COLOR = '#727272' // "Sleep Mode" — legend-only, never actually assigned to a live node

const LEGEND_ITEMS: { color: string; label: string }[] = [
  { color: DEFAULT_COLOR, label: 'Sleep Mode' },
  { color: STATUS_COLORS.Normal, label: 'Normal' },
  { color: STATUS_COLORS.Warning, label: 'Warning' },
  { color: STATUS_COLORS.Critical, label: 'Critical' },
]

function buildLeafletHtml(nodes: CanalNode[], centerLat: number, centerLng: number, zoom: number) {
  const markersJs = nodes
    .map((n) => {
      const color = STATUS_COLORS[n.status] ?? DEFAULT_COLOR
      const label = (n.label ?? '').replace(/'/g, "\\'")
      const animation =
        n.status === 'Critical'
          ? 'agos-pulse 0.5s ease-out infinite'
          : n.status === 'Warning'
          ? 'agos-pulse 1.5s ease-out infinite'
          : 'none'

      return `
        (function() {
          var html = buildMarkerHtml('${color}', '${label}', '${animation}');
          L.marker([${n.latitude}, ${n.longitude}], {
            icon: L.divIcon({ className: '', html: html, iconSize: [0, 0], iconAnchor: [0, 0] }),
          }).addTo(map)
            .on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ id: ${JSON.stringify(n.id)} }));
            });
        })();
      `
    })
    .join('\n')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    * { box-sizing: border-box; }

    @keyframes agos-pulse {
      0%   { transform: scale(1);   opacity: 0.6; }
      70%  { transform: scale(4.5); opacity: 0;   }
      100% { transform: scale(1);   opacity: 0;   }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false })
      .setView([${centerLat}, ${centerLng}], ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    function buildMarkerHtml(color, label, animation) {
      var dotSize = 14;
      var half = dotSize / 2;

      var pulseRing = animation !== 'none'
        ? '<div style="position:absolute;width:' + dotSize + 'px;height:' + dotSize + 'px;border-radius:50%;background:' + color + ';opacity:0.4;top:-' + half + 'px;left:-' + half + 'px;animation:' + animation + ';pointer-events:none;"></div>'
        : '';

      var labelTag = label
        ? '<div style="position:absolute;top:-' + (half + 16) + 'px;left:' + (half + 4) + 'px;background:white;color:#122A48;font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.2);border:1px solid #e0e0e0;white-space:nowrap;pointer-events:none;z-index:10;">' + label + '</div>'
        : '';

      var dot = '<div style="position:absolute;width:' + dotSize + 'px;height:' + dotSize + 'px;background:' + color + ';border:2.5px solid white;border-radius:50%;box-shadow:0 0 5px rgba(0,0,0,0.3);top:-' + half + 'px;left:-' + half + 'px;z-index:2;"></div>';

      return '<div style="position:absolute;top:0;left:0;width:0;height:0;overflow:visible;">' + pulseRing + dot + labelTag + '</div>';
    }

    ${markersJs}

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };
  </script>
</body>
</html>
`
}

export default function CanalMapScreen({
  nodes,
  centerLat,
  centerLng,
  zoom = 16,
  riskLevel,
  onMarkerPress,
}: CanalMapScreenProps) {
  const webviewRef = useRef<WebView>(null)

  const html = useMemo(
    () => buildLeafletHtml(nodes, centerLat, centerLng, zoom),
    [nodes, centerLat, centerLng, zoom]
  )

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data?.id && onMarkerPress) onMarkerPress(data.id)
    } catch {
      // ignore malformed messages
    }
  }

  const injectZoom = (fn: 'zoomIn' | 'zoomOut') => {
    webviewRef.current?.injectJavaScript(`window.${fn} && window.${fn}(); true;`)
  }

  const risk = riskLevel ? RISK_STYLE[riskLevel] : null

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          onMessage={handleMessage}
          startInLoadingState
          nestedScrollEnabled
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2F6FED" />
            </View>
          )}
        />

        {/* zoom in/out controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomButton} onPress={() => injectZoom('zoomIn')}>
            <Feather name="plus" size={18} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomButton} onPress={() => injectZoom('zoomOut')}>
            <Feather name="minus" size={18} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Live Risk Level</Text>
          {LEGEND_ITEMS.map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {risk && (
        <View style={[styles.riskBanner, { backgroundColor: risk.bg, borderBottomColor: risk.border }]}>
          <View style={styles.riskBannerLeft}>
            <Feather name="alert-triangle" size={14} color={risk.text} />
            <Text style={[styles.riskBannerText, { color: risk.text }]}>Overall flood risk level</Text>
          </View>
          <View style={[styles.riskPill, { backgroundColor: risk.border }]}>
            <Text style={styles.riskPillText}>{risk.label}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  mapWrapper: {
    height: 400,
    position: 'relative',
    padding: 15,
    backgroundColor: '#FAFCFD',
  },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F8',
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
    margin: 15,
  },
  zoomButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  zoomDivider: { height: 5, backgroundColor: '#e6e7e9' },
  legend: {
    margin: 15,
    position: 'absolute',
    left: 12,
    bottom: 10,
    backgroundColor: '#fffffff2',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  legendTitle: { fontSize: 11, fontWeight: '700', marginBottom: 6, color: '#1A1A1A' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },
  legendLabel: { fontSize: 11, color: '#333' },
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
  },
  riskBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  riskBannerText: { fontSize: 13, fontWeight: '700' },
  riskPill: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12 },
  riskPillText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
})