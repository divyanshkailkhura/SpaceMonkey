export function getInitials(name: string | null) {
  if (!name) return "??"
  return name.substring(0, 2).toUpperCase()
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export const CATEGORY_OPTIONS = [
  { value: "OBSERVATION", label: "Observation" },
  { value: "ASTROPHOTOGRAPHY", label: "Astrophotography" },
  { value: "QUESTION", label: "Question" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
]
