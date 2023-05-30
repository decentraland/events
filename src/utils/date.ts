import Time from "decentraland-gatsby/dist/utils/date/Time"

export function formatDateRange(since: Date, until: Date) {
  const s = Time.utc(since)
  const u = Time.utc(until)
  const chunks = [s.format("MMM DD")]

  if (u.month() !== s.month() || u.day() !== u.day()) {
    chunks.push("-")
    chunks.push(u.format(u.month() !== s.month() ? "MMM DD" : "DD"))
  }

  return chunks.join(" ")
}
