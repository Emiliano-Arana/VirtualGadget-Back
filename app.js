const express = require('express')
const mysql = require('mysql')
var app = express()
var bodyParser = require('body-parser')

var con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'Arm%2312%3927',
    database:'virtual_gadget'
})

con.connect();
app.use( express.json() )
app.use(express.urlencoded({
    extended:true
}))
app.use(express.static('public'))

app.get('/getEscenarioAl',(req,res) =>{

    con.query('SELECT * FROM productos',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        
        var fila=''
        console.log(respuesta)

        respuesta.forEach(product =>{
            fila += `<tr>
            <form method="get">
                <td><input value="${product.id}" class="id" name="id"></td>
                <td>${product.producto}</td>
                <td>${product.stock}</td>
                <td>$${product.precio}</td>
            </form>
        </tr>`
        })

        return res.send(
            //HTML
        )
    })
})

app.get('/getEscenarioListAl',(req,res) =>{

    con.query('SELECT * FROM productos',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        
        var fila=''
        console.log(respuesta)

        respuesta.forEach(product =>{
            fila += `<tr>
            <form method="get">
                <td><input value="${product.id}" class="id" name="id"></td>
                <td>${product.producto}</td>
                <td>${product.stock}</td>
                <td>$${product.precio}</td>
            </form>
        </tr>`
        })

        return res.send(
            //HTML
        )
    })
})

app.get('/getEscenarioListPr',(req,res) =>{

    con.query('SELECT * FROM productos',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        
        var fila=''
        console.log(respuesta)

        respuesta.forEach(product =>{
            fila += `<tr>
            <form method="get">
                <td><input value="${product.id}" class="id" name="id"></td>
                <td>${product.producto}</td>
                <td>${product.stock}</td>
                <td>$${product.precio}</td>
            </form>
        </tr>`
        })

        return res.send(
            //HTML
        )
    })
})

app.post('/deleteEscenario',(req,res) =>{
    let id = req.body.id

    con.query('DELETE FROM productos WHERE id = '+id,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

        return res.send(
            //HTML
        )
    })
})

app.post('/addEscenario',(req,res) =>{
    let nombre = req.body.nombre
    let desc = req.body.descripcion
    let desde = req.body.desde
    let hacia = req.body.hacia
    let tipo = req.body.tipoF
    let texto = req.body.texto
    let x = req.body.posx
    let y = req.body.posy
    let ids = req.body.ids

    let arrDesde = desde.split(";")
    let arrHacia = hacia.split(";")
    let arrTipo = tipo.split(";")
    let arrTexto = texto.split(";")
    let arrX = x.split(";")
    let arrY = y.split(";")
    let arrIds = ids.split(";")

    let idElm = 0
    let idEsc = 0

    con.query('INSERT INTO escenariosprofesores(id_usuario,tipo) values(1,"'+nombre+'")',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
    })
    con.query('SELECT id_escenario FROM escenariosprofesores',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        console.log(respuesta.id_escenario)
        respuesta.forEach(maxim =>{
            idEsc = maxim.id_escenario;
            console.log(idEsc)
        })
    })
    //
    console.log(idEsc)
    for(let i=0;i<arrX.length;i++){
        con.query('INSERT INTO elementos(id_escenario,descripcion,ubicacion_x,ubicacion_y,forma) values('+idEsc+',"'+arrTexto[i]+'",'+arrX[i]+','+arrY[i]+',"'+arrTipo[i]+'")',(err,respuesta,fields)=>{
            if(err)return console.log('ERROR',err);
    
        })
        con.query('SELECT * FROM elementos',(err,respuesta,fields)=>{
            if(err)return console.log('ERROR',err);
            
            respuesta.forEach(maxim =>{
                idElm = `${maxim.id_escenario}`
                idElm = parseInt(idEsc, 10);
            })
        })
        arrIds[i] = idElm
    }
    for(let i=0;i<arrDesde.length;i++){
        con.query('INSERT INTO relaciones(desde,hasta) values('+arrIds[arrDesde[i]]+','+arrIds[arrHacia[i]]+')',(err,respuesta,fields)=>{
            if(err)return console.log('ERROR',err);
    
        })
    }
    return res.send(`
        <p>a</p>    
    `)
})


app.listen(8080,()=>{
    console.log('Servidor escuchando en el puerto 8080')
})