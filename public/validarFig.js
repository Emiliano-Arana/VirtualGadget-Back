function validarDatos(){
    var verif = true;

    var usu = document.IniciarSesion.usuario.value;
    var contra = document.IniciarSesion.password.value;

    var patUsu = /[A-Za-z0-9_-]/;
    var patPass = /[$%A-Za-zñáéíóú0-9_-]/;

    if(usu.length<1){
        verif = false;
    }

    if(usu.length>15){
        verif = false;
    }

    if(contra.length<1){
        verif = false;
    }

    if(contra.length>15){
        verif = false;
    }

    for(var i=0;i<usu.length;i++){
        if(patUsu.test(usu[i])){

        }else{
            verif = false;
        }
    }

    for(var i=0;i<usu.length;i++){
        if(patPass.test(contra[i])){

        }else{
            verif = false;
        }
    }

    if(verif){

    }else{
        alert("Ingreso algun caracter no valido")
    }

    return verif;
}