import { useMemo, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { WebView } from 'react-native-webview'
import { Feather } from '@expo/vector-icons'

//canal stats
export type CanalStatus = 'none' | 'low' | 'medium' | 'high' | 'critical'

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
  overallRiskLevel?: string // e.g. "Medium" for the bottom banner
  onMarkerPress?: (nodeId: string | number) => void
}

//canal stats color
const STATUS_COLORS: Record<CanalStatus, string> = {
  none: '#2F6FED',     // no issues
  low: '#2ECC71',      //ow
  medium: '#A3D93B',   // Medium
  high: '#F39C12',     //high
  critical: '#E74C3C', //Critical
}

//canal stats clr
const STATUS_LABELS: Record<CanalStatus, string> = {
  none: 'No issues',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

//openstreet map & leaf
function buildLeafletHtml(nodes: CanalNode[], centerLat: number, centerLng: number, zoom: number) {
  const markersJs = nodes
    .map((n) => {
      const color = STATUS_COLORS[n.status]
      const soft = hexToRgba(color, 0.4)
      const label = (n.label ?? '').replace(/'/g, "\\'")
      return `
        (function() {
          var el = document.createElement('div');
          el.className = 'glow-marker';
          el.setAttribute('data-color', '${color}');
          el.setAttribute('data-soft', '${soft}');
          el.style.background = '${color}';

          L.marker([${n.latitude}, ${n.longitude}], {
            icon: L.divIcon({ className: '', html: el.outerHTML, iconSize: [18, 18], iconAnchor: [9, 9] }),
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

    .glow-marker {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      box-sizing: border-box;
      border: 1px solid rgba(0, 0, 0, 0.07);
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

    ${markersJs}

    window.zoomIn = function() { map.zoomIn(); };
    window.zoomOut = function() { map.zoomOut(); };

    
    function pulseLoop(timestamp) {
      var t = (timestamp % 1800) / 1800; // 1.8s cycle, 0..1
      var intensity = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0..1 smooth wave

      var blur1 = 6 + intensity * 4;   // 6px -> 10px
      var spread1 = 2 + intensity * 2; // 2px -> 4px
      var blur2 = 16 + intensity * 8;  // 16px -> 24px
      var spread2 = 6 + intensity * 4; // 6px -> 10px

      var markers = document.querySelectorAll('.glow-marker');
      for (var i = 0; i < markers.length; i++) {
        var el = markers[i];
        var color = el.getAttribute('data-color');
        var soft = el.getAttribute('data-soft');
        el.style.boxShadow =
          '0 0 ' + blur1 + 'px ' + spread1 + 'px ' + color + ', ' +
          '0 0 ' + blur2 + 'px ' + spread2 + 'px ' + soft;
      }
      requestAnimationFrame(pulseLoop);
    }
    requestAnimationFrame(pulseLoop);
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
  overallRiskLevel,
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
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2F6FED" />
            </View>
          )}
        />

        {/* zoom in/out controls*/}
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
          <Text style={styles.legendTitle}>Legend</Text>
          {(Object.keys(STATUS_LABELS) as CanalStatus[]).map((status) => (
            <View key={status} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[status] }]} />
              <Text style={styles.legendLabel}>{STATUS_LABELS[status]}</Text>
            </View>
          ))}
        </View>
      </View>

      {overallRiskLevel && (
        <View style={styles.riskBanner}>
          <View style={styles.riskBannerLeft}>
            <Feather name="alert-triangle" size={14} color="#C08A00" />
            <Text style={styles.riskBannerText}>Overall flood risk level</Text>
          </View>
          <View style={styles.riskPill}>
            <Text style={styles.riskPillText}>{overallRiskLevel}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  
  container: { flex: 1, backgroundColor: '#F4F6F8'},
  
  mapWrapper: {
    height: 400,
    position: 'relative',
    padding: 15,
    backgroundColor: '#FAFCFD',
    
  },

  webview: { flex: 1,  },

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

  zoomButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  zoomDivider: { 
    height: 5, 
    ackgroundColor: '#e6e7e9' 
  },

  legend: {
    margin: 15,
    position: 'absolute',
    left: 12,
    bottom: 10,
    backgroundColor: '#fffffff2',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  
  },

  legendTitle: { 
    fontSize: 12, 
    fontWeight: '700', 
    marginBottom: 10, 
    color: '#1A1A1A' 
  },

  legendRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 3 
  },

  legendDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 6 
  },

  legendLabel: { 
    fontSize: 12, 
    color: '#333' 
  },

  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF6E5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F5A623',
    

  },

  riskBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  riskBannerText: { fontSize: 13, color: '#7A5B00', fontWeight: '700', },

  riskPill: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  
  riskPillText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
})
