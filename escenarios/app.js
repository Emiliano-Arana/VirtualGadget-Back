const express = require('express')
const mysql = require('mysql')
var app = express()
var bodyParser = require('body-parser')

var con = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'mane',
    database:'virtualgadget'
})

con.connect();
app.use( express.json() )
app.use(express.urlencoded({
    extended:true
}))
app.use(express.static('public'))

app.get('/getEscenarioAl',(req,res) =>{
    let id = req.query.id;
    let idsEl = []

    con.query('SELECT * FROM escenariosprofesores WHERE id_escenario = '+id,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

        let nom = respuesta.tipo
        let desc 

        con.query('SELECT * FROM elementos WHERE id_escenario = '+id,(err,respuesta,fields)=>{
            if(err)return console.log('ERROR',err);

            var fila=''
            console.log(respuesta)

            respuesta.forEach(obj =>{
                idsEl.push({
                    idE:obj.id_elemento
                })
                fila += `
                casillas.push({
                    x:${obj.ubicacion_x},y:${obj.ubicacion_y},
                    height:80,
                    width:120,
                    tipo:'${obj.forma}',
                    texto:'${obj.descripcion}'
                });
            
                objetos.push({
                    x:100,y:100,
                    height:80,
                    width:120,
                    tipo:'${obj.forma}',
                    texto:'${obj.descripcion}'
                });
                `
            })

            let txtQuery = ''

            for(let i=0;i<idsEl.length;i++){
                txtQuery += ' desde = '+idsEl[i].idE+' or hasta = '+idsEl[i].idE
                if(i<(idsEl.length-1)){
                    txtQuery += ' or'
                }
            }


            con.query('SELECT * FROM relaciones WHERE'+txtQuery,(err,respuesta,fields)=>{
                if(err)return console.log('ERROR',err);

                let des,has,d,h;
                var filaF=''

                respuesta.forEach(obj =>{
                    des = obj.desde
                    has = obj.hasta
                    
                    for(let i=0;i<idsEl.length;i++){
                        if(des == idsEl[i].idE){
                            d = i
                        }
                        if(has == idsEl[i].idE){
                            h = i
                        }
                    }

                    filaF += `
                    flechas.push({
                        desde: ${d},
                        hasta: ${h}
                    });
                    `
                })

                fila += filaF
                

        return res.send(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="stylesheet" href="css/diagPStyle.css">
              <title>Crear Escenario</title>
            </head>
            <body>
              <div class="interact-container">
                <div class="left-side">
                  <p>nombre</p>
                  <p>descripcion</p>
                  <form action="/califEscAl" method="post">
                    <input type="text" id="calif" name="calif" style="display: none;">
                    <input type="text" id="idE" name="idE" style="display: none;" value="${id}">
                    <button type="submit" onclick="comprobarResultados()">Calificar</button>
                  </form>
                </div>
                <canvas width="1200" height="800" id="lienzo"></canvas>
              </div>
              <script>
                var cv, cx, objetos,casillas,flecha = false, objetoActual = null,elem1=-1,elem2=-1,flechas,valorFle='',respuestasC;
                var inicioX = 0, inicioY = 0;
                objetos = [];
                flechas = [];
                casillas = [];
            
                function actualizar() {
                  cx.fillStyle = '#f0f0f0';
                  cx.fillRect(0, 0, 1200, 800);
                  cx.font = "12px sans-serif";
                  cx.fillStyle="black";

                  for (var i = 0; i < flechas.length; i++) {
                    if(casillas[flechas[i].desde].tipo=='proceso'){
                      cx.beginPath();
                      cx.moveTo(casillas[flechas[i].desde].x+(casillas[flechas[i].desde].width/2), casillas[flechas[i].desde].y+objetos[flechas[i].desde].height);
                    }else if(casillas[flechas[i].desde].tipo=='limites'){
                      cx.beginPath();
                      cx.moveTo(casillas[flechas[i].desde].x, casillas[flechas[i].desde].y+(casillas[flechas[i].desde].width/2));
                    }else if(casillas[flechas[i].desde].tipo=='decision'){
                        cx.beginPath();
                        cx.moveTo(casillas[flechas[i].desde].x, casillas[flechas[i].desde].y+casillas[flechas[i].desde].height);
                        cx.fillText('Si',casillas[flechas[i].desde].x+10,casillas[flechas[i].desde].y+casillas[flechas[i].desde].height+10);
                    }else if(casillas[flechas[i].desde].tipo=='entradaSalida'){
                      cx.beginPath();
                      cx.moveTo(casillas[flechas[i].desde].x-20+(casillas[flechas[i].desde].width/2), casillas[flechas[i].desde].y+casillas[flechas[i].desde].height);
                    }
            
                    if(casillas[flechas[i].hasta].tipo=='proceso'){
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2), casillas[flechas[i].hasta].y);
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2)+5, casillas[flechas[i].hasta].y-5);
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2)-5, casillas[flechas[i].hasta].y-5);
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2), casillas[flechas[i].hasta].y);
                      cx.closePath();
                      cx.stroke();
                    }else if(casillas[flechas[i].hasta].tipo=='limites'){
                      cx.lineTo(casillas[flechas[i].hasta].x, casillas[flechas[i].hasta].y-(casillas[flechas[i].hasta].width/2));
                      cx.lineTo(casillas[flechas[i].hasta].x+5, casillas[flechas[i].hasta].y-(casillas[flechas[i].hasta].width/2)-5);
                      cx.lineTo(casillas[flechas[i].hasta].x-5, casillas[flechas[i].hasta].y-(casillas[flechas[i].hasta].width/2)-5);
                      cx.lineTo(casillas[flechas[i].hasta].x, casillas[flechas[i].hasta].y-(casillas[flechas[i].hasta].width/2));
                      cx.closePath();
                      cx.stroke();
                    }else if(casillas[flechas[i].hasta].tipo=='decision'){
                      cx.lineTo(casillas[flechas[i].hasta].x, casillas[flechas[i].hasta].y);
                      cx.lineTo(casillas[flechas[i].hasta].x+5, casillas[flechas[i].hasta].y-5);
                      cx.lineTo(casillas[flechas[i].hasta].x-5, casillas[flechas[i].hasta].y-5);
                      cx.lineTo(casillas[flechas[i].hasta].x, casillas[flechas[i].hasta].y);
                      cx.closePath();
                      cx.stroke();
                    }else if(casillas[flechas[i].hasta].tipo=='entradaSalida'){
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2), casillas[flechas[i].hasta].y);
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2)+5, casillas[flechas[i].hasta].y-5);
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2)-5, casillas[flechas[i].hasta].y-5);
                      cx.lineTo(casillas[flechas[i].hasta].x+(casillas[flechas[i].desde].width/2), casillas[flechas[i].hasta].y);
                      cx.closePath();
                      cx.stroke();
                    }
                  }

                  for (var i = 0; i < objetos.length; i++) {
                    if(objetos[i].tipo=='proceso'){
                      cx.beginPath();
                      cx.strokeRect(objetos[i].x, objetos[i].y, objetos[i].width, objetos[i].height);
                      cx.fillText(objetos[i].texto,objetos[i].x+10,objetos[i].y+(objetos[i].height/2));
                      cx.closePath();
                    }else if(objetos[i].tipo=='limites'){
                      cx.beginPath();
                      cx.arc(objetos[i].x, objetos[i].y, objetos[i].width/2, 0, Math.PI*2, false);
                      cx.fillText(objetos[i].texto,objetos[i].x-(objetos[i].width/2)+40,objetos[i].y);
                      cx.stroke();
                      cx.closePath();
                    }else if(objetos[i].tipo=='decision'){
                      cx.beginPath();
                      cx.moveTo(objetos[i].x, objetos[i].y);
                      cx.lineTo((objetos[i].width/2)+objetos[i].x, objetos[i].y+(objetos[i].height/2));
                      cx.lineTo(objetos[i].x, objetos[i].y+objetos[i].height);
                      cx.lineTo(objetos[i].x-(objetos[i].width/2), objetos[i].y+(objetos[i].height/2));
                      cx.fillText(objetos[i].texto,objetos[i].x-(objetos[i].width/2)+10,objetos[i].y+(objetos[i].height/2)+5);
                      cx.closePath();
                      cx.stroke();
                    }else if(objetos[i].tipo=='entradaSalida'){
                      cx.beginPath();
                      cx.moveTo(objetos[i].x, objetos[i].y);
                      cx.lineTo(objetos[i].x+objetos[i].width, objetos[i].y);
                      cx.lineTo(objetos[i].x+objetos[i].width-20, objetos[i].y+objetos[i].height);
                      cx.lineTo(objetos[i].x-20, objetos[i].y+objetos[i].height);
                      cx.fillText(objetos[i].texto,objetos[i].x,objetos[i].y+(objetos[i].height/2));
                      cx.closePath();
                      cx.stroke();
                    }
                  }
                }
            
                function iman(){
                  for(var i=0;i<casillas.length;i++){
                      if(objetoActual.tipo=='proceso'){
                        if(casillas[i].tipo=='proceso'){
                          if(Math.abs(objetoActual.x-casillas[i].x)<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x;
                            objetoActual.y = casillas[i].y;
                          }
                        }else if(casillas[i].tipo=='decision'){
                          if(Math.abs(objetoActual.x-casillas[i].x+(casillas[i].width/2))<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x-(casillas[i].width/2);
                            objetoActual.y = casillas[i].y;
                          }
                        }else if(casillas[i].tipo=='entradaSalida'){
                          if(Math.abs(objetoActual.x-casillas[i].x+20)<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x-20;
                            objetoActual.y = casillas[i].y;
                          }
                        }
                      }else if(objetoActual.tipo=='decision'){
                        if(casillas[i].tipo=='proceso'){
                          if(Math.abs(objetoActual.x-casillas[i].x-(casillas[i].width/2))<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x+(casillas[i].width/2);
                            objetoActual.y = casillas[i].y;
                          }
                        }else if(casillas[i].tipo=='decision'){
                          if(Math.abs(objetoActual.x-casillas[i].x)<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x;
                            objetoActual.y = casillas[i].y;
                          }
                        }else if(casillas[i].tipo=='entradaSalida'){
                          if(Math.abs(objetoActual.x-casillas[i].x-(casillas[i].width/2))<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x+(casillas[i].width/2);
                            objetoActual.y = casillas[i].y;
                          }
                        }
                      }else if(objetoActual.tipo=='entradaSalida'){
                        if(casillas[i].tipo=='proceso'){
                          if(Math.abs(objetoActual.x-casillas[i].x-20)<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x+20;
                            objetoActual.y = casillas[i].y;
                          }
                        }else if(casillas[i].tipo=='decision'){
                          if(Math.abs(objetoActual.x-casillas[i].x+(casillas[i].width/2)-20)<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x-(casillas[i].width/2)+20;
                            objetoActual.y = casillas[i].y;
                          }
                        }else if(casillas[i].tipo=='entradaSalida'){
                          if(Math.abs(objetoActual.x-casillas[i].x)<15 && Math.abs(objetoActual.y-casillas[i].y)<15){
                            objetoActual.x = casillas[i].x;
                            objetoActual.y = casillas[i].y;
                          }
                        }
                      }
                  }
                }
            
                function comprobarResultados(){
                  respuestasC = new Array(casillas.length);
                  for(var i = 0; i < respuestasC.length; i++){
                    respuestasC[i] = false;
                  }
                  for (var i = 0; i < casillas.length; i++) {
                    for (var j = 0; j < objetos.length; j++) {
                      if((casillas[i].x==objetos[j].x)&&(casillas[i].y==objetos[j].y)&&(casillas[i].texto==objetos[j].texto)&&(casillas[i].tipo==objetos[i].tipo)){
                        respuestasC[i] = true;
                      }
                    }
                  }
                  let prom,cont=0;
                  for(var i = 0; i < respuestasC.length; i++){
                    if(respuestasC[i]){
                        cont += 10;
                    }
                  }
                  prom = Math.floor(cont/respuestasC.length);
                  document.getElementById('calif').value = prom;
                }
            
                window.onload = function() {
                  cv = document.getElementById('lienzo');
                  cx = cv.getContext('2d');

                  ${fila}

                  cv.onmousedown = function(event) {
                      for (var i = 0; i < objetos.length; i++) {
                        if(objetos[i].tipo=='proceso'){
                          if (objetos[i].x < event.clientX
                            && (objetos[i].width + objetos[i].x > event.clientX)
                            && objetos[i].y < event.clientY
                            && (objetos[i].height + objetos[i].y > event.clientY)
                          ) {
                            objetoActual = objetos[i];
                            inicioY = event.clientY - objetos[i].y;
                            inicioX = event.clientX - objetos[i].x;
                            break;
                          }
                        }else if(objetos[i].tipo=='limites'){
                          if (objetos[i].x-(objetos[i].width/2) < event.clientX
                            && (objetos[i].x + (objetos[i].width/2) > event.clientX)
                            && objetos[i].y-(objetos[i].width/2) < event.clientY
                            && ((objetos[i].width/2) + objetos[i].y > event.clientY)
                          ) {
                            objetoActual = objetos[i];
                            inicioY = event.clientY - objetos[i].y;
                            inicioX = event.clientX - objetos[i].x;
                            break;
                          }
                        }else if(objetos[i].tipo=='decision'){
                          if ((objetos[i].x-(objetos[i].width/2)) < event.clientX
                            && ((objetos[i].width/2) + objetos[i].x > event.clientX)
                            && objetos[i].y < event.clientY
                            && (objetos[i].height + objetos[i].y > event.clientY)
                          ) {
                            objetoActual = objetos[i];
                            inicioY = event.clientY - objetos[i].y;
                            inicioX = event.clientX - objetos[i].x;
                            break;
                          }
                        }else if(objetos[i].tipo=='entradaSalida'){
                          if ((objetos[i].x-20) < event.clientX
                            && (objetos[i].width + objetos[i].x > event.clientX)
                            && objetos[i].y < event.clientY
                            && (objetos[i].height + objetos[i].y > event.clientY)
                          ) {
                            objetoActual = objetos[i];
                            inicioY = event.clientY - objetos[i].y;
                            inicioX = event.clientX - objetos[i].x;
                            break;
                          }
                        }
                      }
                  }
            
                  cv.onmousemove = function(event) {
                    if (objetoActual != null) {
                      objetoActual.x = event.clientX - inicioX;
                      objetoActual.y = event.clientY - inicioY;
                      iman();
                    }
                    actualizar();
                  }
            
                  cv.onmouseup = function(evet) {
                    objetoActual = null;
                  }
                }
              </script>
            </body>
            </html>`
        )
    })
})
    })
})

app.get('/getEscenarioListAl',(req,res) =>{

    con.query('SELECT * FROM escenariosprofesores',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        
        var fila=''
        console.log(respuesta)

        respuesta.forEach(esc =>{
            fila += `<tr style="width: 100px; border: 1px solid;">
            <form method="get" action="/getEscenarioAl">
                <td><input value="${esc.id_escenario}" class="id" style="display: none;" name="id" type="text"></td>
                <td>${esc.tipo}</td>
                <td><button type="submit">Cargar</td>
            </form>
        </tr>`
        })

        return res.send(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>lista</title>
            </head>
            <body>
                <table>${fila}</table>
            </body>
            </html>`
        )
    })
})

