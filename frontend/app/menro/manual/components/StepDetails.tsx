import PreviousNextButtons from "./PreviousNextButtons"

interface StepDetailProps {
  stepIndex: number
  totalSteps: number
  title: string
  description: string
  whyItMatters: string
  extraSections?: { label?: string; description: string }[]
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}

export default function StepDetail({
  stepIndex,
  totalSteps,
  title,
  description,
  whyItMatters,
  extraSections,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: StepDetailProps) {
  return (
    <div className="flex-1 min-h-0 max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-green-700 font-small">
          Step {stepIndex + 1} of {totalSteps}
        </span>
        <PreviousNextButtons
          onPrevious={onPrevious}
          onNext={onNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
      </div>

          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-1 mb-4 whitespace-pre-line">{description}</p>

      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-400 text-sm mb-5">
        Screenshot placeholder
      </div>

      {extraSections?.map((section, i) => (
        <div key={i}>
          {section.label && (
            <h2 className="text-sm font-semibold text-gray-900">{section.label}</h2>
          )}
          <p className="text-xs text-gray-500 mt-1 mb-4 whitespace-pre-line">
            {section.description}
          </p>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-400 text-sm mb-5">
            Screenshot placeholder
          </div>
        </div>
      ))}

      <h3 className="text-sm font-semibold text-gray-900 mb-1">Why is this important?</h3>
      <p className="text-xs text-gray-500 mb-4">{whyItMatters}</p>

      
    </div>
  )
}