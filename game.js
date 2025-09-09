const { v4: uuidv4 } = require('uuid');

module.exports = function(server) {

    const io = require('socket.io')(server, {
        transports: ['websocket']
    });
    //방정보 
    var rooms = []; //대기방 
    var socketRooms = new Map(); //진행 방

    io.on('connection', (socket) => {

        //서버 구현 
        console.log('A user connected:', socket.id);

        if(rooms.length >0) { //대기방 있는 상태 
            var roomId = rooms.shift();
            socket.join(roomId);
            socket.emit('joinRoom', { roomId: roomId }); 
            socket.to(roomId).emit('startGame', {roomId: roomId});
            socketRooms.set(socket.id, roomId);
        } else { //방이 없었다면. 대기방이 하나도 없다면 
            var roomId = uuidv4();
            socket.join(roomId);
            socket.emit('createRoom', { roomId: roomId});
            rooms.push(roomId); //push 는 값 넣기 shift 값 꺼내기
            socketRooms.set(socket.id, roomId);
        }
        // 특정 클라이언트가 방을 나갔을 때 처리  
        socket.on('leaveRoom', function(data) {
            var roomId = data.roomId;
            socket.leave(roomId);
            socket.emit('exitRoom');
            socket.to(roomId).emit('endGame');

            // 혼자 들어간 방에서 나갈 때 방 삭제
            const roomIndex = rooms.indexOf(roomId);
            if(roomIdx !== -1) {
                rooms.splice(roomIdx, 1);
                console.log('Room deleted:', roomId);
            }

            //방 나간 소켓 정보 삭제
            socketRooms.delete(socket.id);
        });

        //소켓(클라이언트) 특정 Block을 터치했을 때 처리
        socket.on('doPlayer', function(playerInfo) {
            var roomId = playerInfo.roomId;
            var blockIndex = playerInfo.blockIndex;

            console.log('Player action in room:', roomId, 'Block index', blockIndex);
            socket.to(roomId).emit('doOpponent', { blockIndex: blockIndex });
        });

        // socket.on('disconnect', function(reason) {
        //     console.log('Disconnected: ' + socket.id, 'Reason:' + reason);
        // });
        socket.on("disconnect", (reason) => {
            console.log('Disconnected: '+ socket.id + 'Reson:' + reason);
        });
    });
};