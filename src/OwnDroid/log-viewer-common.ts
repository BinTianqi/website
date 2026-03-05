export interface Log {
    id: number
    time: number

    tag: number
    level: number
    data: { [key: string]: string | number }

    package: string
    type: string
    host: string
    count: number
    addresses: string[]
    address: string
    port: number
}
