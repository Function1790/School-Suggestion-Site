const express = require('express')
const app = express()
const mysql = require('mysql')

app.use('/static', express.static(__dirname + '/public'));

//body Parser
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }))

//Session
const session = require('express-session')
const Memorystore = require('memorystore')
const cookieParser = require("cookie-parser");

app.use(cookieParser('20103'))

app.use(session({
    secure: true,
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        Secure: true
    },
    name: 'data-session',
}))

const cookieConfig = {
    maxAge: 30000,
    path: '/',
    httpOnly: true,
    signed: true
}

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

function forcedMoveJS(url) {
    return `<script>window.location.href = "${url}"</script>`
}

function scriptHTML(code) {
    return `<script>${code}</script>`
}

function alertMoveHTML(alert_text, url) {
    return `<script>alert('${alert_text}');window.location.href = "${url}"</script>`
}

async function formatTemplate(req, template) {
    return template.replace('{{nav_holder}}', await TemplateNavbar(req))
}

async function TemplateNavbar(req) {
    let _template = await readFile(template_path + 'nav.html')
    if (req.session.isLogined) {
        return _template.replace("{{loginStatusText}}", `<a href="/logout">로그아웃</a>`)
    } else {
        return _template.replace("{{loginStatusText}}", `<a href="/login">로그인</a>`)
    }
}

async function TemplateSuggest(req, data) {
    return await formatTemplate(req, (await readFile(template_path + 'suggest.html')).replace("{{replace_holder}}", data))
}

async function TemplatePosts(req, data) {
    let date = new Date(data.created_date)
    const innerHTML = `<div class="post">
    <div class="title">${data.title}</div>
    <div class="created-time">${dtToString(date)}</div>
    <div class="content">${data.content}</div></div>`
    return await formatTemplate(req, (await readFile(template_path + 'posts.html')).replace("{{replace_holder}}", innerHTML))
}

async function TemplateLogin(req) {
    return await formatTemplate(req, await readFile(template_path + 'login.html'))
}

async function TemplateCafeteria(req, data) {
    let innerHTML = ""
    return await formatTemplate(req, (await readFile(template_path + 'cafeteria.html')).replace('{{replace_holder}}', innerHTML))
}

async function TemplateCreateSuggestion(req) {
    return await formatTemplate(req, await readFile(template_path + 'createSuggestion.html'))
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
    return dt.toISOString().replace('T', ' ').slice(0, -5)
}

const TIME_ZONE = 9 * 60 * 60 * 1000;

function timeNowStr() {
    return new Date((new Date().getTime()) + TIME_ZONE).toISOString().replace('T', ' ').slice(0, -5)
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
        res.send(await TemplateSuggest(req, _data))
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
            res.send(await TemplatePosts(req, {
                title: result[0].title,
                created_date: result[0].created_date,
                content: result[0].content
            }))
        })()
})

app.get('/login', (req, res) => {
    ; (async () => {
        res.send(await TemplateLogin(req))
    })()
})

app.post('/login-check', (req, res) => {
    var body = req.body;
    ; (async () => {
        const id = connection.escape(body.id)
        const pw = connection.escape(body.pw)

        const result = await sqlQuery(`SELECT * FROM user WHERE uid=${id} and upw=${pw}`)

        if (result.length == 0) {
            res.status(404).send('<title>서령건의</title><script>alert("존재하지 않는 아이디/비밀번호 입니다.");window.location.href = "/login"</script>')
            return
        }

        req.session.isLogined = true
        req.session.name = result[0].name
        req.session.school_num = result[0].school_num
        req.session.uid = result[0].uid
        req.session.save((err) => {
            if (err) {
                res.status(200).send(scriptHTML('alert("세션 저장 과정에서 오류가 발생하였습니다. 관리자에게 문의하세요.")') + forcedMoveJS('/login'))
                return
            }
        })
        res.cookie('session-cookie', `name=${result[0].name}`, cookieConfig)
        res.status(200).send(forcedMoveJS('/'))
    })()
})

app.get('/info', (req, res) => {
    const session = req.session
    if (!session.isLogined) {
        res.send(scriptHTML('alert("로그인 후 이용 가능합니다.")' + forcedMoveJS('/login')))
    }

})

app.get('/logout', (req, res) => {
    if (req.session.isLogined) {
        delete req.session.isLogined
        delete req.session.name
    }
    res.send(forcedMoveJS('/'))
})

app.get('/suggestion-create', async (req, res) => {
    const session = req.session
    if (!session.isLogined) {
        res.send(alertMoveHTML('이 콘텐츠를 로그인 후 이용가능합니다', '/login'))
        return
    }
    res.send(await TemplateCreateSuggestion(req))
})

app.post('/suggestion-create-post', async (req, res) => {
    const session = req.session
    if (!session.isLogined) {
        res.send(alertMoveHTML('이 콘텐츠를 로그인 후 이용가능합니다', '/login'))
        return
    }
    var body = req.body
    print(body)
    if (!body.title || !body.content) {
        res.send(alertMoveHTML("제목/내용을 입력해주세요", "/suggestion-create"))
        return
    }
    const _query = `insert into suggestion (title, content, uid, created_date) value ('${body.title}', '${body.content}', '${session.uid}', '${timeNowStr()}')
    `
    let result=await sqlQuery(_query)
    print(_query)
    res.send(forcedMoveJS('/suggestion'))
})

app.get('/', async (req, res) => {
    res.send(await TemplateCafeteria(req, 0))
})

app.listen(5500, () => console.log('Start in 5500'))