var amqp = require('amqplib/callback_api');
let chats = require('../model/chat');
let {user} = require('../models');

const sQueue = 'spellQueue';
const rQueue = 'chatQueue';

let wSocket = require('./socket');

module.exports = {
    checkSpell: async (userID, chatID, roomChatID) => {

        let chat = await chats.findById(chatID);

        let msg = {
            context: chat.origin_context,
            reqId: chatID,
            userId: userID
        };

        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }

                channel.assertQueue(sQueue, {
                    durable: false
                });

                channel.sendToQueue(sQueue, Buffer.from(JSON.stringify(msg)), {
                    replyTo: rQueue
                });
                console.log(" [x] Sent %s", msg);
                setTimeout(function () {
                    connection.close();
                }, 500);
            });
        });
    },
    recvFormQueue: () => {
        console.log('START RECV FROM RABBITMQ!!')
        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }

                channel.assertQueue(rQueue, {
                    durable: false
                });

                channel.consume(rQueue, async function (msg) {
                    let result = JSON.parse(JSON.parse(msg.content));

                    let chat = await chats.findById(result.requestId);


                    // console.log(chat.room);
                    let userRecord = await user.findByPk(result.userId);
                    userRecord.score += 1 - result.errors;
                    if (userRecord.score < 0) userRecord.score = 950;
                    else if (userRecord.score > 1999) userRecord.score = 1050;
                    userRecord.save();

                    if (result.errors != 0) {
                        chat.check_context = result.correct;
                        chat.status = 0;

                    } else {
                        chat.status = 1;
                    }

                    chat.save()
                        .then((afterCheck) => {
                            console.log("spell check 완료");

                        })
                        .catch((err) => {
                            console.log("spell check 실패 :", err);
                        });
                    console.log('send pub!!');
                    let reply = JSON.stringify({
                        method: 'message',
                        sendType: 'sendToAllClientsInRoom',
                        content: {
                            method: 'checked msg',
                            s_time: chat.stime,
                            chatCheck: result.correct,
                            chatStatus: chat.status,
                            room: chat.room
                        }
                    });
                    wSocket.publish(reply);

                }, {
                    noAck: true
                });
            });
        });
    }
}