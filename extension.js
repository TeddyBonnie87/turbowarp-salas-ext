(function(Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        alert('Esta extensión necesita ejecutarse sin espacio aislado (unsandboxed) para conectar con WebSockets.');
        return;
    }

    class SalasExtension {
        constructor() {
            this.socket = null;
            this.currentRoom = '';
            this.cloudData = {};
            this.publicRooms = [];
        }

        getInfo() {
            return {
                id: 'salasextension',
                name: 'Salas y Servidores',
                color1: '#4C97FF',
                color2: '#3373CC',
                blocks: [
                    {
                        opcode: 'conectarServidor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'conectar al servidor [URL]',
                        arguments: {
                            URL: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'wss://turbowarp-salas-server.onrender.com'
                            }
                        }
                    },
                    {
                        opcode: 'unirseSala',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'unirse a sala código [CODIGO] con nombre [NOMBRE]',
                        arguments: {
                            CODIGO: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'sala123'
                            },
                            NOMBRE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Partida Pública'
                            }
                        }
                    },
                    {
                        opcode: 'setCloudVar',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'fijar variable en la nube [VAR] a [VALOR]',
                        arguments: {
                            VAR: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'puntuacion'
                            },
                            VALOR: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '0'
                            }
                        }
                    },
                    {
                        opcode: 'getCloudVar',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'valor de variable en la nube [VAR]',
                        arguments: {
                            VAR: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'puntuacion'
                            }
                        }
                    },
                    {
                        opcode: 'obtenerSalasPublicas',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'lista de salas públicas activas'
                    }
                ]
            };
        }

        conectarServidor(args) {
            const url = args.URL;
            if (this.socket) {
                this.socket.close();
            }

            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log('Conectado al servidor de salas.');
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'update_vars') {
                        this.cloudData = data.vars;
                    } else if (data.type === 'public_rooms_list') {
                        this.publicRooms = data.rooms;
                    }
                } catch (e) {
                    console.error('Error al procesar mensaje:', e);
                }
            };

            this.socket.onclose = () => {
                console.log('Desconectado del servidor.');
            };
        }

        unirseSala(args) {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
            this.currentRoom = args.CODIGO;
            this.socket.send(JSON.stringify({
                action: 'join_room',
                room: args.CODIGO,
                roomName: args.NOMBRE
            }));
        }

        setCloudVar(args) {
            if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
            this.cloudData[args.VAR] = args.VALOR;
            this.socket.send(JSON.stringify({
                action: 'update_var',
                room: this.currentRoom,
                varName: args.VAR,
                varValue: args.VALOR
            }));
        }

        getCloudVar(args) {
            return this.cloudData[args.VAR] || '';
        }

        obtenerSalasPublicas() {
            return JSON.stringify(this.publicRooms);
        }
    }

    Scratch.extensions.register(new SalasExtension());
})(Scratch);
                
