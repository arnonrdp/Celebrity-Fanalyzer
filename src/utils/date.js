import { Timestamp } from 'firebase/firestore'

const ONE_DAY_IN_SECONDS = 86400
const ONE_WEEK_IN_SECONDS = 604800

export function formatMonthYear(date) {
  const [year, month] = date?.split('-')
  // Change 'short' to 'long'
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' })
  // August 2030
  return `${monthName} ${year}`
}

export function monthDay(date) {
  const seconds = date.split('T')[1]
  const dateObj = new Date(seconds * 1000)
  // Dec 10
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function shortMonthDayTime(timestamp) {
  const date = timestamp ? new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000) : new Date()
  // Dec 10 - 14:18
  return date
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: false })
    .split(', ')
    .join(' - ')
}

export function dayMonthYear(timestamp) {
  const date = timestamp ? new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000) : new Date()
  // 10 Dec, 2022
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function monthDayYear(timestamp) {
  const date = timestamp ? new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000) : new Date()
  // 12/10/2022
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
}
export function currentYearMonth() {
  // 2022-11
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }).split('/').reverse().join('-')
}

export function previousYearMonth() {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  // 2022-10
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }).split('/').reverse().join('-')
}

export function startEndDay(timeStamp) {
  return {
    start: new Timestamp(timeStamp.seconds - (timeStamp.seconds % ONE_DAY_IN_SECONDS), 0),
    end: new Timestamp(timeStamp.seconds - (timeStamp.seconds % ONE_DAY_IN_SECONDS) + ONE_DAY_IN_SECONDS, 0)
  }
}

export function nextWeekDate(timeStamp) {
  return new Timestamp(timeStamp.seconds - (timeStamp.seconds % ONE_DAY_IN_SECONDS) + ONE_WEEK_IN_SECONDS, 0)
}

/**
 * Return A list of dates between the beginning of the startDate
 * and the midnight of the endDate
 *
 * @param startDate
 * @param endDate
 * @returns {Array<Timestamp>}
 */
export function calendarDay(startDate, endDate) {
  const calendar = []
  for (
    let currentDate = startEndDay(startDate).start;
    currentDate.seconds < endDate.seconds + ONE_DAY_IN_SECONDS;
    currentDate = startEndDay(currentDate).end
  ) {
    calendar.push(currentDate)
  }
  return calendar
}

/**
 * Return A list of dates between the beginning of the startDate
 * and the midnight of the endDate
 * The period between two dates is one week, except for the last one which may be less.
 *
 * @param startDate
 * @param endDate
 * @returns {*[]}
 */
export function calendarWeek(startDate, endDate) {
  const calendar = []
  const dayStart = startEndDay(startDate).start
  for (let currentDate = dayStart; currentDate.seconds < startEndDay(endDate).end.seconds; currentDate = nextWeekDate(currentDate)) {
    calendar.push(currentDate)
  }
  calendar.push(startEndDay(endDate).end)
  return calendar
}

export const getStats = (reacts, startAt) => {
  const endAt = Timestamp.now()
  if (endAt - startAt > ONE_DAY_IN_SECONDS * 31) {
    endAt.seconds = startAt.seconds + ONE_DAY_IN_SECONDS * 31
  }

  const getLikesAndDislikesCount = (elements, start, end) => {
    return elements.filter((element) => {
      return element.createdAt >= start && element.createdAt < end
    }).length
  }

  const getStatsForPeriod = (period) => {
    return period.map((item, index) => {
      const likesCount = getLikesAndDislikesCount(reacts._likes, period[index], period[index + 1])
      const dislikesCount = getLikesAndDislikesCount(reacts._dislikes, period[index], period[index + 1])
      return { date: item, likes: likesCount, dislikes: dislikesCount }
    })
  }

  const weekStats = getStatsForPeriod(calendarWeek(startAt, endAt))
  const dayStats = getStatsForPeriod(calendarDay(startAt, endAt))

  return { weekStats, dayStats }
}
export function calculateEndDate(publishDate, duration) {
  const publishDayObj = new Date(publishDate)
  const endDate = new Date(publishDayObj.getTime() + duration * 24 * 60 * 60 * 1000)
  return endDate.toISOString().slice(0, 10).replaceAll('-', '/')
}

export function getCurrentDate() {
  const currentDate = new Date()
  let month = currentDate.getMonth() + 1
  if (month < 10) {
    month = '0' + month
  }
  let day = currentDate.getDate()
  if (day < 10) {
    day = '0' + day
  }
  return `${currentDate.getFullYear()}/${month}/${day}`
}

export function computedDuration(endDate) {
  const date1 = new Date()
  const date2 = new Date(endDate)
  date1.setHours(0, 0, 0, 0)
  date2.setHours(0, 0, 0, 0)
  const Difference_In_Time = date2.getTime() - date1.getTime()
  return Math.round(Difference_In_Time / (1000 * 3600 * 24))
}
