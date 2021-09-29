import io from 'socket.io-client'
import { SocketDataInterface } from '../../types/game.interface'

        
export default function gameSocket(store) {
    console.log('plugin loaded');
    const defaultSocket: any = io('http://localhost:3000/game');


    defaultSocket.on('actualizeSetupScreen', (obj: SocketDataInterface) => {
        store.commit('gameState/setGameRoom', obj.room)
        store.commit('gameState/displaySetupView', obj.room)
    });
        

}