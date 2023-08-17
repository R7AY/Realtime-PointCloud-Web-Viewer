const dgram = require('dgram')

const server = dgram.createSocket('udp4')

server.on('listening', () => {
    const address = server.address()
    console.log(`server running ${address.address}:${address.port}`)
})

server.on('message', (msg, remoteInfo) => {
    console.log(`server got ${msg} from ${remoteInfo.address}:${remoteInfo.port}`)
    server.send('world', remoteInfo.port, remoteInfo.address)
})

server.on('error', err => {
    console.log('server error', err)
})

server.bind(3000)
