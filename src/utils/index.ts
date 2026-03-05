import dayjs from "dayjs"

export function esc(str: string) {
    return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function formateTimestamp(timestamp: number) {
    return dayjs(timestamp).format("YYYY/MM/DD HH:mm:ss")
}

export function compareArrays(array1: any[], array2: any[]) {
    if (array1.length != array2.length) return false
    return array1.every((value, index) => array2[index] == value)
}
