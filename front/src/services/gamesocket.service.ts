import io from 'socket.io-client'
const socket = io('http://localhost:3000/game')
export default socket