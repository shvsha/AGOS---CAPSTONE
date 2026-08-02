// react
import { useState } from 'react'
import { Image, View, Text, Pressable, ScrollView, ActivityIndicator, Modal } from 'react-native'
import { useRouter } from 'expo-router'

// icons
import { Ionicons } from '@expo/vector-icons'

// lib
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'


const RIGHTS = [
  'Be informed that your personal information is being processed, and how;',
  'Reasonable access to your personal information, including how and why it is processed;',
  'Dispute and request correction of any inaccurate or outdated information about you;',
  'Object to processing, and request the suspension, withdrawal, blocking, or destruction of your data under circumstances allowed by law;',
  'Be indemnified for damages sustained due to inaccurate, unlawfully obtained, or unauthorized use of your personal information; and',
  'Lodge a complaint with the National Privacy Commission.',
]

export default function PrivacyConsent() {
  const { updateUser } = useAuth()
  const router = useRouter()

  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorModal, setErrorModal] = useState({ open: false, message: '' })

  const handleProceed = async () => {
    if (!agreed || isLoading) return

    setIsLoading(true)
    try {
      // returns { user: <full user object, privacy_agreed_at now set> }
      const data = await api.post('/api/auth/agree-privacy/', {})
      updateUser(data.user)

      if (data.user.must_change_password) {
        router.replace('/change-password')
      } else {
        router.replace('/(tabs)')
      }
    } catch (err: any) {
      setErrorModal({
        open: true,
        message: err?.error ?? 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-[#FAFCFD] items-center justify-center p-5">
      <View className="w-full max-w-[420px] max-h-[92%] bg-[#FFFAFA] rounded-2xl p-5 items-center shadow-lg">
        {/* logo */}
        <View className="w-16 h-16 rounded-full bg-[#CDE3DE] items-center justify-center mb-4">
          <Image
            source={require('../assets/images/agos-logo.png')}
            style={{ width: 60, height: 60 }}
          >

          </Image>
        </View>

        <Text className="text-[11px] text-black text-center">AGOS</Text>
        <Text className="text-[15px] font-bold text-[#1565BC] text-center mt-0.5">
          Data Privacy Notice
        </Text>
        <Text className="text-[11px] text-[#122A48] text-center mt-0.5 mb-3">
          Please read and agree to the notice below before continuing.
        </Text>

        {/* scrollable notice */}
        <ScrollView
          className="w-full max-h-[280px] border border-[#C6C6C8] rounded-lg bg-[#CDE3DE1A] p-3.5"
          contentContainerClassName="gap-3 pb-7"
        >
          <Text className="text-[11.5px] leading-[17px] text-[#122A48] text-justify">
            This notice is issued in accordance with Republic Act No. 10173, the Data Privacy
            Act of 2012, and its general data privacy principles of transparency, legitimate
            purpose, and proportionality (Sec. 11).
          </Text>

          <View>
            <Text className="font-semibold text-[#122A48] text-xs mb-1">
              Information We Collect
            </Text>
            <Text className="text-[11.5px] leading-[17px] text-[#122A48] text-justify">
              As an authorized user of AGOS, we collect and process: your full name, email
              address, assigned role (Administrator, MENRO, MENRO Staff, or Barangay
              Personnel), login activity and timestamps, and IP address for account security
              and audit purposes.
            </Text>
          </View>

          <View>
            <Text className="font-semibold text-[#122A48] text-xs mb-1">
              Purpose of Collection
            </Text>
            <Text className="text-[11.5px] leading-[17px] text-[#122A48] text-justify">
              Your personal information is collected and processed solely for legitimate,
              declared purposes: authenticating your access to the system, maintaining
              accountability through system audit logs, sending account-related notices (e.g.,
              credential issuance, password resets), and enabling your assigned
              responsibilities within the platform. Your data will not be processed in ways
              incompatible with these stated purposes.
            </Text>
          </View>

          <View>
            <Text className="font-semibold text-[#122A48] text-xs mb-1">
              Your Rights as a Data Subject
            </Text>
            <Text className="text-[11.5px] leading-[17px] text-[#122A48] text-justify mb-1">
              Under Section 16 of the Data Privacy Act, you have the right to:
            </Text>
            <View className="gap-1">
              {RIGHTS.map((item, i) => (
                <View key={i} className="flex-row gap-1.5">
                  <Text className="text-[11.5px] leading-[17px] text-[#122A48]">{'\u2022'}</Text>
                  <Text className="flex-1 text-[11.5px] leading-[17px] text-[#122A48] text-justify">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View>
            <Text className="font-semibold text-[#122A48] text-xs mb-1">Security Measures</Text>
            <Text className="text-[11.5px] leading-[17px] text-[#122A48] text-justify">
              In line with Section 20 of the Act, AGOS implements reasonable organizational,
              physical, and technical safeguards to protect your personal information against
              accidental or unlawful destruction, alteration, disclosure, or unauthorized
              access.
            </Text>
          </View>

          <View>
            <Text className="font-semibold text-[#122A48] text-xs mb-1">Retention</Text>
            <Text className="text-[11.5px] leading-[17px] text-[#122A48] text-justify">
              Your information is retained only for as long as necessary to fulfill the
              purposes stated above, or as otherwise required for audit, legal, or compliance
              purposes.
            </Text>
          </View>
        </ScrollView>

        {/* agree checkbox */}
        <Pressable
          className="flex-row items-start gap-2.5 mt-3.5 w-full"
          onPress={() => setAgreed(v => !v)}
        >
          <View
            className={`w-[18px] h-[18px] rounded border-[1.5px] items-center justify-center mt-0.5 ${
              agreed ? 'bg-[#122A48] border-[#122A48]' : 'border-[#122A48]'
            }`}
          >
            {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text className="flex-1 text-[11.5px] leading-4 text-[#122A48]">
            I confirm that I have read and understood this notice, and I freely give my
            informed consent to the collection and processing of my personal information as
            described.
          </Text>
        </Pressable>

        <Pressable
          className={`w-full bg-[#122A48] rounded-lg py-3.5 items-center mt-4 ${
            !agreed || isLoading ? 'opacity-50' : ''
          }`}
          onPress={handleProceed}
          disabled={!agreed || isLoading}
        >
          {isLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white text-[15px] font-semibold">Proceeding...</Text>
            </View>
          ) : (
            <Text className="text-white text-[15px] font-semibold">Proceed</Text>
          )}
        </Pressable>
      </View>

      {/* error modal */}
      <Modal visible={errorModal.open} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center p-6">
          <View className="bg-white rounded-2xl p-6 items-center w-full max-w-[340px]">
            <Ionicons name="close-circle" size={40} color="#D81010" />
            <Text className="text-[17px] font-bold text-[#122A48] mt-2.5">
              Something Went Wrong
            </Text>
            <Text className="text-[13px] text-[#727272] text-center mt-1.5 mb-4">
              {errorModal.message}
            </Text>
            <Pressable
              className="bg-[#D81010] rounded-lg py-2.5 px-6"
              onPress={() => setErrorModal({ open: false, message: '' })}
            >
              <Text className="text-white font-semibold text-sm">Okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}