const express = require('express')
const app = express()

//body parser
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(express.urlencoded({extended : false}));

app.get('/', (res, req) => {
    req.send(`<body>
    <div id="body">
        <form action="/login" method="post">
            <div class="login-container">
                <div class="input-container">
                    <input type="text" name="id" id="input-id" placeholder="ID" maxlength="20">
                    <input type="text" name="pw" id="input-pw" placeholder="Password" maxlength="20">
                </div>
                <input type="submit" id="loginBtn" value="로그인">
            </div>
        </form>
    </body>`)
})

app.post('/login', (req, res) => {
    var body = req.body
    console.log('body : ', body)

    res.send("ID : " + body.id + " / PWD : " + body.pw)
})

app.post('/test', (res, req) => {
    console.log(req.body)
})

app.listen(5500, () => console.log('Start in 5500'))