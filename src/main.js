// Template engine : Pug
// CSS framework : TailwindCSS

const Koa = require('koa')
const Pug = require('koa-pug')
const path = require('path')
const websockify = require('koa-websocket')
const route = require('koa-route')
const serve = require('koa-static')
const mount = require('koa-mount')
const {
  stringify
} = require('querystring')
const mongoClient = require('./mongo')

const app = websockify(new Koa());

new Pug({
  viewPath: path.resolve(__dirname, './views'),
  app,
})

app.use(mount('/public', serve('src/public')))

app.use(async (ctx) => {
  // render 될 파일명
  await ctx.render('main')
})

const _client = mongoClient.connect()

async function getChatsCollection() {
  const client = await _client
  return client.db('chat').collection('chats')
}

// Using routes
app.ws.use(route.all('/ws', async (ctx) => {

  const chatsCollection = await getChatsCollection()
  const chatsCousor = chatsCollection.find({}, {
    sort:{
      createdAt: 1,
    },
  })

  const chats = await chatsCousor.toArray()
  ctx.websocket.send(JSON.stringify({
    type:'sync',
    payload: {
      chats,
    },
  }))


  // `ctx` is the regular koa context created from the `ws` onConnection `socket.upgradeReq` object.
  // the websocket is added to the context on `ctx.websocket`.
  ctx.websocket.on('message', async (data) => {
    // do something with the message from client

    /**
     * @type { Chat}
     */
    const chat = JSON.parse(data)
    await chatsCollection.insertOne({
      ...chat,
      createdAt : new Date(),

    })

    const {
      nickname,
      message
    } = chat

    const {
      server
    } = app.ws

    if (!server) {
      return
    }

    server.clients.forEach(client => {
      client.send(JSON.stringify({
        type:'chat',
        payload:{
          message,
          nickname,
        }
      }))
    })

  });
}));

app.listen(5000)