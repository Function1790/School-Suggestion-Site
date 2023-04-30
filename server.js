const express = require('express')
const app = express()
const mysql = require('mysql')

//File
const fs = require('fs')

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

async function formNavbarHTML() {
    return await readFile('./nav.html')
}
async function formSuggestHTML(data) {
    return (await readFile('./suggest.html')).replace("{{replace_holder}}", data).replace('{{nav_holder}}', await formNavbarHTML())
}

async function formPostHTML(data) {
    let date = new Date(data.created_date)
    const innerHTML = `<div class="post">
    <div class="title">${data.title}</div>
    <div class="created-time">${dtToString(date)}</div>
    <div class="content">${data.content}</div></div>`
    return (await readFile('./posts.html')).replace("{{replace_holder}}", innerHTML).replace('{{nav_holder}}', await formNavbarHTML())
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

app.get("/suggestion", (res, req) => {
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
        req.send(await formSuggestHTML(_data))
    })()
})

app.get('/suggestion/:id', (res, req) => {
    const post_id = res.params.id
        ; (async () => {
            const result = await sqlQuery(`SELECT * FROM suggestion WHERE id=${post_id}`)
            try {
                if (result.length == 0) {
                    req.status(404).send("해당 게시물이 존재하지 않습니다.")
                    return
                }
            } catch {
                req.status(404).send("해당 게시물이 존재하지 않습니다.")
                return
            }
            req.send(await formPostHTML({
                title: result[0].title,
                created_date: result[0].created_date,
                content: result[0].content
            }))
        })()
})

app.listen(5500, () => console.log('Start in 5500'))