app.get('/getEscenarioListPr',(req,res) =>{
    let idP = 1;

    con.query('SELECT * FROM escenariosprofesores WHERE id_usuario = '+idP,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        
        var fila=''
        console.log(respuesta)

        respuesta.forEach(esc =>{
            fila += `<tr style="width: 100px; border: 1px solid;">
            <form method="post" action="/deleteEscenario">
                <td><input value="${esc.id_escenario}" class="id" style="display: none;" name="id" type="text"></td>
                <td>${esc.tipo}</td>
                <td><button type="submit">Eliminar</td>
            </form>
        </tr>`
        })

        return res.send(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>lista</title>
            </head>
            <body>
                <table>${fila}</table>
            </body>
            </html>`
        )
    })
})

app.post('/deleteEscenario',(req,res) =>{
    let id = req.body.id

    con.query('DELETE FROM escenariosprofesores WHERE id_escenario = '+id,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

        return res.send(
            `<p>exito</p>`
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

    let idEsc,idElm

    con.query('INSERT INTO escenariosprofesores(id_usuario,tipo) values(1,"'+nombre+'")',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
    })
    con.query('SELECT id_escenario FROM escenariosprofesores',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        respuesta.forEach(maxim =>{
            idEsc = maxim.id_escenario
        })
        for(let i=0;i<arrX.length;i++){
            con.query('INSERT INTO elementos(id_escenario,descripcion,ubicacion_x,ubicacion_y,forma) values('+idEsc+',"'+arrTexto[i]+'",'+arrX[i]+','+arrY[i]+',"'+arrTipo[i]+'")',(err,respuesta,fields)=>{
                if(err)return console.log('ERROR',err);
        
            })
        }
        con.query('SELECT id_elemento FROM elementos',(err,respuesta,fields)=>{
            if(err)return console.log('ERROR',err);
            
            for(let i=0;i<arrX.length;i++){
                arrIds[arrX.length-1-i] = respuesta[respuesta.length-1-i].id_elemento
            }
            for(let i=0;i<arrDesde.length;i++){
                con.query('INSERT INTO relaciones(desde,hasta) values('+arrIds[arrDesde[i]]+','+arrIds[arrHacia[i]]+')',(err,respuesta,fields)=>{
                    if(err)return console.log('ERROR',err);
                    
                })
            }
        })
    })
    return res.send(`
        <p>a</p>    
    `)
})

app.post('/califEscAl',(req,res) =>{
    let calif = req.body.calif
    let idE = req.body.idE

    con.query('INSERT INTO escenariosusuarios(id_escenario,id_usuario,calificacion) values('+idE+',1,'+calif+')',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

        return res.send(`
        <p>calif: ${calif}</p>    
    `)
    })
    
})


app.listen(8080,()=>{
    console.log('Servidor escuchando en el puerto 8080')
})