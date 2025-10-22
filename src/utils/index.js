import dayjs from "dayjs"

export function esc(str) {
    return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function formateTimestamp(timestamp) {
    return dayjs(timestamp).format("YYYY/MM/DD HH:mm:ss")
}
