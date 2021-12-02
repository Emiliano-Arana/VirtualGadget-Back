const express = require('express')
const mysql = require('mysql')
var app = express()
var bodyParser = require('body-parser')

var dbConfig= {
  host:'us-cdbr-east-04.cleardb.com',
  user: 'b3536c0cd563b4',
  password:'a038bf91',
  database:'heroku_a5616534128b5ae'
}

var con

function handleDisconnect() {
  con = mysql.createConnection(dbConfig); 

  con.connect(function(err) {              
    if(err) {                                     
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); 
    }                                     
  });                                     
                                          
  con.on('error', function(err) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {                                      
      throw err;                                  
    }
  });
}

handleDisconnect();

app.use( express.json() )
app.use(express.urlencoded({
    extended:true
}))

app.use(express.static('public'))

//listo
app.get('/getEscenarioAl',(req,res) =>{
    let id = req.query.id;
    let idsEl = []

    con.query('SELECT * FROM escenariosprofesores WHERE id_escenario = '+id,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

        let nom
        let desc

        respuesta.forEach(obj =>{
          nom = obj.tipo
          desc = obj.descripcion
        })

        con.query('SELECT elementos.id_elemento,elementos.ubicacion_x,elementos.ubicacion_y,elementos.descripcion,forma.nombre_forma FROM elementos INNER JOIN forma ON elementos.id_forma = forma.id_forma WHERE elementos.id_escenario = '+id,(err,respuesta,fields)=>{
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
                    tipo:'${obj.nombre_forma}',
                    texto:'${obj.descripcion}'
                });
            
                objetos.push({
                    x:100,y:100,
                    height:80,
                    width:120,
                    tipo:'${obj.nombre_forma}',
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
                        hasta: ${h},
                        txt: '${obj.valor}'
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
                  <p>${nom}</p>
                  <p>${desc}</p>
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
                      if(flechas[i].txt=='Si'){
                        cx.beginPath();
                        cx.moveTo(casillas[flechas[i].desde].x, casillas[flechas[i].desde].y+casillas[flechas[i].desde].height);
                        cx.fillText('Si',casillas[flechas[i].desde].x+10,casillas[flechas[i].desde].y+casillas[flechas[i].desde].height+10);
                      }else{
                        cx.beginPath();
                        cx.moveTo(casillas[flechas[i].desde].x+(casillas[flechas[i].desde].width/2), casillas[flechas[i].desde].y+(casillas[flechas[i].desde].height/2));
                        cx.fillText('No',casillas[flechas[i].desde].x+(casillas[flechas[i].desde].width/2)+10,casillas[flechas[i].desde].y+(casillas[flechas[i].desde].height/2)-10);
                      }
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
                      cx.arc(casillas[i].x, casillas[i].y, casillas[i].width/2, 0, Math.PI*2, false);
                      cx.fillText(casillas[i].texto,casillas[i].x-(casillas[i].width/2)+40,casillas[i].y);
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
                  let contLR = 0;
                  for(var i = 0; i < respuestasC.length; i++){
                    respuestasC[i] = false;
                  }
                  for(var i = 0; i < casillas.length; i++){
                    if(casillas[i].tipo=='limites'){
                      contLR += 1;
                    }
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
                  prom = Math.floor((cont+(contLR*10))/respuestasC.length);
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
//listo
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
//listo
app.get('/getEscenarioListPr',(req,res) =>{
    let idP = 15;

    con.query('SELECT * FROM escenariosprofesores WHERE id_profe = '+idP,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        
        var fila=''
        console.log(respuesta)

        respuesta.forEach(esc =>{
            fila += `<tr style="width: 100px; border: 1px solid;">
            <form method="post">
                <td><input value="${esc.id_escenario}" class="id" style="display: none;" name="id" type="text"></td>
                <td>${esc.tipo}</td>
                <td><button type="submit" formaction="/getEditEscenario">Editar</td>
                <td><button type="submit" formaction="/deleteEscenario">Eliminar</td>
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
//listo
app.post('/getEditEscenario',(req,res) =>{
  let id = req.body.id
  let idsEl = []

  con.query('SELECT * FROM escenariosprofesores WHERE id_escenario = '+id,(err,respuesta,fields)=>{
      if(err)return console.log('ERROR',err);
      let nom
      let desc

      respuesta.forEach(obj =>{
        nom = obj.tipo
        desc = obj.descripcion
    })

      con.query('SELECT elementos.id_elemento,elementos.ubicacion_x,elementos.ubicacion_y,elementos.descripcion,forma.nombre_forma FROM elementos INNER JOIN forma ON elementos.id_forma = forma.id_forma WHERE elementos.id_escenario = '+id,(err,respuesta,fields)=>{
          if(err)return console.log('ERROR',err);

          var fila=''
          

          respuesta.forEach(obj =>{
              idsEl.push({
                  idE:obj.id_elemento
              })
              fila += `
              objetos.push({
                  x:${obj.ubicacion_x},y:${obj.ubicacion_y},
                  height:80,
                  width:120,
                  tipo:'${obj.nombre_forma}',
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
                      hasta: ${h},
                      txt: '${obj.valor}'
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
                <form>
                  <input name="texto" type="text" id="textoFig" class="texto" placeholder="Ingrese el texto" maxlength="30">
                  <select name="tipo" id="forma">
                    <option value="proceso">proceso</option>
                    <option value="limites">limites</option>
                    <option value="decision">decision</option>
                    <option value="entradaSalida">entradaSalida</option>
                  </select>
                  <button type="button" class="boton" onclick="addFig()">Agregar</button>
                </form>
                <form>
                  <select name="valorFlecha" id="valorFl">
                    <option value="Si">Verdadero</option>
                    <option value="No">Falso</option>
                  </select>
                  <button type="button" class="boton" onclick="addArrow()">Flecha</button>
                </form>
                <button type="button" class="boton" onclick="deleteFig()">Borrar</button>
                <form action="/editEscenario" method="post">
                  <input name="nombre" id="nombre" maxlength="30" value="${nom}">
                  <input name="descripcion" id="descripcion" maxlength="500" value="${desc}">
                  <input type="text" id="desde" name="desde" style="display: none;">
                  <input type="text" id="hacia" name="hacia" style="display: none;">
                  <input type="text" id="txtFle" name="txtFle" style="display: none;">
                  <input type="text" id="tipoF" name="tipoF" style="display: none;">
                  <input type="text" id="texto" name="texto" style="display: none;">
                  <input type="text" id="posx" name="posx" style="display: none;">
                  <input type="text" id="posy" name="posy" style="display: none;">
                  <input type="text" id="ids" name="ids" style="display: none;">
                  <input type="text" id="idEsc" name="idEsc" style="display: none;" value="${id}">
                  <button type="submit" onclick="prepararCamp()">Guardar</button>
                </form>
              </div>
              <canvas width="1200" height="800" id="lienzo"></canvas>
            </div>
            <script>
              var cv, cx, objetos,flecha = false, objetoActual = null,elem1=-1,elem2=-1,flechas,valorFle='',boolDel=false,delF=-1;
              var inicioX = 0, inicioY = 0;
              objetos = [];
              flechas = [];
          
              function actualizar() {
                cx.fillStyle = '#f0f0f0';
                cx.fillRect(0, 0, 1200, 800);
                cx.font = "12px sans-serif";
                cx.fillStyle="black";
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
                for (var i = 0; i < flechas.length; i++) {
                  if(objetos[flechas[i].desde].tipo=='proceso'){
                    cx.beginPath();
                    cx.moveTo(objetos[flechas[i].desde].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].desde].y+objetos[flechas[i].desde].height);
                  }else if(objetos[flechas[i].desde].tipo=='limites'){
                    cx.beginPath();
                    cx.moveTo(objetos[flechas[i].desde].x, objetos[flechas[i].desde].y+(objetos[flechas[i].desde].width/2));
                  }else if(objetos[flechas[i].desde].tipo=='decision'){
                    if(flechas[i].txt=='Si'){
                      cx.beginPath();
                      cx.moveTo(objetos[flechas[i].desde].x, objetos[flechas[i].desde].y+objetos[flechas[i].desde].height);
                      cx.fillText('Si',objetos[flechas[i].desde].x+10,objetos[flechas[i].desde].y+objetos[flechas[i].desde].height+10);
                    }else{
                      cx.beginPath();
                      cx.moveTo(objetos[flechas[i].desde].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].desde].y+(objetos[flechas[i].desde].height/2));
                      cx.fillText('No',objetos[flechas[i].desde].x+(objetos[flechas[i].desde].width/2)+10,objetos[flechas[i].desde].y+(objetos[flechas[i].desde].height/2)-10);
                    }
                  }else if(objetos[flechas[i].desde].tipo=='entradaSalida'){
                    cx.beginPath();
                    cx.moveTo(objetos[flechas[i].desde].x-20+(objetos[flechas[i].desde].width/2), objetos[flechas[i].desde].y+objetos[flechas[i].desde].height);
                  }
          
                  if(objetos[flechas[i].hasta].tipo=='proceso'){
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)+5, objetos[flechas[i].hasta].y-5);
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)-5, objetos[flechas[i].hasta].y-5);
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                    cx.closePath();
                    cx.stroke();
                  }else if(objetos[flechas[i].hasta].tipo=='limites'){
                    cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2));
                    cx.lineTo(objetos[flechas[i].hasta].x+5, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2)-5);
                    cx.lineTo(objetos[flechas[i].hasta].x-5, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2)-5);
                    cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2));
                    cx.closePath();
                    cx.stroke();
                  }else if(objetos[flechas[i].hasta].tipo=='decision'){
                    cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y);
                    cx.lineTo(objetos[flechas[i].hasta].x+5, objetos[flechas[i].hasta].y-5);
                    cx.lineTo(objetos[flechas[i].hasta].x-5, objetos[flechas[i].hasta].y-5);
                    cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y);
                    cx.closePath();
                    cx.stroke();
                  }else if(objetos[flechas[i].hasta].tipo=='entradaSalida'){
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)+5, objetos[flechas[i].hasta].y-5);
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)-5, objetos[flechas[i].hasta].y-5);
                    cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                    cx.closePath();
                    cx.stroke();
                  }
                }
              }
          
              function prepararCamp(){
                let nomb = document.getElementById('nombre').value;
                let descr = document.getElementById('descripcion').value;
                var patTxtFig = /^[0-9a-zA-Z ]/;

                let verif = true;
                for(var i=0;i<nomb.length;i++){
                  if(patTxtFig.test(nomb[i])){
          
                  }else{
                      verif = false;
                  }
                }
                for(var i=0;i<descr.length;i++){
                  if(patTxtFig.test(descr[i])){
          
                  }else{
                      verif = false;
                  }
                }

                if(verif){
                  
                }else{
                  alert("Ingreso algun caracter invalido")
                }
                document.getElementById('desde').value = '';
                document.getElementById('hacia').value = '';
                document.getElementById('txtFle').value = '';
                document.getElementById('tipoF').value = '';
                document.getElementById('texto').value = '';
                document.getElementById('posx').value = '';
                document.getElementById('posy').value = '';
          
                for (var i = 0; i < objetos.length; i++) {
                  document.getElementById('tipoF').value += objetos[i].tipo+";";
                  document.getElementById('texto').value += objetos[i].texto+";";
                  document.getElementById('posx').value += objetos[i].x+";";
                  document.getElementById('posy').value += objetos[i].y+";";
                  document.getElementById('ids').value += i +";";
                }
                for (var i = 0; i < flechas.length; i++) {
                  document.getElementById('desde').value += flechas[i].desde+";";
                  document.getElementById('hacia').value += flechas[i].hasta+";";
                  document.getElementById('txtFle').value += flechas[i].txt+";";
                }
                document.getElementById('tipoF').value = document.getElementById('tipoF').value.substring(0,document.getElementById('tipoF').value.length-1);
                document.getElementById('texto').value = document.getElementById('texto').value.substring(0,document.getElementById('texto').value.length-1);
                document.getElementById('posx').value = document.getElementById('posx').value.substring(0,document.getElementById('posx').value.length-1);
                document.getElementById('posy').value = document.getElementById('posy').value.substring(0,document.getElementById('posy').value.length-1);
                document.getElementById('ids').value = document.getElementById('ids').value.substring(0,document.getElementById('ids').value.length-1);
                document.getElementById('desde').value = document.getElementById('desde').value.substring(0,document.getElementById('desde').value.length-1);
                document.getElementById('hacia').value = document.getElementById('hacia').value.substring(0,document.getElementById('hacia').value.length-1);
                document.getElementById('txtFle').value = document.getElementById('txtFle').value.substring(0,document.getElementById('txtFle').value.length-1);
                return verif;
              }
          
              function addFig(){
                let forma = document.getElementById('forma').value;
                let txtFig = document.getElementById('textoFig').value;

                var patTxtFig = /^[0-9a-zA-Z ]/;

                let verif = true;
                for(var i=0;i<txtFig.length;i++){
                  if(patTxtFig.test(txtFig[i])){

                  }else{
                      verif = false;
                  }
                }

                if(verif){
                  objetos.push({
                    x:100,y:100,
                    height:80,
                    width:120,
                    tipo:forma,
                    texto:txtFig
                  })
                }else{
                  alert("Ingreso algun caracter invalido")
                }
                actualizar();
              }

              function deleteFig(){
                boolDel = true;
              }
          
              function addArrow(){
                valorFle = document.getElementById('valorFl').value;
                flecha = true;
              }
          
              window.onload = function() {
                cv = document.getElementById('lienzo');
                cx = cv.getContext('2d');
          
                ${fila}
          
                cv.onmousedown = function(event) {
                  if(boolDel){
                    for (var i = 0; i < objetos.length; i++) {
                          if(objetos[i].tipo=='proceso'){
                            if (objetos[i].x < event.clientX
                              && (objetos[i].width + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              delF = i;
                              break;
                            }
                          }else if(objetos[i].tipo=='limites'){
                            if (objetos[i].x-(objetos[i].width/2) < event.clientX
                              && (objetos[i].x + (objetos[i].width/2) > event.clientX)
                              && objetos[i].y-(objetos[i].width/2) < event.clientY
                              && ((objetos[i].width/2) + objetos[i].y > event.clientY)
                            ) {
                              delF = i;
                              break;
                            }
                          }else if(objetos[i].tipo=='decision'){
                            if ((objetos[i].x-(objetos[i].width/2)) < event.clientX
                              && ((objetos[i].width/2) + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              delF = i;
                              break;
                            }
                          }else if(objetos[i].tipo=='entradaSalida'){
                            if ((objetos[i].x-20) < event.clientX
                              && (objetos[i].width + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              delF = i;
                              break;
                            }
                          }
                        }
                    if(delF!=-1){
                      objetos.splice(delF,1);
                      for(let i=0;i<flechas.length;i++){
                        if(flechas[i].hasta==delF||flechas[i].desde==delF){
                          flechas.splice(i,1)
                          i-=1;
                        }
                      }
                      for(let i=0;i<flechas.length;i++){
                        if(flechas[i].hasta>delF){
                          flechas[i].hasta-=1;
                        }
                        if(flechas[i].desde>delF){
                          flechas[i].desde-=1;
                        }
                      }
                    }
                    delF=-1;
                    boolDel = false;
                  }else{
                    if(flecha){
                      if(elem1==-1){
                        for (var i = 0; i < objetos.length; i++) {
                          if(objetos[i].tipo=='proceso'){
                            if (objetos[i].x < event.clientX
                              && (objetos[i].width + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              elem1=i;
                              break;
                            }
                          }else if(objetos[i].tipo=='limites'){
                            if (objetos[i].x-(objetos[i].width/2) < event.clientX
                              && (objetos[i].x + (objetos[i].width/2) > event.clientX)
                              && objetos[i].y-(objetos[i].width/2) < event.clientY
                              && ((objetos[i].width/2) + objetos[i].y > event.clientY)
                            ) {
                              elem1=i;
                              break;
                            }
                          }else if(objetos[i].tipo=='decision'){
                            if ((objetos[i].x-(objetos[i].width/2)) < event.clientX
                              && ((objetos[i].width/2) + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              elem1=i;
                              break;
                            }
                          }else if(objetos[i].tipo=='entradaSalida'){
                            if ((objetos[i].x-20) < event.clientX
                              && (objetos[i].width + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              elem1=i;
                              break;
                            }
                          }
                        }
                        if(elem1==-1){
                          flecha = false;
                        }
                      }else{
                        for (var i = 0; i < objetos.length; i++) {
                          if(objetos[i].tipo=='proceso'){
                            if (objetos[i].x < event.clientX
                              && (objetos[i].width + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              elem2=i;
                              break;
                            }
                          }else if(objetos[i].tipo=='limites'){
                            if (objetos[i].x-(objetos[i].width/2) < event.clientX
                              && (objetos[i].x + (objetos[i].width/2) > event.clientX)
                              && objetos[i].y-(objetos[i].width/2) < event.clientY
                              && ((objetos[i].width/2) + objetos[i].y > event.clientY)
                            ) {
                              elem2=i;
                              break;
                            }
                          }else if(objetos[i].tipo=='decision'){
                            if ((objetos[i].x-(objetos[i].width/2)) < event.clientX
                              && ((objetos[i].width/2) + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              elem2=i;
                              break;
                            }
                          }else if(objetos[i].tipo=='entradaSalida'){
                            if ((objetos[i].x-20) < event.clientX
                              && (objetos[i].width + objetos[i].x > event.clientX)
                              && objetos[i].y < event.clientY
                              && (objetos[i].height + objetos[i].y > event.clientY)
                            ) {
                              elem2=i;
                              break;
                            }
                          }
                        }
                        if(elem2!=-1){
                        flechas.push({
                          desde:elem1,
                          hasta:elem2,
                          txt:valorFle
                        });
                      }
                        elem1=-1;
                        elem2=-1;
                        flecha = false;
                      }
                    }else{
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
                  }
                }
          
                cv.onmousemove = function(event) {
                  if (objetoActual != null) {
                    objetoActual.x = event.clientX - inicioX;
                    objetoActual.y = event.clientY - inicioY;
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
//listo
app.post('/deleteEscenario',(req,res) =>{
    let id = req.body.id

    con.query('DELETE FROM escenariosprofesores WHERE id_escenario = '+id,(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

        return res.send(
            `<p>exito</p>`
        )
    })
})
//listo
app.post('/editEscenario',(req,res) =>{
  let nombre = req.body.nombre
  let desc = req.body.descripcion
  let desde = req.body.desde
  let hacia = req.body.hacia
  let txtF = req.body.txtFle
  let tipo = req.body.tipoF
  let texto = req.body.texto
  let x = req.body.posx
  let y = req.body.posy
  let ids = req.body.ids
  let idEsc = req.body.idEsc

  let arrtxtF = txtF.split(";")
  let arrDesde = desde.split(";")
  let arrHacia = hacia.split(";")
  let arrTipoTxt = tipo.split(";")
  let arrTexto = texto.split(";")
  let arrX = x.split(";")
  let arrY = y.split(";")
  let arrIds = ids.split(";")

  let arrTipo = new Array(arrTipoTxt.length)

  for(let i=0;i<arrTipoTxt.length;i++){
    if(arrTipoTxt[i]=='proceso'){
      arrTipo[i]=1
    }
    if(arrTipoTxt[i]=='limites'){
      arrTipo[i]=2
    }
    if(arrTipoTxt[i]=='decision'){
      arrTipo[i]=3
    }
    if(arrTipoTxt[i]=='entradaSalida'){
      arrTipo[i]=4
    }
  }

  con.query('update escenariosprofesores set tipo = "'+nombre+'",descripcion = "'+desc+'" where id_escenario = '+idEsc,(err,respuesta,fields)=>{
      if(err)return console.log('ERROR',err);
  })
  con.query('DELETE FROM elementos WHERE id_escenario = '+idEsc,(err,respuesta,fields)=>{
    if(err)return console.log('ERROR',err);
  })
      for(let i=0;i<arrX.length;i++){
          con.query('INSERT INTO elementos(id_escenario,descripcion,ubicacion_x,ubicacion_y,id_forma) values('+idEsc+',"'+arrTexto[i]+'",'+arrX[i]+','+arrY[i]+','+arrTipo[i]+')',(err,respuesta,fields)=>{
              if(err)return console.log('ERROR',err);
      
          })
      }
      con.query('SELECT id_elemento FROM elementos',(err,respuesta,fields)=>{
          if(err)return console.log('ERROR',err);
          
          for(let i=0;i<arrX.length;i++){
              arrIds[arrX.length-1-i] = respuesta[respuesta.length-1-i].id_elemento
          }
          for(let i=0;i<arrDesde.length;i++){
              con.query('INSERT INTO relaciones(desde,hasta,valor) values('+arrIds[arrDesde[i]]+','+arrIds[arrHacia[i]]+',"'+arrtxtF[i]+'")',(err,respuesta,fields)=>{
                  if(err)return console.log('ERROR',err);
                  
              })
          }
      })
  return res.send(`
      <p>listo</p>    
  `)
})
//listo
app.post('/addEscenario',(req,res) =>{
    let nombre = req.body.nombre
    let desc = req.body.descripcion
    let desde = req.body.desde
    let hacia = req.body.hacia
    let txtF = req.body.txtFle
    let tipo = req.body.tipoF
    let texto = req.body.texto
    let x = req.body.posx
    let y = req.body.posy
    let ids = req.body.ids

    let arrtxtF = txtF.split(";")
    let arrDesde = desde.split(";")
    let arrHacia = hacia.split(";")
    let arrTipoTxt = tipo.split(";")
    let arrTexto = texto.split(";")
    let arrX = x.split(";")
    let arrY = y.split(";")
    let arrIds = ids.split(";")

    let arrTipo = new Array(arrTipoTxt.length)

    for(let i=0;i<arrTipoTxt.length;i++){
      if(arrTipoTxt[i]=='proceso'){
        arrTipo[i]=1
      }
      if(arrTipoTxt[i]=='limites'){
        arrTipo[i]=2
      }
      if(arrTipoTxt[i]=='decision'){
        arrTipo[i]=3
      }
      if(arrTipoTxt[i]=='entradaSalida'){
        arrTipo[i]=4
      }
    }

    let idEsc

    con.query('INSERT INTO escenariosprofesores(id_profe,tipo,descripcion) values(15,"'+nombre+'","'+desc+'")',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
    })
    con.query('SELECT id_escenario FROM escenariosprofesores',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);
        respuesta.forEach(maxim =>{
            idEsc = maxim.id_escenario
        })
        for(let i=0;i<arrX.length;i++){
            con.query('INSERT INTO elementos(id_escenario,descripcion,ubicacion_x,ubicacion_y,id_forma) values('+idEsc+',"'+arrTexto[i]+'",'+arrX[i]+','+arrY[i]+','+arrTipo[i]+')',(err,respuesta,fields)=>{
                if(err)return console.log('ERROR',err);
        
            })
        }
        con.query('SELECT id_elemento FROM elementos',(err,respuesta,fields)=>{
            if(err)return console.log('ERROR',err);
            
            for(let i=0;i<arrX.length;i++){
                arrIds[arrX.length-1-i] = respuesta[respuesta.length-1-i].id_elemento
            }
            for(let i=0;i<arrDesde.length;i++){
                con.query('INSERT INTO relaciones(desde,hasta,valor) values('+arrIds[arrDesde[i]]+','+arrIds[arrHacia[i]]+',"'+arrtxtF[i]+'")',(err,respuesta,fields)=>{
                    if(err)return console.log('ERROR',err);
                    
                })
            }
        })
    })
    return res.send(`
        <p>a</p>    
    `)
})
//listo
app.post('/califEscAl',(req,res) =>{
    let calif = req.body.calif
    let id = req.body.idE
    let idsEl = []
    
    con.query('INSERT INTO escenariosusuarios(id_escenario,id_usuario,calificacion) values('+id+',5,'+calif+')',(err,respuesta,fields)=>{
        if(err)return console.log('ERROR',err);

    })
      con.query('SELECT * FROM escenariosprofesores WHERE id_escenario = '+id,(err,respuesta,fields)=>{
          if(err)return console.log('ERROR',err);
          let nom
          let desc
    
          respuesta.forEach(obj =>{
            nom = obj.tipo
            desc = obj.descripcion
        })
    
          con.query('SELECT elementos.id_elemento,elementos.ubicacion_x,elementos.ubicacion_y,elementos.descripcion,forma.nombre_forma FROM elementos INNER JOIN forma ON elementos.id_forma = forma.id_forma WHERE elementos.id_escenario = '+id,(err,respuesta,fields)=>{
              if(err)return console.log('ERROR',err);
    
              var fila=''
              console.log(respuesta)
              respuesta.forEach(obj =>{
                  idsEl.push({
                      idE:obj.id_elemento
                  })
                  fila += `
                  objetos.push({
                      x:${obj.ubicacion_x},y:${obj.ubicacion_y},
                      height:80,
                      width:120,
                      tipo:'${obj.nombre_forma}',
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
                          hasta: ${h},
                          txt: '${obj.valor}'
                      });
                      `
                  })
    
                  fila += filaF
                  
    console.log(fila)
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
                  <p>${nom}</p>
                  <p>${desc}</p>
                  <p>calificacion:${calif}</p>
                  </div>
                  <canvas width="1200" height="800" id="lienzo"></canvas>
                </div>
                <script>
                  var cv, cx, objetos,flecha = false, objetoActual = null,elem1=-1,elem2=-1,flechas,valorFle='',boolDel=false,delF=-1;
                  var inicioX = 0, inicioY = 0;
                  objetos = [];
                  flechas = [];
              
                  function actualizar() {
                    cx.fillStyle = '#f0f0f0';
                    cx.fillRect(0, 0, 1200, 800);
                    cx.font = "12px sans-serif";
                    cx.fillStyle="black";
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
                    for (var i = 0; i < flechas.length; i++) {
                      if(objetos[flechas[i].desde].tipo=='proceso'){
                        cx.beginPath();
                        cx.moveTo(objetos[flechas[i].desde].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].desde].y+objetos[flechas[i].desde].height);
                      }else if(objetos[flechas[i].desde].tipo=='limites'){
                        cx.beginPath();
                        cx.moveTo(objetos[flechas[i].desde].x, objetos[flechas[i].desde].y+(objetos[flechas[i].desde].width/2));
                      }else if(objetos[flechas[i].desde].tipo=='decision'){
                        if(flechas[i].txt=='Si'){
                          cx.beginPath();
                          cx.moveTo(objetos[flechas[i].desde].x, objetos[flechas[i].desde].y+objetos[flechas[i].desde].height);
                          cx.fillText('Si',objetos[flechas[i].desde].x+10,objetos[flechas[i].desde].y+objetos[flechas[i].desde].height+10);
                        }else{
                          cx.beginPath();
                          cx.moveTo(objetos[flechas[i].desde].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].desde].y+(objetos[flechas[i].desde].height/2));
                          cx.fillText('No',objetos[flechas[i].desde].x+(objetos[flechas[i].desde].width/2)+10,objetos[flechas[i].desde].y+(objetos[flechas[i].desde].height/2)-10);
                        }
                      }else if(objetos[flechas[i].desde].tipo=='entradaSalida'){
                        cx.beginPath();
                        cx.moveTo(objetos[flechas[i].desde].x-20+(objetos[flechas[i].desde].width/2), objetos[flechas[i].desde].y+objetos[flechas[i].desde].height);
                      }
              
                      if(objetos[flechas[i].hasta].tipo=='proceso'){
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)+5, objetos[flechas[i].hasta].y-5);
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)-5, objetos[flechas[i].hasta].y-5);
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                        cx.closePath();
                        cx.stroke();
                      }else if(objetos[flechas[i].hasta].tipo=='limites'){
                        cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2));
                        cx.lineTo(objetos[flechas[i].hasta].x+5, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2)-5);
                        cx.lineTo(objetos[flechas[i].hasta].x-5, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2)-5);
                        cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y-(objetos[flechas[i].hasta].width/2));
                        cx.closePath();
                        cx.stroke();
                      }else if(objetos[flechas[i].hasta].tipo=='decision'){
                        cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y);
                        cx.lineTo(objetos[flechas[i].hasta].x+5, objetos[flechas[i].hasta].y-5);
                        cx.lineTo(objetos[flechas[i].hasta].x-5, objetos[flechas[i].hasta].y-5);
                        cx.lineTo(objetos[flechas[i].hasta].x, objetos[flechas[i].hasta].y);
                        cx.closePath();
                        cx.stroke();
                      }else if(objetos[flechas[i].hasta].tipo=='entradaSalida'){
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)+5, objetos[flechas[i].hasta].y-5);
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2)-5, objetos[flechas[i].hasta].y-5);
                        cx.lineTo(objetos[flechas[i].hasta].x+(objetos[flechas[i].desde].width/2), objetos[flechas[i].hasta].y);
                        cx.closePath();
                        cx.stroke();
                      }
                    }
                  }
              
                  window.onload = function() {
                    cv = document.getElementById('lienzo');
                    cx = cv.getContext('2d');
              
                    ${fila}
              
                    
              
                    actualizar();
                  }
                </script>
              </body>
              </html>`
          )
      })
    })
      })
    
})


app.listen(8080,()=>{
    console.log('Servidor escuchando en el puerto 8080')
})