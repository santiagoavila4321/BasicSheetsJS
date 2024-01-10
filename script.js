
var tabla=new SheetsTable({
    element:document.getElementById('TablaSheet'),
    opcions:{
        addcolumns:true,
        columns:11,
        rows:20,
    }
});

function pegarDesdePortapapeles() {
    navigator.clipboard.readText()
      .then(texto => {
        console.log('Texto pegado:', texto);
      })
      .catch(err => {
        console.error('Error al pegar el texto', err);
      });
  }