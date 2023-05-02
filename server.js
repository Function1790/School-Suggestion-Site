const express = require('express')
const app = express()
const mysql = require('mysql')

//body Parser
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))

//Session
const session = require('express-session')
const Memorystore = require('memorystore')

app.use(session({
    secure: true,
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        Secure: true
    },
    name: 'session-cookie'
}))

//File
const fs = require('fs')
const template_path = './template/'

async function readFile(path) {
    return await new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                console.error(err)
                return
            }
            resolve(data)
        })
    })
}
//

const print = (value) => { console.log(value) }

function forcedMoveJS(url){
    return `<script>window.location.href = "${url}"</script>`
}

function scriptHTML(code){
    return `<script>${code}</script>`
}

async function formatTemplate(template) {
    return template.replace('{{nav_holder}}', await TemplateNavbar())
}

async function TemplateNavbar() {
    return await readFile(template_path + 'nav.html')
}

async function TemplateSuggest(data) {
    return await formatTemplate((await readFile(template_path + 'suggest.html')).replace("{{replace_holder}}", data))
}

async function TemplatePosts(data) {
    let date = new Date(data.created_date)
    const innerHTML = `<div class="post">
    <div class="title">${data.title}</div>
    <div class="created-time">${dtToString(date)}</div>
    <div class="content">${data.content}</div></div>`
    return await formatTemplate((await readFile(template_path + 'posts.html')).replace("{{replace_holder}}", innerHTML))
}

async function TemplateLogin() {
    return await formatTemplate(await readFile(template_path + 'login.html'))
}


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: ''
})

connection.connect();

async function sqlQuery(query) {
    let promise = new Promise((resolve, reject) => {
        const rows = connection.query(query, (error, rows, fields) => {
            resolve(rows)
        })
    })
    let result = await promise
    return result
}

function dtToString(dt) {
    return dt.toLocaleDateString() + '\t' + dt.getHours() + ':' + dt.getMinutes() + ':' + dt.getSeconds()
}

app.get("/suggestion", (req, res) => {
    ; (async () => {
        let _data = ""
        const result = await sqlQuery('select * from suggestion')
        for (var i = 0; i < result.length; i++) {
            const date = new Date(result[i].created_date)

            _data += `<div class="content-item">
            <div class="content-title">
                <a href='/suggestion/${result[i].id}'>${result[i].title}</a>
            </div>
            <div class="content-date">${dtToString(date)}</div>
        </div>`
        }
        print(req.session.name)
        res.send(await TemplateSuggest(_data))
    })()
})

app.get('/suggestion/:id', (req, res) => {
    const post_id = req.params.id
        ; (async () => {
            const result = await sqlQuery(`SELECT * FROM suggestion WHERE id=${post_id}`)
            try {
                if (result.length == 0) {
                    res.status(404).send("해당 게시물이 존재하지 않습니다.")
                    return
                }
            } catch {
                res.status(404).send("해당 게시물이 존재하지 않습니다.")
                return
            }
            res.send(await TemplatePosts({
                title: result[0].title,
                created_date: result[0].created_date,
                content: result[0].content
            }))
        })()
})

app.get('/login', (req, res) => {
    ; (async () => {
        res.send(await TemplateLogin())
    })()
})

app.post('/login-check', (req, res) => {
    var body = req.body;
    ; (async () => {
        const id = connection.escape(body.id)
        const pw = connection.escape(body.pw)

        const result = await sqlQuery(`SELECT * FROM user WHERE id=${id} and pw=${pw}`)

        if (result.length == 0) {
            res.status(404).send('<script>alert("존재하지 않는 아이디/비밀번호 입니다.");window.location.href = "/login"</script>')
            return
        }

        req.session.isLogined = true
        req.session.name = result[0].name
        req.session.school_num = result[0].school_num
        req.session.save((err)=> {
            if(err){
                res.status(200).send(scriptHTML('alert("세션 저장 과정에서 오류가 발생하였습니다. 관리자에게 문의하세요.")')+forcedMoveJS('/login'))
                return
            }
        })
        res.status(200).send(forcedMoveJS('/suggestion'))
    })()
})

app.listen(5500, () => console.log('Start in 5500'))