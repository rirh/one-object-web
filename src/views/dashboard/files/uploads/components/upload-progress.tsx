import { useObjectTranslation } from "@/local/object"
import { Progress } from "@/components/ui/progress"
import styles from "./upload-progress.module.css"

export function UploadProgress({
  value,
  active,
  label,
}: {
  value: number
  active: boolean
  label: string
}) {
  const tx = useObjectTranslation()

  return (
    <div className="relative overflow-hidden rounded-full">
      <Progress
        value={value}
        aria-label={tx("上传进度")}
        aria-valuetext={`${value}%，${label}`}
        className="h-1.5 [&_[data-slot=progress-indicator]]:transition-transform [&_[data-slot=progress-indicator]]:duration-300 [&_[data-slot=progress-indicator]]:ease-out motion-reduce:[&_[data-slot=progress-indicator]]:transition-none"
      />
      {active && <span aria-hidden="true" className={styles.shine} />}
    </div>
  )
}
